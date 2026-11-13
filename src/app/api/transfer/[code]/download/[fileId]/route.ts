import { NextRequest, NextResponse } from "next/server";
import { validateDownloadAccess, incrementDownloadCount } from "@/services/transfer.service";
import { getFileById, getFileDownloadUrl } from "@/services/file.service";
import { checkEgressAllowed, recordEgress } from "@/lib/egress";
import type { UserTier } from "@/types/enums";

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

    // Bandwidth is the product's largest variable cost once bytes leave
    // GCS, so the budget is checked BEFORE a signed URL exists. After
    // the URL is handed out the download is unstoppable and unmetered.
    const tier = (access.transfer.tier ?? "FREE") as UserTier;
    const budget = await checkEgressAllowed(tier, access.transfer.userId, file.sizeBytes);
    if (!budget.allowed) {
      return NextResponse.json(
        { error: { code: budget.reason, message: budget.message } },
        { status: 503, headers: { "Retry-After": "3600" } }
      );
    }

    const url = await getFileDownloadUrl(file.storageKey, file.originalName);
    await recordEgress(tier, access.transfer.userId, file.sizeBytes);

    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const ua = request.headers.get("user-agent") ?? "unknown";
    await incrementDownloadCount(access.transfer.id, ip, ua, fileId);

    // Send download notification to sender (non-blocking)
    if (access.transfer.senderEmail) {
      import("@/services/notification.service").then(({ sendDownloadNotification }) => {
        sendDownloadNotification({
          senderEmail: access.transfer!.senderEmail!,
          transferCode: code,
          downloadedAt: new Date(),
        }).catch(() => {});
      }).catch(() => {});
    }

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Download failed" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
