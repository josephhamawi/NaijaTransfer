import { z } from "zod";

/**
 * Server-side environment variable validation.
 * This schema is validated at startup to ensure all required
 * environment variables are present and correctly typed.
 */
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // Paystack
  PAYSTACK_SECRET_KEY: z.string().min(1),
  PAYSTACK_PUBLIC_KEY: z.string().min(1),
  PAYSTACK_WEBHOOK_SECRET: z.string().min(1),
  PAYSTACK_PRO_PLAN_CODE: z.string().min(1),
  PAYSTACK_BUSINESS_PLAN_CODE: z.string().min(1),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_BACKUP_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().min(1),

  // Brevo (Email)
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string().min(1),

  // Termii (Phone OTP)
  TERMII_API_KEY: z.string().min(1),
  TERMII_SENDER_ID: z.string().min(1),

  // Application
  CRON_SECRET: z.string().min(8),
  STORAGE_THRESHOLD_PERCENT: z.coerce.number().int().min(50).max(100).default(85),
  MAX_CONCURRENT_UPLOADS: z.coerce.number().int().min(1).max(100).default(10),
  TUS_UPLOAD_DIR: z.string().min(1),
  APP_URL: z.string().url(),

  // Analytics (optional)
  UMAMI_URL: z.string().optional().default(""),
  UMAMI_WEBSITE_ID: z.string().optional().default(""),

  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

/**
 * Client-side environment variables (exposed to the browser via NEXT_PUBLIC_ prefix).
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_UMAMI_URL: z.string().optional(),
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate server environment variables.
 * Call this at application startup (not in client-side code).
 */
export function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid server environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment variables. Check the console for details.");
  }

  return parsed.data;
}

/**
 * Get a validated server env variable.
 * For use in server-side code only.
 */
export function getServerEnv(): ServerEnv {
  // In development, validate on each call for hot-reload support.
  // In production, this could be cached at startup.
  return serverEnvSchema.parse(process.env);
}

/**
 * Safely access env vars without full validation.
 * Useful during build time when not all vars may be available.
 */
export function env(key: string): string {
  return process.env[key] ?? "";
}
