/**
 * Analytics Service
 * Custom metrics, reporting, and transfer analytics.
 * Full implementation in Epic 5: Dashboard Analytics.
 */

import { db } from "@/lib/db";

/**
 * Get download statistics for a specific transfer.
 */
export async function getTransferAnalytics(transferId: string) {
  const [downloadCount, downloads] = await Promise.all([
    db.downloadLog.count({ where: { transferId } }),
    db.downloadLog.findMany({
      where: { transferId },
      orderBy: { downloadedAt: "desc" },
      take: 100,
      select: {
        id: true,
        downloadedAt: true,
        country: true,
        fileId: true,
      },
    }),
  ]);

  return { downloadCount, recentDownloads: downloads };
}

/**
 * Get account-level analytics summary.
 */
export async function getAccountSummary(userId: string) {
  const [transferCount, totalDownloads, storageUsed] = await Promise.all([
    db.transfer.count({ where: { userId, status: "ACTIVE" } }),
    db.downloadLog.count({
      where: { transfer: { userId } },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { storageUsedBytes: true, tier: true },
    }),
  ]);

  return {
    activeTransfers: transferCount,
    totalDownloads,
    storageUsedBytes: storageUsed?.storageUsedBytes ?? BigInt(0),
    tier: storageUsed?.tier ?? "FREE",
  };
}
