import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";
import { createFile } from "@/services/file.service";
import { getTierLimits } from "@/lib/tier-limits";
import { nanoid } from "nanoid";
import type { UserTier } from "@/types/enums";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const transferId = formData.get("transferId") as string;
    const file = formData.get("file") as File;

    if (!transferId || !file) {
      return NextResponse.json(
        { error: { code: "MISSING_FIELDS", message: "transferId and file are required" } },
        { status: 400 }
      );
    }

    // Look up transfer to get tier
    const { collection } = await import("@/lib/firebase-admin");
    const transferDoc = await collection("transfers").doc(transferId).get();
    if (!transferDoc.exists) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Transfer not found" } },
        { status: 404 }
      );
    }

    const tier = (transferDoc.data()?.tier as UserTier) || "FREE";
    const limits = getTierLimits(tier);

    // Enforce file size limit
    if (file.size > limits.maxFileSizeBytes) {
      const maxGB = (limits.maxFileSizeBytes / (1024 * 1024 * 1024)).toFixed(0);
      return NextResponse.json(
        { error: { code: "FILE_TOO_LARGE", message: `File exceeds ${maxGB}GB limit. Upgrade your plan for larger transfers.` } },
        { status: 413 }
      );
    }

    // Check total transfer size (sum of existing files + this file)
    const filesSnap = await collection("transfers").doc(transferId).collection("files").get();
    const currentTotal = filesSnap.docs.reduce((sum, d) => sum + (d.data().sizeBytes || 0), 0);
    if (currentTotal + file.size > limits.maxFileSizeBytes) {
      const maxGB = (limits.maxFileSizeBytes / (1024 * 1024 * 1024)).toFixed(0);
      return NextResponse.json(
        { error: { code: "TRANSFER_TOO_LARGE", message: `Total transfer size would exceed ${maxGB}GB limit. Remove some files or upgrade.` } },
        { status: 413 }
      );
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate storage key
    const fileId = nanoid(12);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `transfers/${transferId}/${fileId}/${sanitizedName}`;

    // Upload to Firebase Storage
    await uploadFile(storageKey, buffer, file.type || "application/octet-stream");

    // Create file record in Firestore
    const fileDoc = await createFile(transferId, {
      filename: sanitizedName,
      originalName: file.name,
      sizeBytes: buffer.length,
      mimeType: file.type || "application/octet-stream",
      storageKey,
    });

    return NextResponse.json({
      data: {
        fileId: fileDoc.id,
        name: file.name,
        size: buffer.length,
      },
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: { code: "UPLOAD_FAILED", message: "File upload failed. Please try again." } },
      { status: 500 }
    );
  }
}
