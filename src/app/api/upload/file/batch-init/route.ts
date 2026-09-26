import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getTierLimits } from "@/lib/tier-limits";
import { finalKeyFor, partKey, planParts, sanitizeName } from "@/lib/upload-parts";
import { getSignedUploadUrl, isDirectUploadAllowed } from "@/lib/storage";
import type { UserTier } from "@/types/enums";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Files accepted per call. Keeps the Firestore batch and the signing loop bounded. */
const MAX_FILES_PER_CALL = 64;

/**
 * Upper bound on signed URLs minted in one request. Signing is local
 * RSA work (~0.5 ms each) but a 200 GB business transfer would need
 * >12k of them, which would stall the event loop for seconds. Past the
 * cap the client fetches URLs just-in-time from /api/upload/file/sign.
 */
const MAX_URLS_PER_CALL = 128;

/**
 * Batch upload init — one round trip for a whole transfer.
 *
 * Replaces the per-file /init → /chunk → /complete sequence, which cost
 * roughly eleven serialized Firestore round trips *per file* plus a
 * full server-side copy of the data. Sending ten 2 MB files used to
 * spend most of its wall time waiting on Firestore, not moving bytes.
 *
 * What this does instead:
 *   1. one transaction that reserves quota for every file at once
 *   2. one batched write creating all upload-session docs
 *   3. V4-signed PUT URLs so the browser uploads straight into the
 *      bucket — no bytes through the Node process at all
 *
 * Files that fit in a single part are signed against their *final*
 * object key, so finishing them needs no compose and no cleanup.
 *
 * When the bucket has no browser-PUT CORS rule (or the runtime can't
 * sign), the response carries `direct: false` and no URLs; the client
 * then uses the legacy proxy path against the very same upload
 * sessions, so nothing breaks.
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
    files?: Array<{ fileName?: string; fileSize?: number; contentType?: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_JSON", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  const incoming = body.files ?? [];
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json(
      { error: { code: "MISSING_FIELDS", message: "files[] is required." } },
      { status: 400 }
    );
  }
  if (incoming.length > MAX_FILES_PER_CALL) {
    return NextResponse.json(
      {
        error: {
          code: "TOO_MANY_FILES_IN_BATCH",
          message: `Send at most ${MAX_FILES_PER_CALL} files per init call.`,
        },
      },
      { status: 400 }
    );
  }

  const files = incoming.map((f) => ({
    fileName: f.fileName,
    fileSize: f.fileSize,
    contentType: f.contentType || "application/octet-stream",
  }));

  for (const f of files) {
    if (
      !f.fileName ||
      typeof f.fileSize !== "number" ||
      !Number.isFinite(f.fileSize) ||
      f.fileSize < 0
    ) {
      return NextResponse.json(
        {
          error: {
            code: "MISSING_FIELDS",
            message: "Each file needs fileName and a non-negative fileSize.",
          },
        },
        { status: 400 }
      );
    }
  }

  const { collection, getDb } = await import("@/lib/firebase-admin");
  const db = getDb();
  const transferRef = collection("transfers").doc(transferId);

  // ── Reserve quota for the whole batch in one transaction ──────────
  // Tier is read from the same snapshot the reservation asserts on, so
  // this is a single round trip rather than a separate get + txn.
  let tier: UserTier = "FREE";
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(transferRef);
      if (!snap.exists) throw new Error("TRANSFER_GONE");
      const data = snap.data() ?? {};
      tier = (data.tier as UserTier) || "FREE";
      const limits = getTierLimits(tier);

      for (const f of files) {
        if (f.fileSize! > limits.maxFileSizeBytes) throw new Error("FILE_TOO_LARGE");
      }

      const count = (data.uploadedFileCount as number) ?? 0;
      const bytes = (data.uploadedSizeBytes as number) ?? 0;
      const addedBytes = files.reduce((s, f) => s + f.fileSize!, 0);

      if (count + files.length > limits.maxFilesPerTransfer) {
        throw new Error("TOO_MANY_FILES");
      }
      if (bytes + addedBytes > limits.maxTransferSizeBytes) {
        throw new Error("TRANSFER_TOO_LARGE");
      }

      tx.update(transferRef, {
        uploadedFileCount: count + files.length,
        uploadedSizeBytes: bytes + addedBytes,
      });
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";
    const limits = getTierLimits(tier);
    if (code === "TRANSFER_GONE") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Transfer not found" } },
        { status: 404 }
      );
    }
    if (code === "FILE_TOO_LARGE") {
      const maxGB = (limits.maxFileSizeBytes / 1024 ** 3).toFixed(0);
      return NextResponse.json(
        {
          error: {
            code,
            message: `File exceeds ${maxGB}GB per-file limit. Upgrade your plan for larger files.`,
          },
        },
        { status: 413 }
      );
    }
    if (code === "TOO_MANY_FILES") {
      return NextResponse.json(
        {
          error: {
            code,
            message: `This transfer would exceed ${limits.maxFilesPerTransfer} files, the cap for your plan.`,
          },
        },
        { status: 413 }
      );
    }
    if (code === "TRANSFER_TOO_LARGE") {
      const maxGB = (limits.maxTransferSizeBytes / 1024 ** 3).toFixed(0);
      return NextResponse.json(
        {
          error: {
            code,
            message: `Total transfer size would exceed ${maxGB}GB, the cap for your plan.`,
          },
        },
        { status: 413 }
      );
    }
    console.error("Batch reservation error:", err);
    return NextResponse.json(
      {
        error: {
          code: "RESERVATION_FAILED",
          message: "Could not reserve upload slots.",
        },
      },
      { status: 500 }
    );
  }

  // ── Can the browser PUT straight into the bucket? ─────────────────
  const origin =
    request.headers.get("origin") || process.env.APP_URL || "https://naijatransfer.com";
  const direct = await isDirectUploadAllowed(origin);

  // ── Plan parts, mint URLs, and write every session doc at once ────
  const batch = db.batch();
  let urlBudget = direct ? MAX_URLS_PER_CALL : 0;

  const uploads = await Promise.all(
    files.map(async (f, index) => {
      const uploadId = nanoid(16);
      const fileId = nanoid(12);
      const plan = planParts(f.fileSize!);
      const finalKey = finalKeyFor(transferId, fileId, f.fileName!);

      const session = {
        uploadId,
        transferId,
        fileId,
        fileName: f.fileName!,
        fileSize: f.fileSize!,
        contentType: f.contentType,
        partCount: plan.partCount,
        partSize: plan.partSize,
        // `single` uploads land on finalKey directly; multipart uploads
        // land on scratch part keys and get composed by /batch-complete.
        single: plan.single,
        finalKey,
        status: "uploading",
        createdAt: Date.now(),
      };
      batch.set(collection("uploads").doc(uploadId), session);

      const urls: Array<{ partNumber: number; url: string }> = [];
      if (direct) {
        const want = Math.min(plan.partCount, Math.max(0, urlBudget));
        urlBudget -= want;
        const signed = await Promise.all(
          Array.from({ length: want }, (_, i) => {
            const partNumber = i + 1;
            const key = plan.single ? finalKey : partKey(transferId, uploadId, partNumber);
            return getSignedUploadUrl(key, f.contentType).then((url) =>
              url ? { partNumber, url } : null
            );
          })
        );
        for (const s of signed) if (s) urls.push(s);
      }

      return {
        index,
        uploadId,
        fileId,
        fileName: f.fileName!,
        sanitizedName: sanitizeName(f.fileName!),
        partCount: plan.partCount,
        partSize: plan.partSize,
        single: plan.single,
        urls,
      };
    })
  );

  await batch.commit();

  // A signing failure on every file means the runtime has no usable key
  // (ADC-only). Tell the client to use the proxy path rather than letting
  // it discover this one failed PUT at a time.
  const anyUrls = uploads.some((u) => u.urls.length > 0);

  return NextResponse.json({
    data: {
      direct: direct && anyUrls,
      tier,
      uploads,
    },
  });
}
