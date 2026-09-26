import { NextRequest, NextResponse } from "next/server";
import { composeMany, deleteFile, getObjectSize } from "@/lib/storage";
import { partKey } from "@/lib/upload-parts";
import { safeRelativePath } from "@/services/file.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Firestore caps a write batch at 500 operations. */
const MAX_BATCH_OPS = 400;

/** Bound on concurrent storage calls so a 100-file transfer can't flood GCS. */
const STORAGE_CONCURRENCY = 12;

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Batch finalize — one call closes out every file in a transfer.
 *
 * The old per-file /complete cost five serialized Firestore round trips
 * plus, for single-part files, a full server-side copy of the object
 * (parts were always written to scratch keys and then copied). Here:
 *
 *  - single-part files already sit on their final key, so finishing one
 *    is a metadata read, nothing more
 *  - multipart files are composed (a metadata operation; no bytes move)
 *    concurrently rather than one file after another
 *  - every file doc, session tombstone and counter update lands in a
 *    single Firestore batch
 */
export async function POST(request: NextRequest) {
  const transferId = request.nextUrl.searchParams.get("transferId");
  if (!transferId) {
    return NextResponse.json(
      { error: { code: "MISSING_TRANSFER", message: "transferId is required" } },
      { status: 400 }
    );
  }

  let body: { uploadIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  const uploadIds = (body.uploadIds ?? []).filter(
    (id): id is string => typeof id === "string" && id.length > 0
  );
  if (uploadIds.length === 0) {
    return NextResponse.json(
      { error: { code: "MISSING_FIELDS", message: "uploadIds[] is required." } },
      { status: 400 }
    );
  }

  const { collection, getDb } = await import("@/lib/firebase-admin");
  const { FieldValue } = await import("firebase-admin/firestore");
  const db = getDb();

  // One round trip for every session doc.
  const refs = uploadIds.map((id) => collection("uploads").doc(id));
  const snaps = await db.getAll(...refs);

  const sessions = snaps
    .filter((s) => s.exists)
    .map((s) => s.data()!)
    .filter((u) => String(u.transferId) === transferId);

  if (sessions.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "UPLOAD_NOT_FOUND",
          message: "No matching upload sessions for this transfer.",
        },
      },
      { status: 404 }
    );
  }

  // ── Materialise each file in storage ──────────────────────────────
  const finalized = await mapPool(sessions, STORAGE_CONCURRENCY, async (u) => {
    const uploadId = String(u.uploadId);
    const finalKey = String(u.finalKey);
    const declaredSize = Number(u.fileSize) || 0;
    const partCount = Number(u.partCount) || 1;

    try {
      if (!u.single) {
        const keys = Array.from({ length: partCount }, (_, i) =>
          partKey(transferId, uploadId, i + 1)
        );
        await composeMany(finalKey, keys, String(u.contentType));
        // Scratch parts are dead weight now. Leaking them only costs
        // storage until the transfer's TTL sweep, so don't fail on it.
        void Promise.allSettled(keys.map((k) => deleteFile(k)));
      }

      // Trust the bucket, not the client, for the recorded size.
      const actualSize = await getObjectSize(finalKey);
      if (actualSize === null) {
        return { uploadId, ok: false as const, error: "MISSING_OBJECT" };
      }

      return {
        uploadId,
        ok: true as const,
        fileId: String(u.fileId),
        fileName: String(u.fileName),
        contentType: String(u.contentType || "application/octet-stream"),
        finalKey,
        actualSize,
        declaredSize,
      };
    } catch (err) {
      console.error(`Finalize failed for ${uploadId}:`, err);
      return { uploadId, ok: false as const, error: "COMPOSE_FAILED" };
    }
  });

  const ok = finalized.filter((f) => f.ok);
  const failed = finalized.filter((f) => !f.ok);

  // ── Record everything in one batched write ────────────────────────
  const transferRef = collection("transfers").doc(transferId);
  const filesCol = transferRef.collection("files");

  const created: Array<{ fileId: string; name: string; size: number }> = [];
  let sizeDelta = 0;
  let completedBytes = 0;

  let batch = db.batch();
  let ops = 0;
  const commits: Array<Promise<unknown>> = [];
  const flush = () => {
    if (ops === 0) return;
    commits.push(batch.commit());
    batch = db.batch();
    ops = 0;
  };

  for (const f of ok) {
    if (!f.ok) continue;
    const ref = filesCol.doc();
    batch.set(ref, {
      transferId,
      filename: f.fileName.split("/").pop() || f.fileName,
      originalName: safeRelativePath(f.fileName),
      sizeBytes: f.actualSize,
      mimeType: f.contentType,
      storageKey: f.finalKey,
      previewKey: null,
      createdAt: new Date(),
    });
    batch.delete(collection("uploads").doc(f.uploadId));
    ops += 2;

    sizeDelta += f.actualSize - f.declaredSize;
    completedBytes += f.actualSize;
    created.push({ fileId: ref.id, name: f.fileName, size: f.actualSize });
    if (ops >= MAX_BATCH_OPS) flush();
  }

  // Reservation happened at init against the client's declared sizes;
  // reconcile with what actually landed. totalSizeBytes tracks bytes
  // genuinely stored, which is what the download page reports.
  batch.update(transferRef, {
    totalSizeBytes: FieldValue.increment(completedBytes),
    ...(sizeDelta !== 0 ? { uploadedSizeBytes: FieldValue.increment(sizeDelta) } : {}),
  });
  ops += 1;
  flush();

  await Promise.all(commits);

  if (created.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "COMPLETE_FAILED",
          message: "Upload could not be finalized. Please retry.",
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: {
      files: created,
      failed: failed.map((f) => ({ uploadId: f.uploadId, error: f.error })),
    },
  });
}
