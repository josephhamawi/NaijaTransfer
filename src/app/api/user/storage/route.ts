import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTierLimits } from "@/lib/tier-limits";
import type { UserTier } from "@/types/enums";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
    }

    const limits = getTierLimits(user.tier as UserTier);

    const totalStorage = await db.file.aggregate({
      where: { transfer: { userId, status: "ACTIVE" } },
      _sum: { sizeBytes: true },
    });

    const activeTransfers = await db.transfer.count({
      where: { userId, status: "ACTIVE" },
    });

    const usedBytes = Number(totalStorage._sum.sizeBytes ?? 0);
    const maxBytes = limits.maxTotalStorageBytes;

    return NextResponse.json({
      data: {
        usedBytes,
        maxBytes,
        usedFormatted: formatBytes(usedBytes),
        maxFormatted: maxBytes ? formatBytes(maxBytes) : "Unlimited",
        percentage: maxBytes ? Math.round((usedBytes / maxBytes) * 100) : 0,
        activeTransfers,
        tier: user.tier,
      },
    });
  } catch (error) {
    console.error("Storage usage error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch storage" } }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}
