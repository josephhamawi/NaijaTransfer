/**
 * Shared Live Send room vocabulary — collection names, caps, states.
 *
 * Deliberately its own module with NO imports.
 *
 * Both the browser (src/lib/live/session.ts) and the server
 * (src/services/live-room.service.ts) need these constants. When the
 * browser imported them from the service, webpack followed that import
 * and tried to bundle firebase-admin — and with it `fs` and
 * `child_process` — into the client, which fails the build outright.
 * Keeping the shared names here is what keeps the admin SDK on the
 * server where it belongs.
 */

export type RoomState = "waiting" | "claimed" | "connected" | "closed";

export const ROOMS_COLLECTION = "liveRooms";
export const SENDER_CANDIDATES = "senderCandidates";
export const RECIPIENT_CANDIDATES = "recipientCandidates";

/**
 * Candidate documents accepted per side.
 *
 * Mirrored in firestore.rules, which enforces it through the document
 * id pattern (`000`–`059`) because rules cannot count the documents in
 * a subcollection. Changing this number means changing the rule too.
 */
export const MAX_CANDIDATES_PER_SIDE = 60;

/**
 * How long an invitation link may be redeemed for.
 *
 * This is the JOIN window, not a transfer deadline. Once a recipient
 * has claimed the room the transfer runs as long as it needs — a 40 GB
 * send over a slow link is expected to outlive this window, and nothing
 * in the connected path consults it.
 */
export const JOIN_WINDOW_MS = 15 * 60 * 1000;
