import { notFound } from "next/navigation";
import { getTransferByCode } from "@/services/transfer.service";
import { getTierLimits } from "@/lib/tier-limits";
import DownloadClient from "./DownloadClient";
import type { UserTier } from "@/types/enums";

/**
 * Download page.
 *
 * Server-rendered so a missing transfer is a real 404. This used to be
 * a client component that fetched on mount, which meant every unknown
 * code returned HTTP 200 with a "not found" card drawn in the browser —
 * a soft 404. Download links are public and get shared, and expired
 * transfers keep their URLs forever, so search engines were free to
 * index an unbounded set of dead pages as live ones.
 *
 * Doing the lookup here also removes the fetch waterfall: the file list
 * is in the first paint instead of arriving a round trip later.
 */

export const dynamic = "force-dynamic";

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const transfer = await getTransferByCode(code);

  // getTransferByCode returns null for absent, deleted AND expired
  // transfers alike, so all three land on the same 404. The segment's
  // not-found.tsx wording covers every case rather than claiming the
  // link never existed.
  if (!transfer) notFound();

  const limits = getTierLimits(transfer.tier as UserTier);

  return (
    <DownloadClient
      initialTransfer={{
        shortCode: transfer.shortCode,
        message: transfer.message,
        hasPassword: !!transfer.passwordHash,
        downloadLimit: transfer.downloadLimit,
        downloadCount: transfer.downloadCount,
        totalSizeBytes: Number(transfer.totalSizeBytes),
        expiresAt: transfer.expiresAt.toISOString(),
        showAds: limits.showAds,
        tier: transfer.tier,
        files: (transfer.files ?? []).map((f) => ({
          id: f.id,
          name: f.originalName,
          sizeBytes: Number(f.sizeBytes),
          mimeType: f.mimeType,
          hasPreview: !!f.previewKey,
        })),
      }}
    />
  );
}
