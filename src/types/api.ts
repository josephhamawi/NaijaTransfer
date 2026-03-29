/**
 * API response types following the consistent envelope pattern.
 */

/**
 * Success response envelope.
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    timing?: { durationMs: number };
  };
}

/**
 * Error response envelope.
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Pagination metadata.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Standard error codes used across the API.
 */
export const ERROR_CODES = {
  // 400
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",

  // 401
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  INVALID_API_KEY: "INVALID_API_KEY",

  // 403
  FORBIDDEN: "FORBIDDEN",
  RATE_LIMITED: "RATE_LIMITED",
  TIER_LIMIT_EXCEEDED: "TIER_LIMIT_EXCEEDED",
  DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED",

  // 404
  NOT_FOUND: "NOT_FOUND",
  TRANSFER_NOT_FOUND: "TRANSFER_NOT_FOUND",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",

  // 409
  TRANSFER_EXPIRED: "TRANSFER_EXPIRED",
  DOWNLOAD_LIMIT_REACHED: "DOWNLOAD_LIMIT_REACHED",
  PASSWORD_REQUIRED: "PASSWORD_REQUIRED",
  INVALID_PASSWORD: "INVALID_PASSWORD",

  // 429
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // 507
  STORAGE_FULL: "STORAGE_FULL",

  // 500
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
