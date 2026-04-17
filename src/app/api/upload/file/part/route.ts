import { NextRequest, NextResponse } from "next/server";
import { uploadFileStream } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Multipart upload — step 2 of 3.
 *
 * Streams one part's raw bytes to GCS as a standalone object under
 * transfers/<transferId>/parts/<uploadId>/<partNumber>. These are
 * temporary — /complete will compose them into the real object and
 * delete these part files. No quota interaction here — /init already
 * reserved space for the whole file.
 *
 * This path is excluded from the Next.js middleware matcher so the
 * request body streams through without being buffered. Do not add
 * middleware logic that depends on /api/upload/file/part.
 */
export async function POST(request: NextRequest) {
  const uploadId = request.nextUrl.searchParams.get("uploadId");
  const partNumberStr = request.nextUrl.searchParams.get("partNumber");
  const contentType =
    request.headers.get("content-type") || "application/octet-stream";

  if (!uploadId || !partNumberStr) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_FIELDS",
          message: "uploadId and partNumber query params are required.",
        },
      },
      { status: 400 }
    );
  }

  const partNumber = Number(partNumberStr);
  if (!Number.isInteger(partNumber) || partNumber < 1) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PART",
          message: "partNumber must be a positive integer.",
        },
      },
      { status: 400 }
    );
  }

  if (!request.body) {
    return NextResponse.json(
      { error: { code: "EMPTY_BODY", message: "Request has no body." } },
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
          message: "Upload session not found or already completed.",
        },
      },
      { status: 404 }
    );
  }
  const upload = uploadSnap.data()!;

  if (partNumber > upload.partCount) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PART",
          message: `partNumber ${partNumber} exceeds partCount ${upload.partCount}.`,
        },
      },
      { status: 400 }
    );
  }

  // Zero-padded so GCS Compose sees parts in lexicographic == numeric
  // order when we assemble them in /complete.
  const partKey = `transfers/${upload.transferId}/parts/${uploadId}/${String(
    partNumber
  ).padStart(4, "0")}`;

  try {
    await uploadFileStream(partKey, request.body, contentType);
  } catch (err) {
    console.error(`Part ${partNumber} upload failed for ${uploadId}:`, err);
    return NextResponse.json(
      {
        error: {
          code: "PART_UPLOAD_FAILED",
          message: "Part upload failed. The client should retry this part.",
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: { partNumber, uploaded: true },
  });
}
