import type { Metadata } from "next";

// Fetch transfer data server-side for Open Graph tags
async function getTransferMeta(code: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://naijatransfer.com";
    const res = await fetch(`${baseUrl}/api/transfer/${code}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const transfer = await getTransferMeta(code);

  if (!transfer) {
    return {
      title: "Transfer | NaijaTransfer",
      description: "Download files shared via NaijaTransfer.",
    };
  }

  const fileCount = transfer.files?.length || 0;
  const sizeFormatted = formatSize(transfer.totalSizeBytes || 0);
  const title = `${fileCount} file${fileCount !== 1 ? "s" : ""} (${sizeFormatted}) | NaijaTransfer`;
  const description = transfer.message
    ? `"${transfer.message.slice(0, 100)}" · ${fileCount} file${fileCount !== 1 ? "s" : ""}, ${sizeFormatted}. Download now.`
    : `${fileCount} file${fileCount !== 1 ? "s" : ""} (${sizeFormatted}) shared via NaijaTransfer. Download now, no account needed.`;

  return {
    title,
    description,
    openGraph: {
      title,
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
      title,
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
