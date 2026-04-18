import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Upload status — returns which chunks have already been uploaded for
 * a given upload session. The client uses this when resuming after a
 * failure so it can skip re-uploading work that's already on GCS.
 *
 * Returns 404 when the session doesn't exist (cleaned up, expired, or
 * bad id) so the client knows to fall back to a fresh /init.
 */
export async function GET(request: NextRequest) {
  const uploadId = request.nextUrl.searchParams.get("uploadId");
  if (!uploadId) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_UPLOAD_ID",
          message: "uploadId is required.",
        },
      },
      { status: 400 }
    );
  }

  const { collection } = await import("@/lib/firebase-admin");
  const uploadSnap = await collection("uploads").doc(uploadId).get();
  if (!uploadSnap.exists) {
    return NextResponse.json(
      {
        error: {
          code: "UPLOAD_NOT_FOUND",
          message: "Upload session not found.",
        },
      },
      { status: 404 }
    );
  }
  const data = uploadSnap.data()!;

  const completedChunks: number[] = Array.isArray(data.completedChunks)
    ? (data.completedChunks as number[]).filter((n) => Number.isInteger(n))
    : [];

  return NextResponse.json({
    data: {
      uploadId,
      transferId: data.transferId,
      partCount: data.partCount,
      partSize: data.partSize,
      fileSize: data.fileSize,
      completedChunks,
    },
  });
}
