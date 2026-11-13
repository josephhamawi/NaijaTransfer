import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-api";
import { getTierLimits } from "@/lib/tier-limits";
import { getUserStorageUsage } from "@/services/transfer.service";

/**
 * Storage usage for the dashboard.
 *
 * Reads Firestore, which is where transfers and files actually live.
 * The previous version aggregated the Postgres `files` table — a table
 * nothing had written to since transfers moved to Firestore, so the
 * dashboard reported zero for every account.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const limits = getTierLimits(user.tier);
    const { usedBytes, activeTransfers } = await getUserStorageUsage(user.id);
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

export const dynamic = "force-dynamic";
