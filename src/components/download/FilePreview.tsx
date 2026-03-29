"use client";

import { useState, useCallback } from "react";
import { cn, getFileCategory } from "@/lib/utils";
import { useIsLightweight } from "@/contexts/LightweightContext";
import { FileTypeIcon } from "@/components/upload/FileTypeIcon";
import { Dialog } from "@/components/ui/Dialog";

export interface FilePreviewProps {
  fileId: string;
  mimeType: string;
  filename: string;
  /** URL for the preview image/poster/PDF first page */
  previewUrl?: string;
  /** Full-resolution URL for lightbox */
  fullUrl?: string;
  /** File download URL */
  downloadUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FilePreview component for image thumbnails, video posters, PDF first pages (FR12-14).
 *
 * Lightweight Mode: shows file-type icon only, tap triggers download.
 * Full Mode: shows preview thumbnail, tap opens lightbox.
 *
 * Image: full-res in lightbox, pinch-to-zoom on mobile.
 * Video: poster frame with play button, does NOT auto-play (data-conscious).
 * PDF: first page thumbnail, "Download to see full document" CTA.
 *
 * Lightbox: dark backdrop, close via X/tap outside/Escape/swipe down.
 */
export default function FilePreview({
  fileId,
  mimeType,
  filename,
  previewUrl,
  fullUrl,
  downloadUrl,
  className,
}: FilePreviewProps) {
  const isLightweight = useIsLightweight();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const category = getFileCategory(mimeType);

  const handleClick = useCallback(() => {
    if (isLightweight) {
      // In lightweight mode, trigger download instead of lightbox
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
      }
    } else if (previewUrl || fullUrl) {
      setLightboxOpen(true);
    }
  }, [isLightweight, downloadUrl, previewUrl, fullUrl]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Determine what to show as thumbnail
  const showThumbnail =
    !isLightweight &&
    previewUrl &&
    (category === "image" || category === "video" || category === "pdf");

  return (
    <>
      {/* Thumbnail / Icon card */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative w-full aspect-square",
          "rounded-[var(--radius-md)] overflow-hidden",
          "bg-charcoal-50 dark:bg-charcoal-600",
          "flex items-center justify-center",
          "cursor-pointer",
          "transition-transform hover:scale-[1.02]",
          "group",
          className
        )}
        aria-label={`Preview ${filename}`}
      >
        {showThumbnail ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`Preview of ${filename}`}
              className="preview-thumbnail w-full h-full object-cover"
              loading="lazy"
            />
            {/* Video play button overlay */}
            {category === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="text-charcoal ml-0.5"
                    aria-hidden="true"
                  >
                    <path d="M6 4l10 6-10 6V4z" />
                  </svg>
                </div>
              </div>
            )}
            {/* PDF badge overlay */}
            {category === "pdf" && (
              <div className="absolute bottom-1 right-1 bg-error-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                PDF
              </div>
            )}
          </>
        ) : (
          /* File-type icon (lightweight mode or no preview available) */
          <div className="flex flex-col items-center gap-2 p-4">
            <FileTypeIcon category={category} size={32} />
            <span className="text-caption-style text-[var(--text-muted)] text-center line-clamp-2">
              {filename}
            </span>
          </div>
        )}
      </div>

      {/* Lightbox dialog */}
      {!isLightweight && (
        <Dialog
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          title={filename}
          size="full"
        >
          <div className="flex flex-col items-center">
            {category === "image" && (fullUrl || previewUrl) && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={fullUrl || previewUrl!}
                alt={filename}
                className="max-w-full max-h-[70vh] object-contain rounded-[var(--radius-md)]"
                loading="lazy"
              />
            )}

            {category === "video" && (fullUrl || previewUrl) && (
              <video
                src={fullUrl}
                poster={previewUrl}
                controls
                className="max-w-full max-h-[70vh] rounded-[var(--radius-md)]"
                preload="metadata"
              >
                Your browser does not support video playback.
              </video>
            )}

            {category === "pdf" && previewUrl && (
              <div className="w-full text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={`First page of ${filename}`}
                  className="max-w-full max-h-[60vh] object-contain rounded-[var(--radius-md)] mx-auto mb-4"
                  loading="lazy"
                />
                <p className="text-body-sm text-[var(--text-secondary)] mb-4">
                  Download to see the full document.
                </p>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    className={cn(
                      "inline-flex items-center justify-center gap-2",
                      "px-6 py-3 min-h-[44px]",
                      "rounded-[var(--radius-md)]",
                      "bg-nigerian-green text-white font-semibold",
                      "hover:bg-green-700 transition-colors"
                    )}
                    download
                  >
                    Download PDF
                  </a>
                )}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
