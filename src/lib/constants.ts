/**
 * Application-wide constants.
 */

export const APP_NAME = "NigeriaTransfer";
export const APP_TAGLINE = "Send large files. No account. No wahala.";
export const APP_DOMAIN = "nigeriatransfer.com";

/**
 * Nigerian brand color palette.
 */
export const COLORS = {
  NIGERIAN_GREEN: "#008751",
  GREEN_LIGHT: "#00a86b",
  GREEN_DARK: "#006b3f",
  GOLD: "#d4a843",
  WHITE: "#ffffff",
} as const;

/**
 * File transfer constants.
 */
export const TRANSFER = {
  /** Short code length for transfer URLs */
  SHORT_CODE_LENGTH: 10,

  /** Maximum number of email recipients per transfer */
  MAX_RECIPIENTS: 10,

  /** Maximum message length */
  MAX_MESSAGE_LENGTH: 500,

  /** Maximum title length */
  MAX_TITLE_LENGTH: 200,

  /** Maximum number of files per transfer */
  MAX_FILES_PER_TRANSFER: 100,

  /** tus chunk size in bytes (5MB) */
  CHUNK_SIZE_BYTES: 5 * 1024 * 1024,

  /** Maximum concurrent file uploads per user */
  MAX_CONCURRENT_UPLOADS_PER_USER: 2,

  /** Presigned URL expiry in seconds */
  PRESIGNED_URL_EXPIRY_SECONDS: 300, // 5 minutes

  /** Download notification debounce (max 1 per hour per transfer) */
  DOWNLOAD_NOTIFICATION_DEBOUNCE_MS: 60 * 60 * 1000,
} as const;

/**
 * Rate limiting constants.
 */
export const RATE_LIMITS = {
  /** Upload creation: anonymous */
  UPLOAD_CREATE_ANON_PER_HOUR: 10,

  /** Upload creation: authenticated */
  UPLOAD_CREATE_AUTH_PER_HOUR: 50,

  /** Downloads per IP per hour */
  DOWNLOADS_PER_IP_PER_HOUR: 100,

  /** Password attempts per transfer per IP per minute */
  PASSWORD_ATTEMPTS_PER_MINUTE: 5,

  /** General API requests per IP per minute */
  GENERAL_PER_IP_PER_MINUTE: 300,
} as const;

/**
 * Storage thresholds.
 */
export const STORAGE = {
  /** Block storage warning threshold */
  WARNING_THRESHOLD_PERCENT: 75,

  /** Block storage rejection threshold */
  CRITICAL_THRESHOLD_PERCENT: 85,

  /** Orphaned chunk max age in hours */
  ORPHAN_MAX_AGE_HOURS: 24,
} as const;

/**
 * Cron schedule constants.
 */
export const CRON = {
  /** Cleanup expired transfers */
  CLEANUP_INTERVAL: "hourly",

  /** Database backup time (WAT) */
  BACKUP_TIME: "03:00",

  /** Expiry warning emails */
  EXPIRY_WARNING_TIME: "06:00",

  /** Storage report */
  STORAGE_REPORT_TIME: "07:00",

  /** Egress report */
  EGRESS_REPORT_TIME: "08:00",
} as const;

/**
 * Supported MIME types for file preview generation.
 */
export const PREVIEWABLE_MIME_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
  PDF: ["application/pdf"],
} as const;
