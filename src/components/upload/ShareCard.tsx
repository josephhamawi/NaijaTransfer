"use client";

import { useState, useCallback } from "react";
import { cn, formatFileSize } from "@/lib/utils";
import { useIsLightweight } from "@/contexts/LightweightContext";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";

export interface ShareCardProps {
  /** Transfer short code */
  shortCode: string;
  /** Full download URL */
  downloadUrl: string;
  /** QR code data URL or SVG string */
  qrCodeDataUrl?: string;
  /** Number of files in the transfer */
  fileCount: number;
  /** Total transfer size in bytes */
  totalSize: number;
  /** Expiry date string */
  expiresAt: string;
  /** Download limit */
  downloadLimit: number;
  /** Callback to reset and send another transfer */
  onSendAnother?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ShareCard appears after a successful upload.
 *
 * Shows: transfer link with copy button, QR code, WhatsApp/SMS/Email/Copy
 * share buttons, transfer summary, receipt download, and "Send Another" button.
 *
 * WhatsApp: deep link to wa.me with pre-formatted message (FR20).
 * SMS: sms: URI with pre-formatted body (FR21).
 * Email: mailto: URI with subject and body (FR24).
 * QR: inline rendered QR code (FR22).
 * Copy: clipboard API with "Copied!" toast (FR23).
 */
export default function ShareCard({
  shortCode,
  downloadUrl,
  qrCodeDataUrl,
  fileCount,
  totalSize,
  expiresAt,
  downloadLimit,
  onSendAnother,
  className,
}: ShareCardProps) {
  const isLightweight = useIsLightweight();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const shareMessage = `I sent you files via NigeriaTransfer: ${downloadUrl}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent("Files for you via NigeriaTransfer")}&body=${encodeURIComponent(shareMessage)}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      toast.success("Link copied!", "The transfer link has been copied to your clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = downloadUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [downloadUrl, toast]);

  const expiryDate = new Date(expiresAt);
  const expiryFormatted = expiryDate.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Success indicator */}
      <div className="text-center">
        {/* Green checkmark */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 mb-3">
          {isLightweight ? (
            /* Static checkmark in lightweight mode */
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-nigerian-green static-on-light"
              aria-hidden="true"
            >
              <path d="M8 16l6 6 10-10" />
            </svg>
          ) : (
            /* Animated checkmark in full mode */
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className="text-nigerian-green animate-on-full"
              aria-hidden="true"
            >
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.2"
              />
              <path
                d="M8 16l6 6 10-10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {/* Static fallback is always rendered for lightweight */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-nigerian-green"
            style={{ display: isLightweight ? "block" : "none" }}
            aria-hidden="true"
          >
            <path d="M8 16l6 6 10-10" />
          </svg>
        </div>
        <h2 className="text-h2 text-[var(--text-primary)]">Files sent!</h2>
      </div>

      {/* Transfer link */}
      <div className="bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-3">
        <p className="text-body font-medium text-[var(--text-primary)] break-all text-center">
          {downloadUrl}
        </p>
        <button
          onClick={handleCopy}
          className={cn(
            "mt-2 w-full flex items-center justify-center gap-2",
            "px-4 py-2.5 min-h-[44px]",
            "rounded-[var(--radius-md)]",
            "text-body-sm font-medium",
            "transition-colors",
            copied
              ? "bg-nigerian-green text-white"
              : "bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50"
          )}
          aria-label={copied ? "Copied!" : "Copy link to clipboard"}
        >
          {copied ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 8.5l3 3 7-7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="5" y="5" width="9" height="9" rx="1.5" />
                <path d="M2 11V3a1.5 1.5 0 011.5-1.5H11" />
              </svg>
              Copy Link
            </>
          )}
        </button>
      </div>

      {/* QR Code */}
      {qrCodeDataUrl && (
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-[var(--radius-md)] inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeDataUrl}
              alt={`QR code for transfer ${shortCode}`}
              width={120}
              height={120}
              className="w-[120px] h-[120px]"
            />
          </div>
        </div>
      )}

      {/* Share buttons row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Share options">
        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "px-3 py-2.5 min-h-[44px] min-w-[80px]",
            "rounded-[var(--radius-md)]",
            "bg-[#25D366] text-white font-medium text-body-sm",
            "hover:bg-[#20bd5a] transition-colors"
          )}
          aria-label="Share via WhatsApp"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        {/* SMS */}
        <a
          href={smsUrl}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "px-3 py-2.5 min-h-[44px] min-w-[80px]",
            "rounded-[var(--radius-md)]",
            "bg-[#3b82f6] text-white font-medium text-body-sm",
            "hover:bg-[#2563eb] transition-colors"
          )}
          aria-label="Share via SMS"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="hidden sm:inline">SMS</span>
        </a>

        {/* Email */}
        <a
          href={emailUrl}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "px-3 py-2.5 min-h-[44px] min-w-[80px]",
            "rounded-[var(--radius-md)]",
            "bg-charcoal-400 text-white font-medium text-body-sm",
            "hover:bg-charcoal dark:hover:bg-charcoal-600 transition-colors"
          )}
          aria-label="Share via Email"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-10 7L2 7" />
          </svg>
          <span className="hidden sm:inline">Email</span>
        </a>

        {/* Copy */}
        <button
          onClick={handleCopy}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "px-3 py-2.5 min-h-[44px] min-w-[80px]",
            "rounded-[var(--radius-md)]",
            "border border-[var(--border-color)]",
            "font-medium text-body-sm",
            "text-[var(--text-primary)]",
            "hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50",
            "transition-colors"
          )}
          aria-label="Copy link"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="8" y="8" width="12" height="12" rx="2" />
            <path d="M4 16V4a2 2 0 012-2h12" />
          </svg>
          <span className="hidden sm:inline">Copy</span>
        </button>
      </div>

      {/* Transfer summary */}
      <div className="flex items-center justify-center gap-3 text-body-sm text-[var(--text-secondary)] flex-wrap">
        <span>
          {fileCount} {fileCount === 1 ? "file" : "files"}
        </span>
        <span className="text-[var(--border-color)]">|</span>
        <span>{formatFileSize(totalSize)}</span>
        <span className="text-[var(--border-color)]">|</span>
        <span>Expires {expiryFormatted}</span>
        <span className="text-[var(--border-color)]">|</span>
        <span>
          {downloadLimit > 9999 ? "Unlimited" : downloadLimit} downloads
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="md" fullWidth onClick={() => window.print()}>
          Download receipt (PDF)
        </Button>
        <Button variant="primary" size="lg" fullWidth onClick={onSendAnother}>
          Send Another Transfer
        </Button>
      </div>
    </div>
  );
}
