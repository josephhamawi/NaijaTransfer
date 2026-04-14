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
};

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
