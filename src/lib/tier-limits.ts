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
  /**
   * Monthly download (egress) allowance in GB, per user. null = unlimited.
   *
   * This is a COST limit, not a product limit. Google Cloud Storage bills
   * ~$0.12 per GB downloaded, so this number times $0.12 is the most one
   * account can cost per month. Free and anonymous traffic ignores this
   * and shares one platform-wide pool instead (see src/lib/egress.ts).
   *
   * Break-even, for reference — net of Paystack fees (1.5%, ₦100 waived
   * under ₦2,500) at roughly ₦1,550/USD:
   *   PRO      ₦2,000/mo  → net ₦1,970  ≈ $1.27  → 10.5 GB at cost
   *   BUSINESS ₦10,000/mo → net ₦9,750  ≈ $6.29  → 52 GB at cost
   *
   * The values below are deliberately ABOVE break-even because the
   * alternative — a 10 GB monthly cap on a plan that advertises 50 GB
   * transfers — is not a sellable product. That gap is a pricing
   * problem, not a code problem. See docs/firebase-migration-plan.md.
   */
  monthlyEgressGb: number | null;
  /**
   * Whether this tier may create NEW cloud-stored transfers — files
   * uploaded to Firebase Storage now and downloaded later.
   *
   * False on FREE. Free sending happens through Live Send, a direct
   * browser-to-browser WebRTC transfer that never touches our storage
   * or our bandwidth. That is what makes a free tier affordable: a
   * stored transfer costs us storage plus ~$0.12/GB of egress for
   * every download, and the free tier has no revenue to cover it.
   *
   * This flag gates the SERVER, not just the UI — see
   * /api/upload/create. Existing stored transfers keep working until
   * their original expiry regardless of the owner's tier.
   */
  storedTransfers: boolean;
  /** Whether this tier may use Live Send. True everywhere. */
  liveSend: boolean;
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
    // Free users do not have a personal allowance — all unpaid traffic
    // draws on the shared pool capped by EGRESS_BUDGET_GB_MONTH. That
    // pool now only serves downloads of stored transfers created
    // before this tier lost storage, and paid transfers' previews.
    monthlyEgressGb: null,
    storedTransfers: false,
    liveSend: true,
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
    // 100 GB ≈ $12/month of egress against ≈ $1.27 of net revenue.
    // Underwater by design until pricing or storage vendor changes.
    monthlyEgressGb: 100,
    storedTransfers: true,
    liveSend: true,
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
    // 500 GB ≈ $60/month of egress against ≈ $6.29 of net revenue.
    monthlyEgressGb: 500,
    storedTransfers: true,
    liveSend: true,
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
    monthlyEgressGb: null,
    storedTransfers: true,
    liveSend: true,
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
 * Whether this tier may create a new cloud-stored transfer.
 *
 * The single source of truth for the paid/free split. Called by
 * /api/upload/create, /api/upload/file/batch-init, the public API and
 * the file-request endpoints so the rule cannot drift between them.
 */
export function canCreateStoredTransfer(tier: UserTier): boolean {
  return TIER_LIMITS[tier].storedTransfers;
}

/** Copy for the "this needs a paid plan" response and empty states. */
export const STORED_TRANSFER_UPGRADE_MESSAGE =
  "Stored transfers are part of Pro and Business. On the free plan, use Live Send to send files directly to someone while you are both online.";

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
