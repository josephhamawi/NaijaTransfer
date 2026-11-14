import type { Metadata } from "next";
import { getTransferByCode } from "@/services/transfer.service";

/**
 * Metadata for a download page.
 *
 * Three things worth knowing about this file:
 *
 * 1. **noindex.** A download URL is a private share link. It should
 *    never have been indexable — the page is meant for whoever was sent
 *    the link, not for search. The soft 404 this page used to return
 *    made that worse by letting crawlers treat dead transfers as live
 *    pages, but even a live transfer does not belong in an index.
 *    Open Graph still works, so WhatsApp and Slack previews are
 *    unaffected — those read the tags directly and ignore robots.
 *
 * 2. **Titles are bare.** The root layout applies a `%s | NaijaTransfer`
 *    template, so returning "Transfer | NaijaTransfer" here produced
 *    "Transfer | NaijaTransfer | NaijaTransfer".
 *
 * 3. **No self-fetch.** This used to HTTP GET its own /api/transfer
 *    endpoint through NEXT_PUBLIC_APP_URL — a request from the server
 *    back into itself, which cost a round trip and silently returned
 *    null whenever that env var was wrong (as it was, pointing at a
 *    domain with no DNS records at all). It reads the service directly.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;

  const noindex = { index: false, follow: false } as const;

  let transfer: Awaited<ReturnType<typeof getTransferByCode>> = null;
  try {
    transfer = await getTransferByCode(code);
  } catch {
    // Metadata must never be the reason a page fails to render.
    transfer = null;
  }

  if (!transfer) {
    return {
      title: "Transfer",
      description: "Download files shared via NaijaTransfer.",
      robots: noindex,
    };
  }

  const fileCount = transfer.files?.length || 0;
  const sizeFormatted = formatSize(Number(transfer.totalSizeBytes) || 0);
  const title = `${fileCount} file${fileCount !== 1 ? "s" : ""} (${sizeFormatted})`;
  const description = transfer.message
    ? `"${transfer.message.slice(0, 100)}" · ${fileCount} file${fileCount !== 1 ? "s" : ""}, ${sizeFormatted}. Download now.`
    : `${fileCount} file${fileCount !== 1 ? "s" : ""} (${sizeFormatted}) shared via NaijaTransfer. Download now, no account needed.`;

  return {
    title,
    description,
    robots: noindex,
    openGraph: {
      title: `${title} | NaijaTransfer`,
      description,
      url: `https://naijatransfer.com/d/${code}`,
      siteName: "NaijaTransfer",
      type: "website",
      images: [
        {
          url: "https://naijatransfer.com/og-download.svg",
          width: 1200,
          height: 630,
          alt: "NaijaTransfer: Download Files",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | NaijaTransfer`,
      description,
    },
  };
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
