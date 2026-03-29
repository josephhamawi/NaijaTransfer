"use client";

import { cn } from "@/lib/utils";
import { formatSpeed, formatDuration } from "@/lib/utils";

export interface ProgressProps {
  /** Progress value 0-100 */
  value: number;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Upload/download speed in bytes/s */
  speed?: number;
  /** Estimated time remaining in seconds */
  eta?: number;
  /** Height of the bar */
  size?: "sm" | "md" | "lg";
  /** Optional label */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

/**
 * Progress bar component with optional speed, ETA, and percentage display.
 *
 * Used for both per-file progress (sm) and overall upload progress (lg).
 * Colored with Nigerian green, track uses semantic progress-track token.
 * Announces progress changes to screen readers.
 */
export function Progress({
  value,
  showPercentage = true,
  speed,
  eta,
  size = "md",
  label,
  className,
  ariaLabel,
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {/* Top info row */}
      {(label || showPercentage || speed !== undefined || eta !== undefined) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-body-sm text-[var(--text-primary)] truncate mr-2">
              {label}
            </span>
          )}
          <div className="flex items-center gap-3 text-caption-style text-[var(--text-secondary)] shrink-0 ml-auto">
            {speed !== undefined && speed > 0 && (
              <span>{formatSpeed(speed)}</span>
            )}
            {eta !== undefined && eta > 0 && (
              <span>ETA: {formatDuration(eta)}</span>
            )}
            {showPercentage && (
              <span className="font-medium text-[var(--text-primary)]">
                {Math.round(clampedValue)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div
        className={cn(
          "w-full rounded-[var(--radius-full)] bg-[var(--progress-track)] overflow-hidden",
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={Math.round(clampedValue)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || label || "Progress"}
      >
        <div
          className={cn(
            "h-full rounded-[var(--radius-full)] bg-[var(--progress-fill)]",
            "transition-[width] duration-300 ease-out"
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

export default Progress;
