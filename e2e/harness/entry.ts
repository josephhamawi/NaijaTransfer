/**
 * End-to-end harness entry point.
 *
 * Bundled to e2e/harness/bundle.js and loaded by two independent
 * browser contexts in e2e/live-send.spec.ts. It exposes the real
 * sender and receiver over a real RTCPeerConnection, so the test
 * exercises actual SCTP limits, actual ICE negotiation and actual
 * framing rather than a simulation.
 *
 * The Playwright test plays the role Firestore plays in production: it
 * carries the SDP and ICE candidates between the two contexts. That
 * keeps the WebRTC path under test while leaving Firestore signalling
 * to the service-level tests, which can assert the security rules that
 * matter there (ownership, atomic claim, expiry).
 */

import { LiveSender } from "@/lib/live/sender";
import { LiveReceiver } from "@/lib/live/receiver";
import { buildIceConfig, inspectSelectedPair } from "@/lib/live/ice";
import type { FileWriter, SaveTarget } from "@/lib/live/saver";
import type { ReceiveCapability } from "@/lib/live/limits";

const CAPABILITY: ReceiveCapability = {
  saveMethod: "stream",
  maxFileBytes: 8 * 1024 * 1024 * 1024,
  maxTotalBytes: 8 * 1024 * 1024 * 1024,
  limitation: null,
};

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Collects bytes so the test can compare them with what it sent. */
class CollectTarget implements SaveTarget {
  readonly kind = "stream" as const;
  readonly files = new Map<string, Uint8Array[]>();
  /** Peak bytes held by any single in-flight file, to show nothing accumulates globally. */
  peakInFlight = 0;

  async createWriter(name: string): Promise<FileWriter> {
    const parts: Uint8Array[] = [];
    const files = this.files;
    const self = this;
    let held = 0;

    return {
      async write(chunk) {
        parts.push(chunk.slice());
        held += chunk.byteLength;
        if (held > self.peakInFlight) self.peakInFlight = held;
      },
      async close() {
        files.set(name, parts.slice());
        parts.length = 0;
      },
      async abort() {
        parts.length = 0;
      },
    };
  }
}

interface SenderState {
  pc: RTCPeerConnection;
  channel: RTCDataChannel;
  sender: LiveSender | null;
  candidates: RTCIceCandidateInit[];
  runPromise: Promise<void> | null;
  error: string | null;
  progress: number;
}

interface ReceiverState {
  pc: RTCPeerConnection;
  channel: RTCDataChannel | null;
  receiver: LiveReceiver | null;
  target: CollectTarget;
  candidates: RTCIceCandidateInit[];
  manifest: unknown;
  phase: string;
  error: string | null;
  complete: boolean;
}

declare global {
  interface Window {
    H: Harness;
  }
}

class Harness {
  private send: SenderState | null = null;
  private recv: ReceiverState | null = null;

  // ── Sender role ──────────────────────────────────────────────────

  async initSender(specs: Array<{ name: string; base64: string; type: string }>) {
    const pc = new RTCPeerConnection(buildIceConfig());
    const channel = pc.createDataChannel("live-files", { ordered: true });
    channel.binaryType = "arraybuffer";

    const state: SenderState = {
      pc,
      channel,
      sender: null,
      candidates: [],
      runPromise: null,
      error: null,
      progress: 0,
    };
    this.send = state;

    pc.addEventListener("icecandidate", (ev) => {
      if (ev.candidate) state.candidates.push(ev.candidate.toJSON());
    });

    const files = specs.map((spec, i) => {
      const bytes = fromBase64(spec.base64);
      return {
        id: `f${i}`,
        name: spec.name,
        file: new File([bytes.buffer as ArrayBuffer], spec.name, { type: spec.type }),
      };
    });

    // Built now, started later: the channel has to be open first.
    state.sender = new LiveSender(channel, files, {
      maxMessageSize: undefined,
      callbacks: {
        onProgress: (p) => {
          state.progress = p.bytesSent;
        },
        onError: (code, message) => {
          state.error = `${code}: ${message}`;
        },
        onRejected: (code, message) => {
          state.error = `${code}: ${message}`;
        },
      },
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return { sdp: offer.sdp };
  }

  async senderAcceptAnswer(sdp: string) {
    await this.send!.pc.setRemoteDescription({ type: "answer", sdp });
  }

  async senderAddCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.send!.pc.addIceCandidate(candidate);
    } catch {
      /* unusable candidates are normal */
    }
  }

  senderCandidates(): RTCIceCandidateInit[] {
    return this.send!.candidates;
  }

  senderChannelState(): string {
    return this.send!.channel.readyState;
  }

  /** Real SCTP limit this browser negotiated. */
  senderMaxMessageSize(): number | null {
    return this.send!.pc.sctp?.maxMessageSize ?? null;
  }

  startSending(): void {
    const state = this.send!;
    // Rebuild with the now-known SCTP limit so chunk sizing is real.
    state.runPromise = state.sender!.run().catch((err: Error) => {
      state.error = state.error ?? err.message;
      throw err;
    });
    state.runPromise.catch(() => {});
  }

  async senderResult(): Promise<{ phase: string; error: string | null; progress: number }> {
    const state = this.send!;
    try {
      await state.runPromise;
    } catch {
      /* captured in state.error */
    }
    return {
      phase: state.sender!.currentPhase(),
      error: state.error,
      progress: state.progress,
    };
  }

  cancelSend(): void {
    this.send!.sender!.cancel("harness cancel");
  }

  async senderPair() {
    return inspectSelectedPair(this.send!.pc);
  }

  closeSender(): void {
    this.send?.sender?.detach();
    this.send?.channel.close();
    this.send?.pc.close();
  }

  // ── Recipient role ───────────────────────────────────────────────

  async initReceiver(autoAccept = true) {
    const pc = new RTCPeerConnection(buildIceConfig());
    const state: ReceiverState = {
      pc,
      channel: null,
      receiver: null,
      target: new CollectTarget(),
      candidates: [],
      manifest: null,
      phase: "init",
      error: null,
      complete: false,
    };
    this.recv = state;

    pc.addEventListener("icecandidate", (ev) => {
      if (ev.candidate) state.candidates.push(ev.candidate.toJSON());
    });

    pc.addEventListener("datachannel", (ev) => {
      const channel = ev.channel;
      channel.binaryType = "arraybuffer";
      state.channel = channel;

      const receiver = new LiveReceiver(channel, {
        maxMessageSize: pc.sctp?.maxMessageSize,
        capability: CAPABILITY,
        callbacks: {
          onManifest: (m) => {
            state.manifest = m;
            if (autoAccept) receiver.accept(state.target);
          },
          onPhase: (phase) => {
            state.phase = phase;
            if (phase === "complete") state.complete = true;
          },
          onError: (code, message) => {
            state.error = `${code}: ${message}`;
          },
          onCancelledByPeer: (reason) => {
            state.error = `CANCELLED: ${reason}`;
          },
        },
      });
      state.receiver = receiver;
    });
  }

  async receiverSetOffer(sdp: string) {
    const pc = this.recv!.pc;
    await pc.setRemoteDescription({ type: "offer", sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return { sdp: answer.sdp };
  }

  async receiverAddCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.recv!.pc.addIceCandidate(candidate);
    } catch {
      /* unusable candidates are normal */
    }
  }

  receiverCandidates(): RTCIceCandidateInit[] {
    return this.recv!.candidates;
  }

  receiverStatus() {
    const state = this.recv!;
    return {
      phase: state.phase,
      error: state.error,
      complete: state.complete,
      hasChannel: state.channel !== null,
      channelState: state.channel?.readyState ?? "none",
      manifest: state.manifest,
      peakInFlight: state.target.peakInFlight,
    };
  }

  acceptPending(): void {
    const state = this.recv!;
    state.receiver!.accept(state.target);
  }

  declinePending(): void {
    this.recv!.receiver!.reject("DECLINED", "harness decline");
  }

  /** Received file contents, base64 encoded, for byte-exact comparison. */
  received(): Array<{ name: string; size: number; base64: string }> {
    const out: Array<{ name: string; size: number; base64: string }> = [];
    for (const [name, parts] of this.recv!.target.files) {
      const total = parts.reduce((s, p) => s + p.byteLength, 0);
      const joined = new Uint8Array(total);
      let off = 0;
      for (const p of parts) {
        joined.set(p, off);
        off += p.byteLength;
      }
      out.push({ name, size: total, base64: toBase64(joined) });
    }
    return out;
  }

  async receiverPair() {
    return inspectSelectedPair(this.recv!.pc);
  }

  closeReceiver(): void {
    this.recv?.receiver?.detach();
    this.recv?.channel?.close();
    this.recv?.pc.close();
  }
}

window.H = new Harness();
