import { NextRequest, NextResponse } from "next/server";
import { getTransferByCode } from "@/services/transfer.service";
import { getFileById, getFileDownloadUrl } from "@/services/file.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string; fileId: string }> }) {
  try {
    const { code, fileId } = await params;

    const transfer = await getTransferByCode(code);
    if (!transfer) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Transfer not found" } }, { status: 404 });
    }

    const file = await getFileById(transfer.id, fileId);
    if (!file) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "File not found" } }, { status: 404 });
    }

    const previewKey = file.previewKey;
    if (!previewKey) {
      return NextResponse.json({ error: { code: "NO_PREVIEW", message: "No preview available" } }, { status: 404 });
    }

    const url = await getFileDownloadUrl(previewKey, file.originalName);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Preview failed" } }, { status: 500 });
  }
}
