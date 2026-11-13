import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const password = request.headers.get("x-transfer-password") ?? undefined;

    // Dynamic imports to avoid build-time analysis
    const { validateDownloadAccess, incrementDownloadCount } = await import("@/services/transfer.service");
    const { streamZipDownload } = await import("@/services/file.service");

    const access = await validateDownloadAccess(code, password);
    if (!access.valid || !access.transfer) {
      return NextResponse.json({ error: { code: access.error, message: "Access denied" } }, { status: access.error === "PASSWORD_REQUIRED" ? 401 : 404 });
    }

    // `?prefix=<folderName>` filters the ZIP to a single uploaded
    // top-level folder. Strip any slashes the caller might pass so we
    // can't be tricked into matching deeper paths or escaping prefix
    // semantics.
    const rawPrefix = request.nextUrl.searchParams.get("prefix") ?? undefined;
    const prefix = rawPrefix
      ? rawPrefix.split("/").filter((s) => s && s !== "." && s !== "..")[0]
      : undefined;

    // The zip streams every byte out through Cloud Run, so it bills
    // internet egress exactly like a direct download does — check the
    // budget before a single byte moves.
    const { checkEgressAllowed, recordEgress } = await import("@/lib/egress");
    const { getTransferFiles } = await import("@/services/file.service");
    const tier = (access.transfer.tier ?? "FREE") as import("@/types/enums").UserTier;

    const candidates = await getTransferFiles(access.transfer.id);
    const zipBytes = candidates
      .filter((f) => (prefix ? f.originalName.startsWith(`${prefix}/`) : true))
      .reduce((sum, f) => sum + Number(f.sizeBytes ?? 0), 0);

    const budget = await checkEgressAllowed(tier, access.transfer.userId, zipBytes);
    if (!budget.allowed) {
      return NextResponse.json(
        { error: { code: budget.reason, message: budget.message } },
        { status: 503, headers: { "Retry-After": "3600" } }
      );
    }

    const result = await streamZipDownload(access.transfer.id, prefix);
    if (!result) {
      return NextResponse.json({ error: { code: "NO_FILES", message: "No files in transfer" } }, { status: 404 });
    }

    await recordEgress(tier, access.transfer.userId, result.totalSize);

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

    const filenameBase = prefix
      ? prefix.replace(/[^a-zA-Z0-9._-]/g, "_")
      : `NaijaTransfer-${code}`;

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filenameBase}.zip"`,
      },
    });
  } catch (error) {
    console.error("ZIP download error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Download failed" } }, { status: 500 });
  }
}
