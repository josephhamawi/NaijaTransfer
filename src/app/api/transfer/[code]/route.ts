import { NextRequest, NextResponse } from "next/server";
import { getTransferByCode } from "@/services/transfer.service";
import { getTierLimits } from "@/lib/tier-limits";
import type { UserTier } from "@/types/enums";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const transfer = await getTransferByCode(code);

    if (!transfer) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Transfer not found or expired" } }, { status: 404 });
    }

    const limits = getTierLimits(transfer.tier as UserTier);

    return NextResponse.json({
      data: {
        shortCode: transfer.shortCode,
        type: transfer.type,
        status: transfer.status,
        message: transfer.message,
        hasPassword: !!transfer.passwordHash,
        downloadLimit: transfer.downloadLimit,
        downloadCount: transfer.downloadCount,
        totalSizeBytes: Number(transfer.totalSizeBytes),
        expiresAt: transfer.expiresAt.toISOString(),
        createdAt: transfer.createdAt.toISOString(),
        showAds: limits.showAds,
        tier: transfer.tier,
        files: (transfer.files ?? []).map((f) => ({
          id: f.id,
          name: f.originalName,
          sizeBytes: Number(f.sizeBytes),
          mimeType: f.mimeType,
          hasPreview: !!f.previewKey,
        })),
      },
    });
  } catch (error) {
    console.error("Transfer get error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch transfer" } }, { status: 500 });
  }
}
