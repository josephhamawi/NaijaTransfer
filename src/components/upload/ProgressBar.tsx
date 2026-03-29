"use client";

import { cn } from "@/lib/utils";
import { formatFileSize, formatDuration, formatSpeed } from "@/lib/utils";
import type { ConnectionState } from "@/types";

export interface FileProgress {
  id: string;
  name: string;
  size: number;
  progress: number;
  speed: number;
  eta: number;
  status: "pending" | "uploading" | "paused" | "complete" | "error";
}

export interface ProgressBarProps {
  /** Per-file progress data */
  files: FileProgress[];
  /** Overall progress 0-100 */
  overallProgress: number;
  /** Overall upload speed in bytes/s */
  overallSpeed: number;
  /** Overall ETA in seconds */
  overallEta: number;
  /** Current connection state */
  connectionState: ConnectionState;
  /** Callback to pause upload */
  onPause?: () => void;
  /** Callback to resume upload */
  onResume?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const statusLabels: Record<ConnectionState, string> = {
  idle: "",
  uploading: "Uploading...",
  paused: "Paused",
  reconnecting: "Reconnecting...",
  resuming: "Resuming...",
  completing: "Finalizing...",
  complete: "Complete!",
  error: "Upload failed",
};

const statusBarColors: Record<string, string> = {
  uploading: "bg-nigerian-green",
  paused: "bg-gold",
  reconnecting: "bg-gold",
  resuming: "bg-nigerian-green",
  completing: "bg-nigerian-green",
  complete: "bg-nigerian-green",
  error: "bg-error-red",
  pending: "bg-charcoal-100",
};

/**
 * ProgressBar component showing per-file + overall upload progress.
 *
 * Displays: file name, per-file thin progress bar (4px), overall bar (8px),
 * speed (MB/s updated every 2s rolling average), ETA, pause/resume button.
 *
 * Connection states: uploading (green), paused (gold), reconnecting (animated dots),
 * resuming (green, "Resuming from X%"), completing ("Finalizing..."), complete (green check).
 *
 * ARIA live region for screen reader progress announcements (NFR22).
 */
export default function ProgressBar({
  files,
  overallProgress,
  overallSpeed,
  overallEta,
  connectionState,
  onPause,
  onResume,
  className,
}: ProgressBarProps) {
  const isPaused =
    connectionState === "paused" || connectionState === "reconnecting";
  const isComplete = connectionState === "complete";

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Status label */}
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-body-sm font-medium",
            connectionState === "error"
              ? "text-error-red"
              : connectionState === "complete"
                ? "text-nigerian-green"
                : "text-[var(--text-primary)]"
          )}
          aria-live="polite"
        >
          {statusLabels[connectionState]}
          {connectionState === "reconnecting" && (
            <span className="animate-pulse">...</span>
          )}
          {connectionState === "resuming" && (
            <span> from {Math.round(overallProgress)}%</span>
          )}
        </p>
      </div>

      {/* Per-file progress */}
      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.id} className="flex items-center gap-3">
            {/* File name + size */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-body-sm text-[var(--text-primary)] truncate">
                  {file.name}
                </span>
                <span className="text-caption-style text-[var(--text-muted)] shrink-0 ml-2">
                  {formatFileSize(file.size)}
                </span>
              </div>

              {/* Per-file thin bar (4px) */}
              <div className="w-full h-1 rounded-full bg-[var(--progress-track)] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300 ease-out",
                    statusBarColors[file.status] || "bg-nigerian-green"
                  )}
                  style={{ width: `${Math.min(file.progress, 100)}%` }}
                />
              </div>
            </div>

            {/* Per-file percentage */}
            <span className="text-caption-style text-[var(--text-secondary)] w-10 text-right shrink-0">
              {Math.round(file.progress)}%
            </span>
          </div>
        ))}
      </div>

      {/* Overall progress section */}
      <div>
        {/* Stats row: speed, ETA */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 text-caption-style text-[var(--text-secondary)]">
            {!isComplete && (
              <>
                <span>
                  Overall: {Math.round(overallProgress)}%
                </span>
                <span className="text-[var(--border-color)]">|</span>
                <span>
                  {connectionState === "reconnecting"
                    ? "--"
                    : formatSpeed(overallSpeed)}
                </span>
                <span className="text-[var(--border-color)]">|</span>
                <span>
                  ETA:{" "}
                  {connectionState === "reconnecting"
                    ? "--"
                    : formatDuration(overallEta)}
                </span>
              </>
            )}
            {isComplete && (
              <span className="text-nigerian-green font-medium">
                Upload complete!
              </span>
            )}
          </div>
        </div>

        {/* Overall bar (8px) */}
        <div
          className="w-full h-2 rounded-full bg-[var(--progress-track)] overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(overallProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall upload progress"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300 ease-out",
              statusBarColors[connectionState] || "bg-nigerian-green"
            )}
            style={{ width: `${Math.min(overallProgress, 100)}%` }}
          />
        </div>

        {/* Screen reader live region for progress updates */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Upload {Math.round(overallProgress)}% complete.
          {overallSpeed > 0 && ` Speed: ${formatSpeed(overallSpeed)}.`}
          {overallEta > 0 && ` Estimated time remaining: ${formatDuration(overallEta)}.`}
        </div>
      </div>

      {/* Pause/Resume button + connection state indicator */}
      {!isComplete && connectionState !== "error" && (
        <div className="flex items-center gap-3">
          <button
            onClick={isPaused ? onResume : onPause}
            className={cn(
              "flex items-center justify-center gap-2",
              "px-4 py-2 min-h-[44px]",
              "rounded-[var(--radius-md)]",
              "text-body-sm font-medium",
              "border border-[var(--border-color)]",
              "text-[var(--text-primary)]",
              "hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50",
              "transition-colors"
            )}
            aria-label={isPaused ? "Resume upload" : "Pause upload"}
          >
            {isPaused ? (
              <>
                {/* Play icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M5 3l8 5-8 5V3z" />
                </svg>
                Resume
              </>
            ) : (
              <>
                {/* Pause icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="4" y="3" width="3" height="10" rx="0.5" />
                  <rect x="9" y="3" width="3" height="10" rx="0.5" />
                </svg>
                Pause
              </>
            )}
          </button>

          {/* Connection state indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                connectionState === "uploading" && "bg-nigerian-green",
                connectionState === "paused" && "bg-gold",
                connectionState === "reconnecting" && "bg-gold animate-pulse",
                connectionState === "resuming" && "bg-nigerian-green animate-pulse",
                connectionState === "completing" && "bg-nigerian-green animate-pulse"
              )}
              aria-hidden="true"
            />
            <span className="text-caption-style text-[var(--text-muted)]">
              {connectionState === "uploading" && "Connected"}
              {connectionState === "paused" && "Paused"}
              {connectionState === "reconnecting" && "Offline"}
              {connectionState === "resuming" && "Reconnected"}
              {connectionState === "completing" && "Finalizing"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
