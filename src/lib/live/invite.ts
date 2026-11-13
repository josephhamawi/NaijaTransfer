/**
 * Room identifiers and invitation secrets.
 *
 * Two separate values, on purpose:
 *
 *   • roomId — public. Appears in the URL path, in Firestore document
 *     paths, and in server logs. Knowing it must not be enough to join.
 *
 *   • inviteSecret — private. Travels in the URL *fragment*
 *     (`/live/<roomId>#<secret>`), which browsers never put in the
 *     request line, so it stays out of access logs, Referer headers and
 *     any proxy in between. Only its SHA-256 is stored, so a dump of
 *     Firestore does not yield join credentials.
 *
 * Both come from `crypto.randomBytes`, never `Math.random`.
 */

import crypto from "crypto";

/** 18 bytes → 24 base64url chars → 144 bits. */
const ROOM_ID_BYTES = 18;
/** 32 bytes → 43 base64url chars → 256 bits. */
const INVITE_SECRET_BYTES = 32;

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateRoomId(): string {
  return base64url(crypto.randomBytes(ROOM_ID_BYTES));
}

export function generateInviteSecret(): string {
  return base64url(crypto.randomBytes(INVITE_SECRET_BYTES));
}

/**
 * Hash an invitation secret for storage.
 *
 * The roomId is mixed in so a secret captured for one room cannot be
 * replayed against another, and so two rooms that somehow drew the same
 * secret do not share a hash.
 */
export function hashInviteSecret(roomId: string, secret: string): string {
  return crypto.createHash("sha256").update(`${roomId}:${secret}`).digest("hex");
}

/**
 * Constant-time comparison of a presented secret against a stored hash.
 *
 * `timingSafeEqual` throws on length mismatch, so the lengths are
 * checked first — both are fixed-length hex digests, so that check
 * leaks nothing.
 */
export function verifyInviteSecret(
  roomId: string,
  presented: string,
  storedHash: string
): boolean {
  if (typeof presented !== "string" || typeof storedHash !== "string") return false;
  const computed = hashInviteSecret(roomId, presented);
  if (computed.length !== storedHash.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(storedHash, "hex"));
  } catch {
    return false;
  }
}

/** Shape check before any lookup, so malformed ids never hit Firestore. */
export function isWellFormedRoomId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{20,32}$/.test(value);
}

export function isWellFormedSecret(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{40,48}$/.test(value);
}
