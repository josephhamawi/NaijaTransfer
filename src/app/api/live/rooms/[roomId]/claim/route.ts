/**
 * POST /api/live/rooms/:roomId/claim — redeem an invitation.
 *
 * The recipient's browser signs in anonymously, then presents the
 * secret from the URL fragment. The server is what validates it: the
 * client never sees the stored hash, and Firestore rules alone could
 * not express "first caller wins" atomically.
 *
 * On success the room records this uid as THE recipient, which is also
 * what the Firestore rules then use to let this browser read the offer
 * and write an answer. A second person with the same link is refused
 * here, before they can touch any signalling document.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUid } from "@/lib/auth-api";
import { verifyAppCheck } from "@/lib/app-check";
import { isWellFormedRoomId, isWellFormedSecret } from "@/lib/live/invite";
import { claimRoom, LiveRoomError } from "@/services/live-room.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** One message for every "this link won't work" case. */
const GENERIC_INVALID = "This invitation link is not valid.";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const appCheck = await verifyAppCheck(request);
  if (appCheck.blocked) {
    return NextResponse.json(
      { error: { code: "APP_CHECK_FAILED", message: "Request could not be verified." } },
      { status: 403 }
    );
  }

  const uid = await getAuthUid(request);
  if (!uid) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Could not verify this browser." } },
      { status: 401 }
    );
  }

  const { roomId } = await params;
  if (!isWellFormedRoomId(roomId)) {
    return NextResponse.json(
      { error: { code: "INVALID_INVITE", message: GENERIC_INVALID } },
      { status: 400 }
    );
  }

  let secret: unknown;
  try {
    secret = (await request.json())?.secret;
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "Request body must be JSON." } },
      { status: 400 }
    );
  }

  // Shape-check before any Firestore read so malformed secrets cost
  // nothing and cannot consume the room's attempt budget.
  if (!isWellFormedSecret(secret)) {
    return NextResponse.json(
      { error: { code: "INVALID_INVITE", message: GENERIC_INVALID } },
      { status: 403 }
    );
  }

  try {
    const claim = await claimRoom(roomId, secret, uid);
    return NextResponse.json(
      {
        data: {
          roomId: claim.roomId,
          senderUid: claim.senderUid,
          rejoined: claim.rejoined,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    if (err instanceof LiveRoomError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("Live room claim failed");
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not join this transfer." } },
      { status: 500 }
    );
  }
}
