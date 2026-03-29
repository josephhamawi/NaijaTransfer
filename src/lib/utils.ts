/** Class value type matching clsx convention */
type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassValue[]
  | Record<string, unknown>;

/**
 * Utility function to merge Tailwind CSS class names.
 * Self-contained implementation that handles conditional classes
 * without requiring clsx or tailwind-merge as dependencies.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string") {
      classes.push(input);
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(" ");
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `~${mins} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `~${hours}h ${mins}m`;
}

/**
 * Format speed in bytes per second to human-readable string
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return "--";
  return `${formatFileSize(bytesPerSecond)}/s`;
}

/**
 * Truncate a filename while preserving the extension
 */
export function truncateFilename(name: string, maxLength: number = 30): string {
  if (name.length <= maxLength) return name;
  const ext = name.lastIndexOf(".");
  if (ext === -1) return name.slice(0, maxLength - 3) + "...";
  const extension = name.slice(ext);
  const base = name.slice(0, ext);
  const available = maxLength - extension.length - 3;
  if (available <= 0) return name.slice(0, maxLength - 3) + "...";
  return base.slice(0, available) + "..." + extension;
}

/**
 * Get file type category for icon display
 */
export function getFileCategory(
  mimeType: string
): "image" | "video" | "pdf" | "audio" | "archive" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  )
    return "archive";
  if (
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("sheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("text/")
  )
    return "document";
  return "other";
}

/** Alias for formatFileSize */
export const formatBytes = formatFileSize;

/** Format a date as relative time ("in 5 days", "2 hours ago") */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isFuture = diffMs > 0;

  const minutes = Math.floor(absDiffMs / 60000);
  const hours = Math.floor(absDiffMs / 3600000);
  const days = Math.floor(absDiffMs / 86400000);

  let label: string;
  if (days > 0) label = `${days} day${days !== 1 ? "s" : ""}`;
  else if (hours > 0) label = `${hours} hour${hours !== 1 ? "s" : ""}`;
  else label = `${minutes} minute${minutes !== 1 ? "s" : ""}`;

  return isFuture ? `in ${label}` : `${label} ago`;
}
