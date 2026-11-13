/**
 * Live Send — sender engine.
 *
 * Takes an open DataChannel and a list of Files, and pushes them to the
 * peer one at a time. Knows nothing about Firebase, React or the DOM
 * beyond `File`/`Blob`, which keeps it unit-testable and lets the
 * end-to-end harness drive it directly.
 *
 * Memory discipline: a file is read through `File.slice()` one chunk at
 * a time and each chunk is released as soon as it is queued. The whole
 * file is never resident, no matter its size.
 *
 * Flow control: SCTP will happily accept more than the network can
 * carry, growing an unbounded in-browser queue. `bufferedAmount` is
 * checked before every send and the loop parks on
 * `bufferedamountlow` once the queue passes the high-water mark.
 */

import {
  BUFFER_HIGH_WATER,
  BUFFER_LOW_WATER,
  Crc32,
  chunkSizeUnsupported,
  decodeControl,
  encodeControl,
  encodeFrame,
  negotiateChunkSize,
  safeFileName,
  type ControlMessage,
  type ManifestFile,
  type SaveMethod,
} from "./protocol";

export interface DataChannelLike {
  readonly bufferedAmount: number;
  bufferedAmountLowThreshold: number;
  readonly readyState: string;
  send(data: string): void;
  send(data: ArrayBuffer): void;
  addEventListener(type: string, listener: (ev: unknown) => void): void;
  removeEventListener(type: string, listener: (ev: unknown) => void): void;
  close(): void;
}

export interface SendFile {
  /** Stable id for the session. */
  id: string;
  file: Blob & { name?: string };
  /** Name as selected, before sanitising. */
  name: string;
}

export type SenderPhase =
  | "connecting"
  | "awaiting-acceptance"
  | "sending"
  | "complete"
  | "cancelled"
  | "failed";

export interface SenderProgress {
  /** Bytes handed to the channel across the whole transfer. */
  bytesSent: number;
  totalBytes: number;
  fileIndex: number;
  fileCount: number;
  currentFileName: string;
  /** Bytes the receiver has acknowledged as saved. */
  bytesAcknowledged: number;
}

export interface SenderCallbacks {
  onPhase?(phase: SenderPhase, detail?: string): void;
  /** Fires often; the UI is expected to throttle its own repaints. */
  onProgress?(progress: SenderProgress): void;
  onError?(code: string, message: string): void;
  /** Receiver declined, or its browser cannot take this transfer. */
  onRejected?(code: string, message: string): void;
}

export interface SenderOptions {
  /** Reported by `RTCPeerConnection.sctp?.maxMessageSize`. */
  maxMessageSize?: number;
  callbacks?: SenderCallbacks;
}

const ACK_TIMEOUT_MS = 60_000;

export class LiveSender {
  private readonly channel: DataChannelLike;
  private readonly files: SendFile[];
  private readonly cb: SenderCallbacks;
  private readonly chunkSize: number;
  private readonly totalBytes: number;

  private phase: SenderPhase = "connecting";
  private cancelled = false;
  private bytesSent = 0;
  private bytesAcknowledged = 0;
  private currentIndex = 0;

  private acceptResolve: ((msg: Extract<ControlMessage, { t: "accept" }>) => void) | null = null;
  private acceptReject: ((err: Error) => void) | null = null;
  private ackWaiters = new Map<
    number,
    { resolve: (m: Extract<ControlMessage, { t: "file-ack" }>) => void; reject: (e: Error) => void }
  >();
  private drainWaiters: Array<() => void> = [];
  private completeResolve: (() => void) | null = null;

  private readonly onMessage = (ev: unknown) => this.handleMessage(ev as { data: unknown });
  private readonly onBufferedLow = () => {
    const waiters = this.drainWaiters;
    this.drainWaiters = [];
    for (const w of waiters) w();
  };
  private readonly onClose = () => this.failAllWaiters(new Error("CHANNEL_CLOSED"));
  private readonly onError = () => this.failAllWaiters(new Error("CHANNEL_ERROR"));

  constructor(channel: DataChannelLike, files: SendFile[], options: SenderOptions = {}) {
    this.channel = channel;
    this.files = files;
    this.cb = options.callbacks ?? {};
    this.chunkSize = negotiateChunkSize(options.maxMessageSize);
    this.totalBytes = files.reduce((sum, f) => sum + f.file.size, 0);

    if (chunkSizeUnsupported(options.maxMessageSize)) {
      // Surfaced by start() so construction stays side-effect free.
      this.unsupported = true;
    }

    channel.bufferedAmountLowThreshold = BUFFER_LOW_WATER;
    channel.addEventListener("message", this.onMessage);
    channel.addEventListener("bufferedamountlow", this.onBufferedLow);
    channel.addEventListener("close", this.onClose);
    channel.addEventListener("error", this.onError);
  }

  private unsupported = false;

  /** Manifest as the peer will see it: safe names, stable ids. */
  manifest(): ManifestFile[] {
    return this.files.map((f) => ({
      id: f.id,
      name: safeFileName(f.name),
      size: f.file.size,
      mimeType: (f.file as Blob).type || "application/octet-stream",
    }));
  }

  /**
   * Run the whole session: handshake, manifest, acceptance, then every
   * file in order. Resolves when the receiver confirms completion.
   */
  async run(): Promise<void> {
    try {
      if (this.unsupported) {
        throw new ProtocolError(
          "CHANNEL_TOO_SMALL",
          "This browser pair cannot carry Live Send. Try Chrome or Edge on desktop."
        );
      }

      this.setPhase("connecting");
      this.send(encodeControl({ t: "hello", role: "sender", maxMessageSize: this.chunkSize }));

      const manifest = this.manifest();
      this.send(
        encodeControl({ t: "manifest", files: manifest, totalBytes: this.totalBytes })
      );

      this.setPhase("awaiting-acceptance");
      const accept = await this.waitForAccept();

      // The receiver may only be able to take smaller messages than we
      // can send. Honour the smaller of the two.
      const effectiveChunk = Math.min(this.chunkSize, Math.max(1, accept.chunkSize));

      this.setPhase("sending");
      for (let i = 0; i < this.files.length; i++) {
        if (this.cancelled) throw new ProtocolError("CANCELLED", "Transfer cancelled.");
        this.currentIndex = i;
        await this.sendOneFile(i, effectiveChunk, accept.saveMethod);
      }

      this.send(encodeControl({ t: "all-sent" }));
      await this.waitForComplete();
      this.setPhase("complete");
    } catch (err) {
      if (this.cancelled) {
        this.setPhase("cancelled");
        return;
      }
      const code = err instanceof ProtocolError ? err.code : "SEND_FAILED";
      const message =
        err instanceof ProtocolError
          ? err.message
          : "The connection dropped mid-transfer. Restart the transfer to try again.";
      this.setPhase("failed", message);
      this.cb.onError?.(code, message);
      throw err;
    } finally {
      this.detach();
    }
  }

  /** Stop sending and tell the peer why. Safe to call at any point. */
  cancel(reason = "Cancelled by sender"): void {
    if (this.cancelled) return;
    this.cancelled = true;
    try {
      if (this.channel.readyState === "open") {
        this.send(encodeControl({ t: "cancel", by: "sender", reason }));
      }
    } catch {
      /* channel already gone */
    }
    this.failAllWaiters(new Error("CANCELLED"));
    this.setPhase("cancelled");
  }

  // ── internals ──────────────────────────────────────────────────────

  private async sendOneFile(
    index: number,
    chunkSize: number,
    _saveMethod: SaveMethod
  ): Promise<void> {
    const entry = this.files[index];
    const size = entry.file.size;
    const crc = new Crc32();

    this.send(
      encodeControl({ t: "file-start", fileId: entry.id, index, size })
    );

    let offset = 0;
    let sequence = 0;

    while (offset < size) {
      if (this.cancelled) throw new ProtocolError("CANCELLED", "Transfer cancelled.");
      await this.waitForDrain();
      if (this.channel.readyState !== "open") {
        throw new ProtocolError(
          "CHANNEL_CLOSED",
          "Connection interrupted — restart the transfer."
        );
      }

      const end = Math.min(offset + chunkSize, size);
      // slice() is a view description, not a copy: nothing is read from
      // disk until arrayBuffer() resolves, and only this slice is.
      const blob = entry.file.slice(offset, end);
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      crc.update(bytes);
      this.send(encodeFrame(index, sequence, bytes));

      offset = end;
      sequence += 1;
      this.bytesSent += bytes.byteLength;
      this.emitProgress(entry.name);
    }

    this.send(
      encodeControl({
        t: "file-end",
        fileId: entry.id,
        index,
        bytes: size,
        crc32: crc.value(),
      })
    );

    const ack = await this.waitForAck(index);
    if (!ack.ok) {
      throw new ProtocolError(
        "RECEIVER_REJECTED_FILE",
        ack.error || "The recipient could not save a file. Restart the transfer."
      );
    }
    if (ack.bytes !== size || ack.crc32 !== crc.value()) {
      throw new ProtocolError(
        "INTEGRITY_MISMATCH",
        "A file arrived corrupted. Restart the transfer."
      );
    }

    this.bytesAcknowledged += size;
    this.emitProgress(entry.name);
  }

  /**
   * Park until the channel's queue drains below the low-water mark.
   *
   * Without this the loop reads the file as fast as the disk allows and
   * every chunk piles into `bufferedAmount`, which is how a large send
   * balloons the tab's memory and eventually kills the channel.
   */
  private waitForDrain(): Promise<void> {
    if (this.channel.bufferedAmount < BUFFER_HIGH_WATER) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.drainWaiters.push(resolve);
    });
  }

  private waitForAccept(): Promise<Extract<ControlMessage, { t: "accept" }>> {
    return new Promise((resolve, reject) => {
      this.acceptResolve = resolve;
      this.acceptReject = reject;
    });
  }

  private waitForAck(index: number): Promise<Extract<ControlMessage, { t: "file-ack" }>> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.ackWaiters.delete(index);
        reject(
          new ProtocolError(
            "ACK_TIMEOUT",
            "The recipient stopped responding. Restart the transfer."
          )
        );
      }, ACK_TIMEOUT_MS);

      this.ackWaiters.set(index, {
        resolve: (m) => {
          clearTimeout(timer);
          this.ackWaiters.delete(index);
          resolve(m);
        },
        reject: (e) => {
          clearTimeout(timer);
          this.ackWaiters.delete(index);
          reject(e);
        },
      });
    });
  }

  private waitForComplete(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.completeResolve = null;
        reject(
          new ProtocolError(
            "COMPLETE_TIMEOUT",
            "The recipient did not confirm the transfer finished."
          )
        );
      }, ACK_TIMEOUT_MS);
      this.completeResolve = () => {
        clearTimeout(timer);
        this.completeResolve = null;
        resolve();
      };
    });
  }

  private handleMessage(ev: { data: unknown }): void {
    if (typeof ev.data !== "string") return; // sender receives control only
    const msg = decodeControl(ev.data);
    if (!msg) return;

    switch (msg.t) {
      case "accept":
        this.acceptResolve?.(msg);
        this.acceptResolve = null;
        this.acceptReject = null;
        break;
      case "reject":
        this.cb.onRejected?.(msg.code, msg.message);
        this.acceptReject?.(new ProtocolError(msg.code, msg.message));
        this.acceptResolve = null;
        this.acceptReject = null;
        break;
      case "file-ack":
        this.ackWaiters.get(msg.index)?.resolve(msg);
        break;
      case "complete":
        this.completeResolve?.();
        break;
      case "cancel":
        this.cancelled = true;
        this.failAllWaiters(new ProtocolError("CANCELLED_BY_RECIPIENT", msg.reason));
        this.setPhase("cancelled", msg.reason);
        break;
      case "error":
        this.failAllWaiters(new ProtocolError(msg.code, msg.message));
        break;
      default:
        break;
    }
  }

  private failAllWaiters(err: Error): void {
    this.acceptReject?.(err);
    this.acceptResolve = null;
    this.acceptReject = null;
    for (const waiter of this.ackWaiters.values()) waiter.reject(err);
    this.ackWaiters.clear();
    const drains = this.drainWaiters;
    this.drainWaiters = [];
    for (const d of drains) d(); // let the loop observe readyState and exit
    this.completeResolve = null;
  }

  private send(data: string | ArrayBuffer): void {
    if (this.channel.readyState !== "open") {
      throw new ProtocolError(
        "CHANNEL_CLOSED",
        "Connection interrupted — restart the transfer."
      );
    }
    (this.channel.send as (d: string | ArrayBuffer) => void)(data);
  }

  private emitProgress(currentFileName: string): void {
    this.cb.onProgress?.({
      bytesSent: this.bytesSent,
      totalBytes: this.totalBytes,
      fileIndex: this.currentIndex,
      fileCount: this.files.length,
      currentFileName,
      bytesAcknowledged: this.bytesAcknowledged,
    });
  }

  private setPhase(phase: SenderPhase, detail?: string): void {
    this.phase = phase;
    this.cb.onPhase?.(phase, detail);
  }

  currentPhase(): SenderPhase {
    return this.phase;
  }

  /** Remove every listener. Called automatically when `run()` settles. */
  detach(): void {
    this.channel.removeEventListener("message", this.onMessage);
    this.channel.removeEventListener("bufferedamountlow", this.onBufferedLow);
    this.channel.removeEventListener("close", this.onClose);
    this.channel.removeEventListener("error", this.onError);
  }
}

export class ProtocolError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ProtocolError";
  }
}
