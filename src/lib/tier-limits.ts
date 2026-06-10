import type { UserTier } from "@/types/enums";

/**
 * Tier-based limits for file transfers.
 * Enforced by the service layer and validated in API routes.
 */

export interface TierLimits {
  maxFileSizeBytes: number;
  /** Max total bytes across all files in a single transfer. */
  maxTransferSizeBytes: number;
  /** Max number of files in a single transfer. */
  maxFilesPerTransfer: number;
  maxTotalStorageBytes: number | null; // null = unlimited for free (no active storage tracking)
  defaultExpiryDays: number;
  maxExpiryDays: number;
  maxDownloadLimit: number | null; // null = unlimited
  defaultDownloadLimit: number;
  dailyTransferLimit: number;
  showAds: boolean;
  uploadRatePerHour: number;
}

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  FREE: {
    maxFileSizeBytes: 4 * 1024 * 1024 * 1024, // 4 GB per file
    maxTransferSizeBytes: 4 * 1024 * 1024 * 1024, // 4 GB total per transfer
    maxFilesPerTransfer: 100,
    maxTotalStorageBytes: null,
    defaultExpiryDays: 7,
    maxExpiryDays: 7,
    maxDownloadLimit: 50,
    defaultDownloadLimit: 50,
    dailyTransferLimit: 10,
    showAds: true,
    uploadRatePerHour: 10,
  },
  PRO: {
    maxFileSizeBytes: 10 * 1024 * 1024 * 1024, // 10 GB per file
    maxTransferSizeBytes: 50 * 1024 * 1024 * 1024, // 50 GB total per transfer
    maxFilesPerTransfer: 500,
    maxTotalStorageBytes: 50 * 1024 * 1024 * 1024,
    defaultExpiryDays: 14,
    maxExpiryDays: 30,
    maxDownloadLimit: 250,
    defaultDownloadLimit: 250,
    dailyTransferLimit: 100,
    showAds: false,
    uploadRatePerHour: 50,
  },
  BUSINESS: {
    maxFileSizeBytes: 50 * 1024 * 1024 * 1024, // 50 GB per file
    maxTransferSizeBytes: 200 * 1024 * 1024 * 1024, // 200 GB total per transfer
    maxFilesPerTransfer: 1000,
    maxTotalStorageBytes: 200 * 1024 * 1024 * 1024,
    defaultExpiryDays: 30,
    maxExpiryDays: 60,
    maxDownloadLimit: null, // unlimited
    defaultDownloadLimit: 10000, // effectively unlimited
    dailyTransferLimit: 500,
    showAds: false,
    uploadRatePerHour: 50,
  },
  // Owner-only tier: no practical limits. Reserved for the app owner.
  OWNER: {
    maxFileSizeBytes: Number.MAX_SAFE_INTEGER,
    maxTransferSizeBytes: Number.MAX_SAFE_INTEGER,
    maxFilesPerTransfer: Number.MAX_SAFE_INTEGER,
    maxTotalStorageBytes: null,
    defaultExpiryDays: 30,
    maxExpiryDays: Number.MAX_SAFE_INTEGER,
    maxDownloadLimit: null,
    defaultDownloadLimit: 10000,
    dailyTransferLimit: Number.MAX_SAFE_INTEGER,
    showAds: false,
    uploadRatePerHour: Number.MAX_SAFE_INTEGER,
  },
};

/** App owner email — always resolves to the OWNER tier, bypassing all limits. */
export const OWNER_EMAIL = "joseph.hamawi.ng@gmail.com";

/** True if the given email is the app owner. */
export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

/**
 * Get tier limits for a given user tier.
 */
export function getTierLimits(tier: UserTier): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Check if a file size is within the tier limit.
 */
export function isFileSizeAllowed(sizeBytes: number, tier: UserTier): boolean {
  return sizeBytes <= TIER_LIMITS[tier].maxFileSizeBytes;
}

/**
 * Pricing in Naira (kobo = smallest unit).
 */
export const PRICING = {
  PRO: {
    amountKobo: 200_000, // NGN 2,000
    amountDisplay: "₦2,000",
    interval: "monthly" as const,
  },
  BUSINESS: {
    amountKobo: 1_000_000, // NGN 10,000
    amountDisplay: "₦10,000",
    interval: "monthly" as const,
  },
} as const;
