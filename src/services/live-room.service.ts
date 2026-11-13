/**
 * Live Send signalling rooms.
 *
 * A room is a few hundred bytes of Firestore that lets two browsers
 * exchange an SDP offer, an SDP answer and a handful of ICE candidates.
 * No file bytes, no file names, no manifest — the manifest travels over
 * the DataChannel once the peers are connected, so nothing about the
 * user's files is ever written to our infrastructure.
 *
 * Everything that decides access lives here rather than in the client:
 * room creation limits, invitation verification, and the single atomic
 * claim that makes "one recipient per room" true even when two people
 * open the same link at the same instant. Firestore rules (see
 * firestore.rules) then restrict the signalling documents to the two
 * uids this service recorded.
 *
 * `db` is injectable so the tests can drive the whole lifecycle against
 * an in-memory Firestore double, including the transaction semantics
 * the claim depends on.
 */

import {
  generateInviteSecret,
  generateRoomId,
  hashInviteSecret,
  verifyInviteSecret,
} from "@/lib/live/invite";
import {
  JOIN_WINDOW_MS,
  MAX_CANDIDATES_PER_SIDE,
  RECIPIENT_CANDIDATES,
  ROOMS_COLLECTION,
  SENDER_CANDIDATES,
  type RoomState,
} from "@/lib/live/room-paths";

// Re-exported so server-side callers have one import site. The browser
// must import these from @/lib/live/room-paths instead: importing them
// from here drags firebase-admin (and `fs`) into the client bundle.
export {
  JOIN_WINDOW_MS,
  MAX_CANDIDATES_PER_SIDE,
  RECIPIENT_CANDIDATES,
  ROOMS_COLLECTION,
  SENDER_CANDIDATES,
};
export type { RoomState };

export interface LiveRoom {
  id: string;
  senderUid: string;
  recipientUid: string | null;
  state: RoomState;
  createdAt: Date;
  joinExpiresAt: Date;
  claimAttempts: number;
}

/** Rooms one account may open per hour. */
export const MAX_ROOMS_PER_HOUR = 30;

/**
 * Rooms one IP may open per hour.
 *
 * Senders are allowed to be anonymous so the free tier keeps its "no
 * account needed" promise, which means a per-uid cap alone is weak —
 * a fresh anonymous sign-in resets it. The IP bucket is the backstop.
 * Deliberately higher than the per-uid cap so shared connections
 * (offices, campuses, mobile CGNAT) are not locked out by one user.
 */
export const MAX_ROOMS_PER_HOUR_PER_IP = 120;

/** Wrong-secret attempts tolerated per room before it is refused. */
export const MAX_CLAIM_ATTEMPTS = 10;

/**
 * Abandoned rooms are swept after this long regardless of state.
 *
 * Generous because a connected room is a live transfer: an aggressive
 * sweep would delete signalling data from under a running session. The
 * room doc is tiny, so keeping it a day costs nothing.
 */
export const ABANDONED_ROOM_MS = 24 * 60 * 60 * 1000;

const RATE_COLLECTION = "liveRateLimits";

// Minimal structural types: enough to use the Admin SDK, loose enough
// that a test double can satisfy them without reimplementing Firestore.
interface DocSnapshotLike {
  exists: boolean;
  id: string;
  data(): Record<string, unknown> | undefined;
}
interface DocRefLike {
  id: string;
  get(): Promise<DocSnapshotLike>;
  set(data: Record<string, unknown>): Promise<unknown>;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
  collection(name: string): CollectionRefLike;
}
interface QueryLike {
  where(field: string, op: string, value: unknown): QueryLike;
  limit(n: number): QueryLike;
  get(): Promise<{ docs: DocSnapshotLike[]; empty: boolean }>;
}
interface CollectionRefLike extends QueryLike {
  doc(id?: string): DocRefLike;
}
interface TransactionLike {
  get(ref: DocRefLike): Promise<DocSnapshotLike>;
  set(ref: DocRefLike, data: Record<string, unknown>): unknown;
  update(ref: DocRefLike, data: Record<string, unknown>): unknown;
}
export interface FirestoreLike {
  collection(name: string): CollectionRefLike;
  runTransaction<T>(fn: (tx: TransactionLike) => Promise<T>): Promise<T>;
  recursiveDelete?(ref: DocRefLike): Promise<void>;
}

async function defaultDb(): Promise<FirestoreLike> {
  const { getDb } = await import("@/lib/firebase-admin");
  return getDb() as unknown as FirestoreLike;
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const maybe = value as { toDate?: () => Date } | null;
  if (maybe && typeof maybe.toDate === "function") return maybe.toDate();
  return new Date(String(value));
}

function hourKey(now: Date): string {
  return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}${String(now.getUTCHours()).padStart(2, "0")}`;
}

export class LiveRoomError extends Error {
  constructor(
    readonly code:
      | "RATE_LIMITED"
      | "NOT_FOUND"
      | "EXPIRED"
      | "ALREADY_CLAIMED"
      | "INVALID_INVITE"
      | "THROTTLED"
      | "CLOSED"
      | "FORBIDDEN",
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "LiveRoomError";
  }
}

// ─── Create ──────────────────────────────────────────────────────────

export interface CreatedRoom {
  roomId: string;
  /** Returned exactly once. Only its hash is persisted. */
  inviteSecret: string;
  joinExpiresAt: Date;
}

/**
 * Open a room for `senderUid`.
 *
 * The per-hour cap is enforced inside the same transaction that records
 * the attempt, so parallel requests cannot both pass the check. The
 * counter is bucketed by UTC hour, which means it needs no cleanup pass
 * of its own beyond the sweep below.
 */
export async function createRoom(
  senderUid: string,
  options: { db?: FirestoreLike; now?: Date; ipHash?: string } = {}
): Promise<CreatedRoom> {
  const db = options.db ?? (await defaultDb());
  const now = options.now ?? new Date();

  const bucket = hourKey(now);
  await consumeQuota(db, `uid_${senderUid}_${bucket}`, MAX_ROOMS_PER_HOUR, bucket, now);
  if (options.ipHash) {
    await consumeQuota(
      db,
      `ip_${options.ipHash}_${bucket}`,
      MAX_ROOMS_PER_HOUR_PER_IP,
      bucket,
      now
    );
  }

  const roomId = generateRoomId();
  const inviteSecret = generateInviteSecret();
  const joinExpiresAt = new Date(now.getTime() + JOIN_WINDOW_MS);

  await db
    .collection(ROOMS_COLLECTION)
    .doc(roomId)
    .set({
      senderUid,
      recipientUid: null,
      state: "waiting" satisfies RoomState,
      inviteHash: hashInviteSecret(roomId, inviteSecret),
      createdAt: now,
      joinExpiresAt,
      claimAttempts: 0,
      offer: null,
      answer: null,
      closedAt: null,
    });

  return { roomId, inviteSecret, joinExpiresAt };
}

/**
 * Increment one hourly counter, refusing once it is spent.
 *
 * Check and increment happen in the same transaction so two concurrent
 * requests cannot both read "29 used" and both proceed.
 */
async function consumeQuota(
  db: FirestoreLike,
  docId: string,
  max: number,
  bucket: string,
  now: Date
): Promise<void> {
  const ref = db.collection(RATE_COLLECTION).doc(docId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? Number(snap.data()?.creates ?? 0) : 0;
    if (count >= max) {
      throw new LiveRoomError(
        "RATE_LIMITED",
        "Too many Live Send links created in the last hour. Try again shortly.",
        429
      );
    }
    tx.set(ref, { creates: count + 1, bucket, updatedAt: now });
  });
}

// ─── Claim ───────────────────────────────────────────────────────────

export interface ClaimedRoom {
  roomId: string;
  senderUid: string;
  /** True when this uid had already claimed the room (page reload). */
  rejoined: boolean;
}

/**
 * Atomically bind `recipientUid` to a room.
 *
 * Every rule that matters is asserted inside one transaction against
 * one document, which is what makes the "one recipient only" guarantee
 * hold under a race: the second caller reads the recipientUid the first
 * one wrote and is refused.
 *
 * A repeat claim by the SAME uid succeeds. Anonymous auth gives a
 * browser a stable uid, so this is what lets a recipient reload the
 * page mid-session without losing the room — it is not a second
 * participant.
 */
export async function claimRoom(
  roomId: string,
  inviteSecret: string,
  recipientUid: string,
  options: { db?: FirestoreLike; now?: Date } = {}
): Promise<ClaimedRoom> {
  const db = options.db ?? (await defaultDb());
  const now = options.now ?? new Date();
  const ref = db.collection(ROOMS_COLLECTION).doc(roomId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new LiveRoomError("NOT_FOUND", "This invitation link is not valid.", 404);
    }
    const data = snap.data()!;
    const state = String(data.state) as RoomState;
    const senderUid = String(data.senderUid);

    if (state === "closed") {
      throw new LiveRoomError("CLOSED", "This transfer has already ended.", 410);
    }

    if (recipientUid === senderUid) {
      throw new LiveRoomError(
        "FORBIDDEN",
        "Open this link on the receiving device, not the one sending.",
        403
      );
    }

    const attempts = Number(data.claimAttempts ?? 0);
    if (attempts >= MAX_CLAIM_ATTEMPTS) {
      throw new LiveRoomError(
        "THROTTLED",
        "Too many failed attempts on this link. Ask the sender for a new one.",
        429
      );
    }

    const existingRecipient = data.recipientUid ? String(data.recipientUid) : null;

    // Secret is verified before the expiry check so a correct secret on
    // an expired room and a wrong secret both cost an attempt, and
    // before the claim so a third party cannot learn room state.
    if (!verifyInviteSecret(roomId, inviteSecret, String(data.inviteHash ?? ""))) {
      tx.update(ref, { claimAttempts: attempts + 1 });
      throw new LiveRoomError("INVALID_INVITE", "This invitation link is not valid.", 403);
    }

    if (existingRecipient && existingRecipient !== recipientUid) {
      throw new LiveRoomError(
        "ALREADY_CLAIMED",
        "Someone else already opened this invitation. Ask the sender for a new link.",
        409
      );
    }

    if (existingRecipient === recipientUid) {
      return { roomId, senderUid, rejoined: true };
    }

    // Only an unclaimed room is subject to the join window. A room that
    // is already claimed is a live transfer and must not be expired.
    if (toDate(data.joinExpiresAt).getTime() <= now.getTime()) {
      throw new LiveRoomError(
        "EXPIRED",
        "This invitation has expired. Ask the sender for a new link.",
        410
      );
    }

    tx.update(ref, {
      recipientUid,
      state: "claimed" satisfies RoomState,
      claimedAt: now,
    });

    return { roomId, senderUid, rejoined: false };
  });
}

// ─── Read / close ────────────────────────────────────────────────────

export async function getRoom(
  roomId: string,
  options: { db?: FirestoreLike } = {}
): Promise<LiveRoom | null> {
  const db = options.db ?? (await defaultDb());
  const snap = await db.collection(ROOMS_COLLECTION).doc(roomId).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return {
    id: roomId,
    senderUid: String(data.senderUid),
    recipientUid: data.recipientUid ? String(data.recipientUid) : null,
    state: String(data.state) as RoomState,
    createdAt: toDate(data.createdAt),
    joinExpiresAt: toDate(data.joinExpiresAt),
    claimAttempts: Number(data.claimAttempts ?? 0),
  };
}

/**
 * End a room and delete its signalling data.
 *
 * Only a participant may close. Deleting the parent document does NOT
 * delete the candidate subcollections — Firestore has no cascade — so
 * this deletes the children explicitly. `recursiveDelete` does it in
 * one call when available; the manual walk is the fallback and is also
 * what the test double exercises.
 */
export async function closeRoom(
  roomId: string,
  uid: string,
  options: { db?: FirestoreLike } = {}
): Promise<void> {
  const db = options.db ?? (await defaultDb());
  const ref = db.collection(ROOMS_COLLECTION).doc(roomId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const data = snap.data()!;
  if (uid !== String(data.senderUid) && uid !== String(data.recipientUid ?? "")) {
    throw new LiveRoomError("FORBIDDEN", "Not a participant in this transfer.", 403);
  }

  await deleteRoomDeep(db, ref);
}

async function deleteRoomDeep(db: FirestoreLike, ref: DocRefLike): Promise<void> {
  if (typeof db.recursiveDelete === "function") {
    await db.recursiveDelete(ref);
    return;
  }
  for (const name of [SENDER_CANDIDATES, RECIPIENT_CANDIDATES]) {
    const children = await ref.collection(name).get();
    await Promise.all(children.docs.map((d) => ref.collection(name).doc(d.id).delete()));
  }
  await ref.delete();
}

// ─── Sweep ───────────────────────────────────────────────────────────

export interface SweepResult {
  roomsDeleted: number;
  errors: string[];
}

/**
 * Delete rooms nobody is using any more.
 *
 * Two classes get swept:
 *   • never claimed and past the join window — nothing can use them
 *   • anything at all older than ABANDONED_ROOM_MS — covers sessions
 *     where both tabs closed without a clean shutdown
 *
 * A claimed or connected room inside the 24-hour grace is left alone:
 * it may be a transfer still in flight.
 *
 * Deliberately not reliant on Firestore TTL policies. TTL deletion is
 * best-effort with no latency guarantee and, like a parent delete, does
 * not touch subcollections.
 */
export async function sweepAbandonedRooms(
  options: { db?: FirestoreLike; now?: Date; limit?: number } = {}
): Promise<SweepResult> {
  const db = options.db ?? (await defaultDb());
  const now = options.now ?? new Date();
  const limit = options.limit ?? 200;
  const result: SweepResult = { roomsDeleted: 0, errors: [] };

  // One single-field range query — no composite index needed. State is
  // filtered in code so the grace rule stays readable.
  const snap = await db
    .collection(ROOMS_COLLECTION)
    .where("joinExpiresAt", "<=", now)
    .limit(limit)
    .get();

  const hardCutoff = now.getTime() - ABANDONED_ROOM_MS;

  for (const doc of snap.docs) {
    const data = doc.data() ?? {};
    const state = String(data.state ?? "waiting") as RoomState;
    const createdAt = toDate(data.createdAt).getTime();

    const unusable = state === "waiting" || state === "closed";
    const abandoned = createdAt <= hardCutoff;
    if (!unusable && !abandoned) continue;

    try {
      await deleteRoomDeep(db, db.collection(ROOMS_COLLECTION).doc(doc.id));
      result.roomsDeleted += 1;
    } catch (err) {
      result.errors.push(`${doc.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

/** Stale hourly rate-limit buckets. Tiny docs, but they should not pile up. */
export async function sweepRateLimitBuckets(
  options: { db?: FirestoreLike; now?: Date; limit?: number } = {}
): Promise<number> {
  const db = options.db ?? (await defaultDb());
  const now = options.now ?? new Date();
  const limit = options.limit ?? 200;
  const cutoff = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  const snap = await db
    .collection(RATE_COLLECTION)
    .where("updatedAt", "<=", cutoff)
    .limit(limit)
    .get();

  await Promise.all(snap.docs.map((d) => db.collection(RATE_COLLECTION).doc(d.id).delete()));
  return snap.docs.length;
}
