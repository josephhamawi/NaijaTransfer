import { NextRequest, NextResponse } from "next/server";
import { getTransferByCode } from "@/services/transfer.service";
import { getFileById } from "@/services/file.service";
import { getPresignedDownloadUrl } from "@/lib/r2";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string; fileId: string }> }) {
  try {
    const { code, fileId } = await params;

    const transfer = await getTransferByCode(code);
    if (!transfer) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Transfer not found" } }, { status: 404 });
    }

    const file = await getFileById(fileId);
    if (!file || file.transferId !== transfer.id) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "File not found" } }, { status: 404 });
    }

    const previewKey = file.r2PreviewKey;
    if (!previewKey) {
      return NextResponse.json({ error: { code: "NO_PREVIEW", message: "No preview available" } }, { status: 404 });
    }

    const url = await getPresignedDownloadUrl(previewKey, 300);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Preview failed" } }, { status: 500 });
  }
}
