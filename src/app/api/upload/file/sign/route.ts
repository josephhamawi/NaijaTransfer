import { NextRequest, NextResponse } from "next/server";
import { getObjectSize, getSignedUploadUrl, listUploadedParts } from "@/lib/storage";
import { partKey, partPrefix } from "@/lib/upload-parts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Matches MAX_URLS_PER_CALL in batch-init — bounds per-request signing work. */
const MAX_URLS_PER_CALL = 128;

/**
 * Mint signed PUT URLs for specific parts of an existing upload session.
 *
 * Two callers:
 *   - the uploader, pulling URLs just-in-time for parts beyond the
 *     budget /batch-init could afford to sign up front
 *   - resume, where `includeCompleted` asks the bucket which parts
 *     already landed. That listing is one round trip and replaces the
 *     per-chunk Firestore write the proxy path used to do purely so
 *     resume had something to read.
 */
export async function POST(request: NextRequest) {
  let body: {
    uploadId?: string;
    partNumbers?: number[];
    includeCompleted?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  const uploadId = body.uploadId;
  if (!uploadId) {
    return NextResponse.json(
      { error: { code: "MISSING_UPLOAD_ID", message: "uploadId is required." } },
      { status: 400 }
    );
  }

  const { collection } = await import("@/lib/firebase-admin");
  const snap = await collection("uploads").doc(uploadId).get();
  if (!snap.exists) {
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
  const upload = snap.data()!;
  const single = Boolean(upload.single);
  const partCount = Number(upload.partCount) || 1;
  const transferId = String(upload.transferId);
  const finalKey = String(upload.finalKey ?? `transfers/${transferId}/${upload.fileId}`);

  // ── Which parts are already in the bucket? ────────────────────────
  let completed: number[] | undefined;
  if (body.includeCompleted) {
    if (single) {
      const size = await getObjectSize(finalKey);
      completed = size !== null && size === Number(upload.fileSize) ? [1] : [];
    } else {
      completed = await listUploadedParts(partPrefix(transferId, uploadId));
    }
  }

  // ── Sign the requested parts ──────────────────────────────────────
  const requested = Array.isArray(body.partNumbers)
    ? body.partNumbers.filter((n) => Number.isInteger(n) && n >= 1 && n <= partCount)
    : [];

  if (requested.length > MAX_URLS_PER_CALL) {
    return NextResponse.json(
      {
        error: {
          code: "TOO_MANY_PARTS",
          message: `Request at most ${MAX_URLS_PER_CALL} part URLs per call.`,
        },
      },
      { status: 400 }
    );
  }

  const contentType = String(upload.contentType || "application/octet-stream");
  const signed = await Promise.all(
    requested.map((partNumber) => {
      const key = single ? finalKey : partKey(transferId, uploadId, partNumber);
      return getSignedUploadUrl(key, contentType).then((url) => (url ? { partNumber, url } : null));
    })
  );

  return NextResponse.json({
    data: {
      uploadId,
      transferId,
      partCount,
      partSize: Number(upload.partSize) || 0,
      fileSize: Number(upload.fileSize) || 0,
      single,
      completed,
      urls: signed.filter(Boolean),
    },
  });
}
