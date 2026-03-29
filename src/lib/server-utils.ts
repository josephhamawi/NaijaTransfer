import crypto from "crypto";

/**
 * Server-side utility functions.
 * These require Node.js APIs and cannot run in the browser.
 */

/**
 * Sanitize a filename to prevent path traversal and ensure URL safety.
 * Only allows: alphanumeric, hyphens, underscores, dots.
 * Strips path separators and ".." sequences.
 * Truncates to 255 characters.
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename.replace(/[/\\:\x00]/g, "");

  // Remove ".." sequences
  sanitized = sanitized.replace(/\.\./g, "");

  // Replace any non-allowed characters with underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, "");

  // Ensure the filename is not empty
  if (!sanitized || sanitized === "") {
    sanitized = "unnamed_file";
  }

  // Truncate to 255 characters
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop() || "";
    const name = sanitized.slice(0, 255 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }

  return sanitized;
}

/**
 * Hash an IP address using SHA-256 for NDPA-compliant logging.
 * No raw IPs are stored in the database.
 */
export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

/**
 * Hash an API key using SHA-256 for secure storage.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Create a consistent API response envelope (success).
 */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return { data, ...(meta && { meta }) };
}

/**
 * Create a consistent API error response.
 */
export function apiError(code: string, message: string, details?: unknown) {
  const error: { code: string; message: string; details?: unknown } = { code, message };
  if (details) error.details = details;
  return { error };
}

/**
 * Sleep utility for retry logic.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
