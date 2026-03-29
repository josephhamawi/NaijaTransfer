"use client";

import { useEffect } from "react";
import { cn, formatDuration, formatSpeed } from "@/lib/utils";
import { useBandwidth, type BandwidthEstimate } from "@/hooks/useBandwidth";

export interface BandwidthEstimatorProps {
  /** Total bytes to be uploaded */
  totalBytes: number;
  /** Whether to auto-start the estimation */
  autoStart?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const qualityColors: Record<BandwidthEstimate["quality"], string> = {
  poor: "text-error-red",
  fair: "text-gold-600",
  good: "text-nigerian-green",
  excellent: "text-nigerian-green",
};

const qualityIcons: Record<BandwidthEstimate["quality"], React.ReactNode> = {
  poor: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="1" y="10" width="2" height="3" rx="0.5" />
      <rect x="5" y="8" width="2" height="5" rx="0.5" opacity="0.2" />
      <rect x="9" y="5" width="2" height="8" rx="0.5" opacity="0.2" />
    </svg>
  ),
  fair: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="1" y="10" width="2" height="3" rx="0.5" />
      <rect x="5" y="8" width="2" height="5" rx="0.5" />
      <rect x="9" y="5" width="2" height="8" rx="0.5" opacity="0.2" />
    </svg>
  ),
  good: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="1" y="10" width="2" height="3" rx="0.5" />
      <rect x="5" y="8" width="2" height="5" rx="0.5" />
      <rect x="9" y="5" width="2" height="8" rx="0.5" />
    </svg>
  ),
  excellent: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="1" y="10" width="2" height="3" rx="0.5" />
      <rect x="5" y="8" width="2" height="5" rx="0.5" />
      <rect x="9" y="5" width="2" height="8" rx="0.5" />
    </svg>
  ),
};

/**
 * BandwidthEstimator probes the server connection and displays
 * estimated upload time before the user clicks "Transfer" (FR60).
 *
 * Shows: "Estimated time: ~8 minutes on your connection"
 * Positioned below the Transfer button.
 *
 * Uses useBandwidth hook which POSTs ~100KB to /api/upload/probe.
 */
export default function BandwidthEstimator({
  totalBytes,
  autoStart = true,
  className,
}: BandwidthEstimatorProps) {
  const { estimate, isEstimating, estimateBandwidth } = useBandwidth();

  // Auto-run estimation when totalBytes changes
  useEffect(() => {
    if (autoStart && totalBytes > 0) {
      estimateBandwidth(totalBytes);
    }
  }, [autoStart, totalBytes, estimateBandwidth]);

  if (totalBytes === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-caption-style",
        className
      )}
      aria-live="polite"
    >
      {isEstimating && (
        <>
          <svg
            className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.25"
            />
            <path
              d="M14 8a6 6 0 00-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[var(--text-muted)]">
            Estimating connection speed...
          </span>
        </>
      )}

      {!isEstimating && estimate && (
        <>
          <span className={qualityColors[estimate.quality]}>
            {qualityIcons[estimate.quality]}
          </span>
          <span className="text-[var(--text-secondary)]">
            Estimated time:{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {formatDuration(estimate.estimatedTimeSeconds)}
            </span>{" "}
            on your connection
            <span className="hidden sm:inline">
              {" "}
              ({formatSpeed(estimate.speedBps)})
            </span>
          </span>
        </>
      )}
    </div>
  );
}
