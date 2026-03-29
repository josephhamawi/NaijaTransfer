/**
 * tus server configuration for resumable chunked uploads.
 * Uses @tus/server with local filesystem store for chunks.
 * Chunks are assembled and transferred to R2 on completion.
 * Full implementation in Epic 2: Core Transfer Engine.
 */

/**
 * tus upload configuration constants.
 */
export const TUS_CONFIG = {
  /** Chunk size in bytes (5MB) */
  CHUNK_SIZE: 5 * 1024 * 1024,

  /** Maximum file size per tier in bytes */
  MAX_FILE_SIZE: {
    FREE: 4 * 1024 * 1024 * 1024, // 4 GB
    PRO: 10 * 1024 * 1024 * 1024, // 10 GB
    BUSINESS: 50 * 1024 * 1024 * 1024, // 50 GB
  },

  /** Upload directory for temporary chunks */
  UPLOAD_DIR: process.env.TUS_UPLOAD_DIR || "/tmp/uploads",

  /** Maximum age for orphaned chunks before cleanup (24 hours in ms) */
  ORPHAN_MAX_AGE_MS: 24 * 60 * 60 * 1000,

  /** Path prefix for tus endpoints */
  PATH_PREFIX: "/api/upload/files",
} as const;
