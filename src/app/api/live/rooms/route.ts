/**
 * POST /api/live/rooms — open a Live Send signalling room.
 *
 * Requires a Firebase ID token. Anonymous tokens are accepted: the free
 * tier's promise is "no account needed", and an anonymous uid is still
 * a real identity for Firestore rules to key room access on. The quota
 * work in the service compensates for how cheap anonymous uids are.
 *
 * Returns the invitation secret exactly once. Only its hash is stored,
 * so it cannot be recovered from Firestore or from this endpoint later.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUid } from "@/lib/auth-api";
import { verifyAppCheck } from "@/lib/app-check";
import { hashIp } from "@/lib/server-utils";
import { createRoom, JOIN_WINDOW_MS, LiveRoomError } from "@/services/live-room.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Sign-in required to open a Live Send session.",
        },
      },
      { status: 401 }
    );
  }

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  try {
    const room = await createRoom(uid, { ipHash: hashIp(ip) });

    return NextResponse.json(
      {
        data: {
          roomId: room.roomId,
          inviteSecret: room.inviteSecret,
          joinExpiresAt: room.joinExpiresAt.toISOString(),
          joinWindowMs: JOIN_WINDOW_MS,
        },
      },
      {
        status: 201,
        // Never cache a response carrying a one-time secret.
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (err) {
    if (err instanceof LiveRoomError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    // Log the failure, not the request: no uid, no secret, no SDP.
    console.error("Live room create failed");
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not start a Live Send session." } },
      { status: 500 }
    );
  }
}
