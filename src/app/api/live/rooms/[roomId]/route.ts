/**
 * DELETE /api/live/rooms/:roomId — end a session and erase its
 * signalling data.
 *
 * Called when either side finishes, cancels or closes the page. Deletes
 * the room document AND both candidate subcollections, because deleting
 * a Firestore parent leaves its children behind as orphans that no
 * query will ever surface again.
 *
 * Best-effort by nature — a browser that is force-quit never calls it.
 * The scheduled sweep in cleanup.service.ts is the backstop.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUid } from "@/lib/auth-api";
import { isWellFormedRoomId } from "@/lib/live/invite";
import { closeRoom, LiveRoomError } from "@/services/live-room.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
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
      { error: { code: "NOT_FOUND", message: "No such session." } },
      { status: 404 }
    );
  }

  try {
    await closeRoom(roomId, uid);
    return NextResponse.json({ data: { closed: true } });
  } catch (err) {
    if (err instanceof LiveRoomError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("Live room close failed");
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not close the session." } },
      { status: 500 }
    );
  }
}
