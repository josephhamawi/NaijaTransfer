import { NextRequest, NextResponse } from "next/server";
import { validateDownloadAccess, incrementDownloadCount } from "@/services/transfer.service";
import { streamZipDownload } from "@/services/file.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const password = request.headers.get("x-transfer-password") ?? undefined;

    const access = await validateDownloadAccess(code, password);
    if (!access.valid || !access.transfer) {
      return NextResponse.json({ error: { code: access.error, message: "Access denied" } }, { status: access.error === "PASSWORD_REQUIRED" ? 401 : 404 });
    }

    const result = await streamZipDownload(access.transfer.id);
    if (!result) {
      return NextResponse.json({ error: { code: "NO_FILES", message: "No files in transfer" } }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const ua = request.headers.get("user-agent") ?? "unknown";
    await incrementDownloadCount(access.transfer.id, ip, ua);

    const readable = new ReadableStream({
      start(controller) {
        result.stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        result.stream.on("end", () => controller.close());
        result.stream.on("error", (err: Error) => controller.error(err));
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="NigeriaTransfer-${code}.zip"`,
      },
    });
  } catch (error) {
    console.error("ZIP download error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Download failed" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
