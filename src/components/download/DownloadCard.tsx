"use client";

import { useState, useMemo } from "react";
import { cn, formatFileSize, truncateFilename, getFileCategory } from "@/lib/utils";
import { useIsLightweight } from "@/contexts/LightweightContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FileTypeIcon } from "@/components/upload/FileTypeIcon";
import FilePreview from "./FilePreview";

export interface DownloadFileData {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  previewUrl?: string;
  downloadUrl: string;
}

export interface DownloadCardProps {
  /** Sender name or email */
  senderName?: string;
  /** Sender's message */
  message?: string;
  /** Files in the transfer */
  files: DownloadFileData[];
  /** Transfer expiry date */
  expiresAt: string;
  /** Download limit */
  downloadLimit: number;
  /** Current download count */
  downloadCount: number;
  /** URL for downloading all files as ZIP */
  zipDownloadUrl?: string;
  /** Total transfer size */
  totalSize: number;
  /** User tier for ad/branding display */
  tier?: "free" | "pro" | "business";
  /** Additional CSS classes */
  className?: string;
}

/**
 * DownloadCard component for the download page (/d/{shortCode}).
 *
 * Shows: sender info, message, file previews (2/3/4 column grid),
 * file list with individual download buttons, "Download All" ZIP button,
 * expiry countdown, download counter.
 *
 * Lightweight Mode: preview thumbnails replaced with file-type icons.
 * All touch targets 44px minimum.
 */
export default function DownloadCard({
  senderName,
  message,
  files,
  expiresAt,
  downloadLimit,
  downloadCount,
  zipDownloadUrl,
  totalSize,
  tier = "free",
  className,
}: DownloadCardProps) {
  const isLightweight = useIsLightweight();
  const downloadsRemaining = downloadLimit - downloadCount;

  // Calculate expiry countdown
  const expiryText = useMemo(() => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Expires in ${days} day${days > 1 ? "s" : ""}, ${hours} hour${hours !== 1 ? "s" : ""}`;
    return `Expires in ${hours} hour${hours !== 1 ? "s" : ""}`;
  }, [expiresAt]);

  // Files that have preview support
  const previewableFiles = files.filter((f) => {
    const cat = getFileCategory(f.mimeType);
    return cat === "image" || cat === "video" || cat === "pdf";
  });

  return (
    <Card
      padding="lg"
      elevation="lg"
      className={cn("w-full max-w-[600px]", className)}
    >
      {/* Sender info */}
      {senderName && (
        <div className="mb-4">
          <h2 className="text-h2">Files from {senderName}</h2>
          {message && (
            <p className="text-body-sm text-[var(--text-secondary)] mt-1 italic">
              &ldquo;{message}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Preview thumbnails grid (FR12, FR13, FR14) */}
      {!isLightweight && previewableFiles.length > 0 && (
        <div
          className={cn(
            "grid gap-2 mb-4",
            "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          )}
        >
          {previewableFiles.map((file) => (
            <FilePreview
              key={file.id}
              fileId={file.id}
              mimeType={file.mimeType}
              filename={file.originalName}
              previewUrl={file.previewUrl}
              downloadUrl={file.downloadUrl}
            />
          ))}
        </div>
      )}

      {/* File list */}
      <div className="space-y-1 mb-4">
        {files.map((file) => {
          const category = getFileCategory(file.mimeType);

          return (
            <div
              key={file.id}
              className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              {/* File icon */}
              <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                <FileTypeIcon category={category} size={20} />
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-body-sm text-[var(--text-primary)] truncate">
                  {truncateFilename(file.originalName, 40)}
                </p>
                <p className="text-caption-style text-[var(--text-muted)]">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Individual download button */}
              <a
                href={file.downloadUrl}
                download={file.originalName}
                className={cn(
                  "inline-flex items-center justify-center",
                  "px-3 py-2 min-h-[44px] min-w-[44px]",
                  "rounded-[var(--radius-md)]",
                  "text-body-sm font-medium text-nigerian-green",
                  "border border-nigerian-green/30",
                  "hover:bg-green-50 dark:hover:bg-green-900/20",
                  "transition-colors"
                )}
                aria-label={`Download ${file.originalName}`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1.5"
                  aria-hidden="true"
                >
                  <path d="M8 2v10M4 8l4 4 4-4" />
                  <path d="M2 14h12" />
                </svg>
                <span className="hidden sm:inline">Download</span>
              </a>
            </div>
          );
        })}
      </div>

      {/* Download All as ZIP */}
      {files.length > 1 && zipDownloadUrl && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 2v10M5 8l4 4 4-4" />
              <path d="M2 14h14" />
            </svg>
          }
        >
          <a href={zipDownloadUrl} download>
            Download All (ZIP &mdash; {formatFileSize(totalSize)})
          </a>
        </Button>
      )}

      {/* Metadata: expiry and download counter */}
      <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center gap-3 text-caption-style text-[var(--text-muted)]">
        <span>{expiryText}</span>
        <span className="text-[var(--border-color)]">|</span>
        <span>
          {downloadLimit > 9999
            ? "Unlimited downloads"
            : `${downloadsRemaining} of ${downloadLimit} downloads remaining`}
        </span>
      </div>

      {/* CTA section */}
      <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-center">
        <p className="text-body-sm text-[var(--text-secondary)] mb-3">
          Send your own files &mdash; free!
        </p>
        <Button variant="secondary" size="md">
          <a href="/">Start Transferring</a>
        </Button>
      </div>

      {/* Upgrade hint for free tier */}
      {tier === "free" && (
        <p className="text-caption-style text-[var(--text-muted)] text-center mt-3">
          Remove ads with NaijaTransfer Pro &mdash; NGN 2,000/month
        </p>
      )}
    </Card>
  );
}
