import { NextRequest, NextResponse } from "next/server";
import { extractAndValidateApiKey, apiUnauthorized } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { deleteTransfer } from "@/services/transfer.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await extractAndValidateApiKey(request);
  if (!auth.valid || !auth.apiKey) return apiUnauthorized(auth.error!);

  try {
    const { id } = await params;
    const transfer = await db.transfer.findFirst({
      where: { id, userId: auth.apiKey.userId },
      include: { files: true, _count: { select: { downloadLogs: true } } },
    });

    if (!transfer) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Transfer not found" } }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: transfer.id,
        shortCode: transfer.shortCode,
        status: transfer.status,
        downloadCount: transfer.downloadCount,
        downloadLimit: transfer.downloadLimit,
        totalSizeBytes: Number(transfer.totalSizeBytes),
        expiresAt: transfer.expiresAt.toISOString(),
        createdAt: transfer.createdAt.toISOString(),
        files: transfer.files.map((f) => ({
          id: f.id,
          name: f.originalName,
          sizeBytes: Number(f.sizeBytes),
          mimeType: f.mimeType,
        })),
      },
    });
  } catch (error) {
    console.error("API get transfer error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to get transfer" } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await extractAndValidateApiKey(request);
  if (!auth.valid || !auth.apiKey) return apiUnauthorized(auth.error!);

  try {
    const { id } = await params;
    const deleted = await deleteTransfer(id, auth.apiKey.userId);
    if (!deleted) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Transfer not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("API delete transfer error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete transfer" } }, { status: 500 });
  }
}
