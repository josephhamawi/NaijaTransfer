/**
 * WebRTC session setup over Firestore signalling.
 *
 * Firestore carries exactly four kinds of value here: an SDP offer, an
 * SDP answer, ICE candidates, and the room's own state. Nothing else.
 * No manifest, no file names, no progress, no bytes — those all live on
 * the DataChannel, which is the whole point of the feature.
 *
 * Listener discipline: every `onSnapshot` registered here is tracked and
 * torn down as soon as the DataChannel opens, because once the peers are
 * connected the signalling documents have no further use. They are also
 * torn down on failure, timeout, cancellation and unmount, so a user
 * who leaves a tab open overnight is not holding a live Firestore
 * listener (and its billed connection) for hours.
 */

import {
  collection as fsCollection,
  doc as fsDoc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase";
import { buildIceConfig, inspectSelectedPair, isRelayed } from "./ice";
// From room-paths, not the service: the service imports firebase-admin,
// which cannot be bundled for the browser.
import {
  MAX_CANDIDATES_PER_SIDE,
  RECIPIENT_CANDIDATES,
  ROOMS_COLLECTION,
  SENDER_CANDIDATES,
} from "@/lib/live/room-paths";

export type LiveConnectionState =
  | "signalling"
  | "waiting-for-peer"
  | "connecting"
  | "connected"
  | "failed"
  | "closed";

export interface SessionCallbacks {
  onState(state: LiveConnectionState, detail?: string): void;
}

export interface LiveSession {
  pc: RTCPeerConnection;
  channel: RTCDataChannel;
  /** Candidate pair description, for the "direct connection" claim. */
  relayed: boolean;
  /** Tear down listeners, peer connection and channel. Idempotent. */
  close(): void;
}

/** How long to wait for a peer to connect once both sides are present. */
const CONNECT_TIMEOUT_MS = 45_000;

export class LiveConnectionError extends Error {
  constructor(
    readonly code:
      | "TIMEOUT"
      | "ICE_FAILED"
      | "RELAYED"
      | "ROOM_GONE"
      | "ABORTED"
      | "SIGNALLING_FAILED",
    message: string
  ) {
    super(message);
    this.name = "LiveConnectionError";
  }
}

/** Collects unsubscribes so nothing is left running. */
class Teardown {
  private fns: Array<() => void> = [];
  private done = false;

  add(fn: () => void): void {
    if (this.done) {
      fn();
      return;
    }
    this.fns.push(fn);
  }

  run(): void {
    if (this.done) return;
    this.done = true;
    for (const fn of this.fns.splice(0)) {
      try {
        fn();
      } catch {
        /* teardown must not throw */
      }
    }
  }

  get finished(): boolean {
    return this.done;
  }
}

function roomRef(db: Firestore, roomId: string) {
  return fsDoc(db, ROOMS_COLLECTION, roomId);
}

/**
 * Trickle local candidates into Firestore under deterministic,
 * zero-padded ids.
 *
 * Deterministic ids are what let the security rules cap each side at
 * MAX_CANDIDATES_PER_SIDE without counting documents — rules can match
 * the id pattern and range, but cannot count a subcollection. Create-only
 * rules plus fixed ids also mean a participant cannot overwrite a
 * candidate the other side already wrote.
 */
function attachCandidateSender(
  db: Firestore,
  roomId: string,
  pc: RTCPeerConnection,
  side: typeof SENDER_CANDIDATES | typeof RECIPIENT_CANDIDATES,
  teardown: Teardown
): void {
  let index = 0;
  const handler = (event: RTCPeerConnectionIceEvent) => {
    if (!event.candidate) return; // null marks end-of-gathering
    if (index >= MAX_CANDIDATES_PER_SIDE) return;
    const id = String(index).padStart(3, "0");
    index += 1;
    const json = event.candidate.toJSON();
    void setDoc(fsDoc(fsCollection(roomRef(db, roomId), side), id), {
      candidate: json.candidate ?? "",
      sdpMid: json.sdpMid ?? null,
      sdpMLineIndex: json.sdpMLineIndex ?? null,
      createdAt: new Date(),
    }).catch(() => {
      // A rejected candidate write is not fatal: the connection may
      // still succeed on candidates that did land. Not logged — the
      // value contains the peer's local network addresses.
    });
  };

  pc.addEventListener("icecandidate", handler as EventListener);
  teardown.add(() => pc.removeEventListener("icecandidate", handler as EventListener));
}

function attachCandidateReceiver(
  db: Firestore,
  roomId: string,
  pc: RTCPeerConnection,
  side: typeof SENDER_CANDIDATES | typeof RECIPIENT_CANDIDATES,
  teardown: Teardown
): void {
  const unsub: Unsubscribe = onSnapshot(
    fsCollection(roomRef(db, roomId), side),
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        const data = change.doc.data();
        if (typeof data.candidate !== "string" || data.candidate.length === 0) return;
        void pc
          .addIceCandidate({
            candidate: data.candidate,
            sdpMid: data.sdpMid ?? undefined,
            sdpMLineIndex:
              typeof data.sdpMLineIndex === "number" ? data.sdpMLineIndex : undefined,
          })
          .catch(() => {
            /* a candidate we can't use is normal */
          });
      });
    },
    () => {
      /* permission revoked or room deleted — the timeout path handles it */
    }
  );
  teardown.add(unsub);
}

/**
 * Wait for the DataChannel to open, then confirm the path is direct.
 *
 * The relay check is the enforcement behind "bytes travel directly
 * between browsers". We ship no TURN server, so a relayed pair should be
 * impossible — but "should be impossible" is not a guarantee, and a
 * browser configured with its own TURN (enterprise policy, extension)
 * would otherwise silently route a user's files through a third party.
 */
async function awaitChannelOpen(
  pc: RTCPeerConnection,
  channel: RTCDataChannel,
  teardown: Teardown,
  signal: AbortSignal | undefined,
  cb: SessionCallbacks
): Promise<boolean> {
  if (channel.readyState === "open") {
    const pair = await inspectSelectedPair(pc);
    return isRelayed(pair);
  }

  return new Promise<boolean>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new LiveConnectionError(
          "TIMEOUT",
          "Could not open a direct connection. Your networks may not allow it."
        )
      );
    }, CONNECT_TIMEOUT_MS);

    const onOpen = () => {
      cleanup();
      void inspectSelectedPair(pc).then((pair) => resolve(isRelayed(pair)));
    };

    const onIceState = () => {
      if (pc.iceConnectionState === "failed") {
        cleanup();
        reject(
          new LiveConnectionError(
            "ICE_FAILED",
            "No direct path exists between these two networks."
          )
        );
      }
    };

    const onAbort = () => {
      cleanup();
      reject(new LiveConnectionError("ABORTED", "Cancelled."));
    };

    function cleanup() {
      clearTimeout(timer);
      channel.removeEventListener("open", onOpen);
      pc.removeEventListener("iceconnectionstatechange", onIceState);
      signal?.removeEventListener("abort", onAbort);
    }

    channel.addEventListener("open", onOpen);
    pc.addEventListener("iceconnectionstatechange", onIceState);
    signal?.addEventListener("abort", onAbort, { once: true });
    teardown.add(cleanup);

    cb.onState("connecting");
  });
}

function buildSession(
  pc: RTCPeerConnection,
  channel: RTCDataChannel,
  relayed: boolean,
  teardown: Teardown
): LiveSession {
  return {
    pc,
    channel,
    relayed,
    close() {
      teardown.run();
      try {
        channel.close();
      } catch {
        /* already closed */
      }
      try {
        pc.close();
      } catch {
        /* already closed */
      }
    },
  };
}

// ─── Sender ──────────────────────────────────────────────────────────

/**
 * Create the offer side of the session.
 *
 * The sender creates the DataChannel, so it must be the one to offer;
 * the recipient simply answers and picks the channel up from
 * `ondatachannel`.
 */
export async function openSenderSession(opts: {
  roomId: string;
  callbacks: SessionCallbacks;
  signal?: AbortSignal;
}): Promise<LiveSession> {
  const db = getClientDb();
  const teardown = new Teardown();
  const pc = new RTCPeerConnection(buildIceConfig());
  teardown.add(() => pc.close());

  try {
    opts.callbacks.onState("signalling");

    const channel = pc.createDataChannel("live-files", {
      ordered: true, // reliable + ordered: the protocol relies on both
    });
    channel.binaryType = "arraybuffer";

    attachCandidateSender(db, opts.roomId, pc, SENDER_CANDIDATES, teardown);
    attachCandidateReceiver(db, opts.roomId, pc, RECIPIENT_CANDIDATES, teardown);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await updateDoc(roomRef(db, opts.roomId), {
      offer: offer.sdp ?? "",
    });

    opts.callbacks.onState("waiting-for-peer");

    // Wait for the recipient's answer. This listener is live only until
    // the answer arrives — one document, one field.
    await new Promise<void>((resolve, reject) => {
      const unsub = onSnapshot(
        roomRef(db, opts.roomId),
        (snap) => {
          if (!snap.exists()) {
            unsub();
            reject(new LiveConnectionError("ROOM_GONE", "The session was closed."));
            return;
          }
          const answer = snap.data()?.answer;
          if (typeof answer === "string" && answer.length > 0 && !pc.currentRemoteDescription) {
            unsub();
            void pc
              .setRemoteDescription({ type: "answer", sdp: answer })
              .then(resolve)
              .catch(() =>
                reject(
                  new LiveConnectionError(
                    "SIGNALLING_FAILED",
                    "The recipient's connection details could not be used."
                  )
                )
              );
          }
        },
        () =>
          reject(
            new LiveConnectionError("SIGNALLING_FAILED", "Lost contact with the session.")
          )
      );
      teardown.add(unsub);
      opts.signal?.addEventListener(
        "abort",
        () => {
          unsub();
          reject(new LiveConnectionError("ABORTED", "Cancelled."));
        },
        { once: true }
      );
    });

    const relayed = await awaitChannelOpen(pc, channel, teardown, opts.signal, opts.callbacks);

    if (relayed) {
      teardown.run();
      pc.close();
      throw new LiveConnectionError(
        "RELAYED",
        "This connection would route through a relay server, which Live Send does not use."
      );
    }

    // Signalling is finished. Drop every Firestore listener now rather
    // than at the end of the transfer: the remaining work is pure
    // peer-to-peer and needs nothing from our infrastructure.
    teardown.run();
    opts.callbacks.onState("connected");

    const sessionTeardown = new Teardown();
    return buildSession(pc, channel, relayed, sessionTeardown);
  } catch (err) {
    teardown.run();
    try {
      pc.close();
    } catch {
      /* ignore */
    }
    opts.callbacks.onState(
      "failed",
      err instanceof Error ? err.message : "Could not connect."
    );
    throw err;
  }
}

// ─── Recipient ───────────────────────────────────────────────────────

export async function openRecipientSession(opts: {
  roomId: string;
  callbacks: SessionCallbacks;
  signal?: AbortSignal;
}): Promise<LiveSession> {
  const db = getClientDb();
  const teardown = new Teardown();
  const pc = new RTCPeerConnection(buildIceConfig());
  teardown.add(() => pc.close());

  try {
    opts.callbacks.onState("signalling");

    attachCandidateSender(db, opts.roomId, pc, RECIPIENT_CANDIDATES, teardown);
    attachCandidateReceiver(db, opts.roomId, pc, SENDER_CANDIDATES, teardown);

    const channelPromise = new Promise<RTCDataChannel>((resolve) => {
      const handler = (event: RTCDataChannelEvent) => {
        event.channel.binaryType = "arraybuffer";
        resolve(event.channel);
      };
      pc.addEventListener("datachannel", handler as EventListener);
      teardown.add(() => pc.removeEventListener("datachannel", handler as EventListener));
    });

    // The offer may already be there (sender went first) or may arrive
    // in a moment. One read, then a listener only if needed.
    const existing = await getDoc(roomRef(db, opts.roomId));
    if (!existing.exists()) {
      throw new LiveConnectionError("ROOM_GONE", "This session no longer exists.");
    }

    const applyOffer = async (sdp: string) => {
      await pc.setRemoteDescription({ type: "offer", sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await updateDoc(roomRef(db, opts.roomId), { answer: answer.sdp ?? "" });
    };

    const initialOffer = existing.data()?.offer;
    if (typeof initialOffer === "string" && initialOffer.length > 0) {
      await applyOffer(initialOffer);
    } else {
      opts.callbacks.onState("waiting-for-peer");
      await new Promise<void>((resolve, reject) => {
        const unsub = onSnapshot(
          roomRef(db, opts.roomId),
          (snap) => {
            if (!snap.exists()) {
              unsub();
              reject(new LiveConnectionError("ROOM_GONE", "The sender closed the session."));
              return;
            }
            const offer = snap.data()?.offer;
            if (typeof offer === "string" && offer.length > 0 && !pc.currentRemoteDescription) {
              unsub();
              void applyOffer(offer)
                .then(resolve)
                .catch(() =>
                  reject(
                    new LiveConnectionError(
                      "SIGNALLING_FAILED",
                      "The sender's connection details could not be used."
                    )
                  )
                );
            }
          },
          () =>
            reject(
              new LiveConnectionError("SIGNALLING_FAILED", "Lost contact with the session.")
            )
        );
        teardown.add(unsub);
        opts.signal?.addEventListener(
          "abort",
          () => {
            unsub();
            reject(new LiveConnectionError("ABORTED", "Cancelled."));
          },
          { once: true }
        );
      });
    }

    const channel = await channelPromise;
    const relayed = await awaitChannelOpen(pc, channel, teardown, opts.signal, opts.callbacks);

    if (relayed) {
      teardown.run();
      pc.close();
      throw new LiveConnectionError(
        "RELAYED",
        "This connection would route through a relay server, which Live Send does not use."
      );
    }

    teardown.run();
    opts.callbacks.onState("connected");
    return buildSession(pc, channel, relayed, new Teardown());
  } catch (err) {
    teardown.run();
    try {
      pc.close();
    } catch {
      /* ignore */
    }
    opts.callbacks.onState(
      "failed",
      err instanceof Error ? err.message : "Could not connect."
    );
    throw err;
  }
}
