import { NextRequest, NextResponse } from "next/server";
import { getTierLimits } from "@/lib/tier-limits";
import { nanoid } from "nanoid";
import type { UserTier } from "@/types/enums";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Multipart upload — step 1 of 3.
 *
 * Reserves quota atomically on the transfer doc and creates an upload
 * session record. The client then POSTs each part to /part and finally
 * hits /complete to stitch the parts into the real object.
 *
 * Why multipart: a single TCP flow from Lagos to Frankfurt is usually
 * capped well below the user's total upstream; parallel flows let the
 * browser + ISP saturate the link and roughly halve wall time on real
 * residential connections.
 */
export async function POST(request: NextRequest) {
  const transferId = request.nextUrl.searchParams.get("transferId");
  if (!transferId) {
    return NextResponse.json(
      { error: { code: "MISSING_TRANSFER", message: "transferId is required" } },
      { status: 400 }
    );
  }

  let body: {
    fileName?: string;
    fileSize?: number;
    contentType?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  const fileName = body.fileName;
  const fileSize = body.fileSize;
  const contentType = body.contentType || "application/octet-stream";

  if (
    !fileName ||
    typeof fileSize !== "number" ||
    !Number.isFinite(fileSize) ||
    fileSize < 0
  ) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_FIELDS",
          message: "fileName and non-negative fileSize are required.",
        },
      },
      { status: 400 }
    );
  }

  const { collection, getDb } = await import("@/lib/firebase-admin");
  const transferRef = collection("transfers").doc(transferId);
  const transferSnap = await transferRef.get();
  if (!transferSnap.exists) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Transfer not found" } },
      { status: 404 }
    );
  }
  const tier = (transferSnap.data()?.tier as UserTier) || "FREE";
  const limits = getTierLimits(tier);

  if (fileSize > limits.maxFileSizeBytes) {
    const maxGB = (limits.maxFileSizeBytes / (1024 ** 3)).toFixed(0);
    return NextResponse.json(
      {
        error: {
          code: "FILE_TOO_LARGE",
          message: `File exceeds ${maxGB}GB per-file limit. Upgrade your plan for larger files.`,
        },
      },
      { status: 413 }
    );
  }

  // ── Atomic quota reservation (same pattern as single-part upload) ──
  try {
    await getDb().runTransaction(async (tx) => {
      const snap = await tx.get(transferRef);
      if (!snap.exists) throw new Error("TRANSFER_GONE");
      const data = snap.data() ?? {};
      const count = (data.uploadedFileCount as number) ?? 0;
      const bytes = (data.uploadedSizeBytes as number) ?? 0;

      if (count + 1 > limits.maxFilesPerTransfer) {
        throw new Error("TOO_MANY_FILES");
      }
      if (bytes + fileSize > limits.maxTransferSizeBytes) {
        throw new Error("TRANSFER_TOO_LARGE");
      }

      tx.update(transferRef, {
        uploadedFileCount: count + 1,
        uploadedSizeBytes: bytes + fileSize,
      });
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";
    if (code === "TOO_MANY_FILES") {
      return NextResponse.json(
        {
          error: {
            code,
            message: `This transfer already has ${limits.maxFilesPerTransfer} files — the cap for your plan.`,
          },
        },
        { status: 413 }
      );
    }
    if (code === "TRANSFER_TOO_LARGE") {
      const maxGB = (limits.maxTransferSizeBytes / (1024 ** 3)).toFixed(0);
      return NextResponse.json(
        {
          error: {
            code,
            message: `Total transfer size would exceed ${maxGB}GB — the cap for your plan.`,
          },
        },
        { status: 413 }
      );
    }
    console.error("Upload reservation error:", err);
    return NextResponse.json(
      { error: { code: "RESERVATION_FAILED", message: "Could not reserve upload slot." } },
      { status: 500 }
    );
  }

  // ── Decide part layout ──────────────────────────────────────────────
  // Cap at 4 parallel parts: browsers cap at 6 concurrent requests per
  // origin, and we need headroom for the /complete call. Below ~32 MB
  // the parallelism overhead isn't worth it — fall back to one part.
  const PART_FLOOR = 32 * 1024 * 1024;
  const MAX_PARTS = 4;
  const partCount =
    fileSize <= PART_FLOOR
      ? 1
      : Math.min(MAX_PARTS, Math.ceil(fileSize / PART_FLOOR));
  const partSize = Math.ceil(fileSize / partCount);

  const uploadId = nanoid(16);
  const fileId = nanoid(12);

  await collection("uploads").doc(uploadId).set({
    uploadId,
    transferId,
    fileId,
    fileName,
    fileSize,
    contentType,
    partCount,
    partSize,
    status: "uploading",
    createdAt: Date.now(),
  });

  return NextResponse.json({
    data: {
      uploadId,
      partCount,
      partSize,
    },
  });
}
