/**
 * Zod validation schemas for API input validation.
 * All API routes validate request bodies/queries using these schemas.
 */

import { z } from "zod";

/**
 * File metadata for upload creation.
 */
export const fileMetadataSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().positive(),
  type: z.string().min(1).max(255),
});

/**
 * Transfer settings for upload creation.
 */
export const transferSettingsSchema = z.object({
  type: z.enum(["LINK", "EMAIL"]).default("LINK"),
  title: z.string().max(200).optional(),
  message: z.string().max(500).optional(),
  senderEmail: z.string().email().optional(),
  recipientEmails: z
    .array(z.string().email())
    .max(10, "Maximum 10 recipients")
    .optional(),
  password: z.string().min(4).max(128).optional(),
  expiryDays: z.number().int().min(1).max(60).optional(),
  downloadLimit: z.number().int().min(1).max(10000).optional(),
});

/**
 * Create transfer request.
 */
export const createTransferSchema = z.object({
  files: z.array(fileMetadataSchema).min(1).max(100),
  settings: transferSettingsSchema.optional(),
});

/**
 * Password verification request.
 */
export const verifyPasswordSchema = z.object({
  password: z.string().min(1).max(128),
});

/**
 * File request creation.
 */
export const createFileRequestSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().max(500).optional(),
  maxUploads: z.number().int().min(1).max(1000).optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * API key creation.
 */
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

/**
 * Pagination query parameters.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Transfer update (patch).
 */
export const updateTransferSchema = z.object({
  expiryDays: z.number().int().min(1).max(60).optional(),
  downloadLimit: z.number().int().min(1).max(10000).optional(),
  password: z.string().min(4).max(128).optional().nullable(),
});

/**
 * Email validation for notifications.
 */
export const emailListSchema = z
  .array(z.string().email())
  .min(1, "At least one email required")
  .max(10, "Maximum 10 emails");

/**
 * Phone number validation (Nigerian format).
 */
export const nigerianPhoneSchema = z
  .string()
  .regex(/^\+234[0-9]{10}$/, "Must be a valid Nigerian phone number (+234XXXXXXXXXX)");
