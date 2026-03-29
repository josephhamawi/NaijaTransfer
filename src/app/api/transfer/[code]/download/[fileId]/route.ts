import { NextRequest, NextResponse } from "next/server";
import { validateDownloadAccess, incrementDownloadCount } from "@/services/transfer.service";
import { getFileById, getFileDownloadUrl } from "@/services/file.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string; fileId: string }> }) {
  try {
    const { code, fileId } = await params;
    const password = request.headers.get("x-transfer-password") ?? undefined;

    const access = await validateDownloadAccess(code, password);
    if (!access.valid || !access.transfer) {
      const status = access.error === "PASSWORD_REQUIRED" ? 401 : access.error === "INVALID_PASSWORD" ? 403 : 404;
      return NextResponse.json({ error: { code: access.error, message: "Access denied" } }, { status });
    }

    const file = await getFileById(access.transfer.id, fileId);
    if (!file) {
      return NextResponse.json({ error: { code: "FILE_NOT_FOUND", message: "File not found" } }, { status: 404 });
    }

    const url = await getFileDownloadUrl(file.storageKey, file.originalName);

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const ua = request.headers.get("user-agent") ?? "unknown";
    await incrementDownloadCount(access.transfer.id, ip, ua, fileId);

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Download failed" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
