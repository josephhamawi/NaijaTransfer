import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";
import { createFile } from "@/services/file.service";
import { nanoid } from "nanoid";

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
        storageKey,
      },
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: { code: "UPLOAD_FAILED", message: "File upload failed" } },
      { status: 500 }
    );
  }
}
