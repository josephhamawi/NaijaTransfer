import { NextRequest, NextResponse } from "next/server";
import { uploadFileStream, deleteFile } from "@/lib/storage";
import { createFile } from "@/services/file.service";
import { getTierLimits } from "@/lib/tier-limits";
import { nanoid } from "nanoid";
import type { UserTier } from "@/types/enums";

export const dynamic = "force-dynamic";
// Streaming route — do not pre-parse the body.
export const runtime = "nodejs";

/**
 * Streaming per-file upload.
 *
 * Protocol (changed from prior FormData version to avoid buffering the whole
 * file in memory — that was OOM-killing the worker on big uploads):
 *
 *   POST /api/upload/file?transferId=<id>
 *     headers:
 *       X-File-Name: <original filename, URL-encoded if non-ASCII>
 *       X-File-Size: <bytes, integer>
 *       Content-Type: <mime type>
 *     body: raw file bytes
 *
 * Limits are enforced atomically via a Firestore transaction on the transfer
 * doc's `uploadedFileCount` / `uploadedSizeBytes` counters BEFORE the upload
 * starts. That closes the race where many parallel POSTs each read a stale
 * running total and every one of them passes the check.
 */
export async function POST(request: NextRequest) {
  const transferId = request.nextUrl.searchParams.get("transferId");
  const rawName = request.headers.get("x-file-name");
  const rawSize = request.headers.get("x-file-size");
  const contentType =
    request.headers.get("content-type") || "application/octet-stream";

  if (!transferId || !rawName || !rawSize) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_FIELDS",
          message:
            "transferId (query), X-File-Name, and X-File-Size are required.",
        },
      },
      { status: 400 }
    );
  }

  const fileSize = Number(rawSize);
  if (!Number.isFinite(fileSize) || fileSize < 0) {
    return NextResponse.json(
      { error: { code: "INVALID_SIZE", message: "X-File-Size must be a non-negative integer." } },
      { status: 400 }
    );
  }

  // Decode the filename — the client URL-encodes to avoid header encoding
  // pitfalls with non-ASCII chars.
  let originalName = rawName;
  try {
    originalName = decodeURIComponent(rawName);
  } catch {
    // fall through with the raw header value
  }

  if (!request.body) {
    return NextResponse.json(
      { error: { code: "EMPTY_BODY", message: "Request has no body." } },
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

  // Fast per-file check (cheap and doesn't need a transaction).
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

  // ── Atomic quota reservation ─────────────────────────────────────────
  // Increment the transfer's running counters inside a transaction so
  // concurrent uploads can't all pass a stale check. If this throws,
  // we refuse the upload before touching storage.
  try {
    await getDb().runTransaction(async (tx) => {
      const snap = await tx.get(transferRef);
      if (!snap.exists) throw new Error("TRANSFER_GONE");
      const data = snap.data() ?? {};
      const currentCount = (data.uploadedFileCount as number) ?? 0;
      const currentBytes = (data.uploadedSizeBytes as number) ?? 0;

      if (currentCount + 1 > limits.maxFilesPerTransfer) {
        throw new Error("TOO_MANY_FILES");
      }
      if (currentBytes + fileSize > limits.maxTransferSizeBytes) {
        throw new Error("TRANSFER_TOO_LARGE");
      }

      tx.update(transferRef, {
        uploadedFileCount: currentCount + 1,
        uploadedSizeBytes: currentBytes + fileSize,
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
            message: `Total transfer size would exceed ${maxGB}GB — the cap for your plan. Remove some files or upgrade.`,
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

  // ── Stream the body to storage ───────────────────────────────────────
  const fileId = nanoid(12);
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `transfers/${transferId}/${fileId}/${sanitizedName}`;

  try {
    await uploadFileStream(storageKey, request.body, contentType);
  } catch (err) {
    // Upload failed — release the quota we reserved so subsequent
    // uploads (or retries) don't see a phantom slot used. Best-effort:
    // if this decrement fails we leak a slot rather than block.
    console.error("Streaming upload failed, releasing quota:", err);
    try {
      await getDb().runTransaction(async (tx) => {
        const snap = await tx.get(transferRef);
        if (!snap.exists) return;
        const data = snap.data() ?? {};
        const count = Math.max(0, ((data.uploadedFileCount as number) ?? 0) - 1);
        const bytes = Math.max(0, ((data.uploadedSizeBytes as number) ?? 0) - fileSize);
        tx.update(transferRef, {
          uploadedFileCount: count,
          uploadedSizeBytes: bytes,
        });
      });
    } catch (releaseErr) {
      console.error("Failed to release quota after upload error:", releaseErr);
    }
    return NextResponse.json(
      { error: { code: "UPLOAD_FAILED", message: "File upload failed. Please try again." } },
      { status: 500 }
    );
  }

  // ── Record the file ──────────────────────────────────────────────────
  try {
    const fileDoc = await createFile(transferId, {
      filename: sanitizedName,
      originalName,
      sizeBytes: fileSize,
      mimeType: contentType,
      storageKey,
    });

    return NextResponse.json({
      data: {
        fileId: fileDoc.id,
        name: originalName,
        size: fileSize,
      },
    });
  } catch (err) {
    // Storage succeeded but we failed to record the file: delete the
    // orphan object and roll back the quota so the user can retry.
    console.error("Failed to record file after upload:", err);
    try {
      await deleteFile(storageKey);
    } catch {}
    try {
      await getDb().runTransaction(async (tx) => {
        const snap = await tx.get(transferRef);
        if (!snap.exists) return;
        const data = snap.data() ?? {};
        const count = Math.max(0, ((data.uploadedFileCount as number) ?? 0) - 1);
        const bytes = Math.max(0, ((data.uploadedSizeBytes as number) ?? 0) - fileSize);
        tx.update(transferRef, {
          uploadedFileCount: count,
          uploadedSizeBytes: bytes,
        });
      });
    } catch {}
    return NextResponse.json(
      { error: { code: "RECORD_FAILED", message: "Upload succeeded but could not be recorded. Please try again." } },
      { status: 500 }
    );
  }
}
