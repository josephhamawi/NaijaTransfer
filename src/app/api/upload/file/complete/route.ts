import { NextRequest, NextResponse } from "next/server";
import { composeFiles, deleteFile } from "@/lib/storage";
import { createFile } from "@/services/file.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Multipart upload — step 3 of 3.
 *
 * Composes the parts written by /part into the real destination object,
 * deletes the now-redundant part objects, and records the file in
 * Firestore. Quota was already reserved in /init, so a failure here
 * leaves a reserved-but-never-filled quota slot; that's fine for now —
 * the user can retry and the counter is bounded by transfer expiry.
 */
export async function POST(request: NextRequest) {
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
  const uploadRef = collection("uploads").doc(uploadId);
  const uploadSnap = await uploadRef.get();
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

  const sanitizedName = String(upload.fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const finalKey = `transfers/${upload.transferId}/${upload.fileId}/${sanitizedName}`;

  const partKeys: string[] = [];
  for (let i = 1; i <= upload.partCount; i++) {
    partKeys.push(
      `transfers/${upload.transferId}/parts/${uploadId}/${String(i).padStart(
        4,
        "0"
      )}`
    );
  }

  // ── Compose parts into the final object ───────────────────────────
  try {
    await composeFiles(finalKey, partKeys, upload.contentType);
  } catch (err) {
    console.error("Compose failed:", err);
    return NextResponse.json(
      {
        error: {
          code: "COMPOSE_FAILED",
          message:
            "Failed to finalize upload. Some parts may be missing. Please retry.",
        },
      },
      { status: 500 }
    );
  }

  // Best-effort cleanup of the temporary part objects. If these fail we
  // leak storage — not ideal, but the transfer's TTL cleanup will sweep
  // them eventually.
  await Promise.all(
    partKeys.map((k) => deleteFile(k).catch(() => undefined))
  );

  // ── Record the file ───────────────────────────────────────────────
  try {
    const fileDoc = await createFile(upload.transferId, {
      filename: sanitizedName,
      originalName: upload.fileName,
      sizeBytes: upload.fileSize,
      mimeType: upload.contentType,
      storageKey: finalKey,
    });

    // Session is done with — tombstone it.
    await uploadRef.delete().catch(() => undefined);

    return NextResponse.json({
      data: {
        fileId: fileDoc.id,
        name: upload.fileName,
        size: upload.fileSize,
      },
    });
  } catch (err) {
    console.error("Failed to record file after compose:", err);
    // The composed object is live but unreferenced — a later cleanup
    // sweep will catch it via the transfer TTL.
    return NextResponse.json(
      {
        error: {
          code: "RECORD_FAILED",
          message: "Upload succeeded but could not be recorded. Please retry.",
        },
      },
      { status: 500 }
    );
  }
}
