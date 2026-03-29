import type { User } from "@prisma/client";
import type { UserTier } from "@/types/enums";

/**
 * Session user data (stored in JWT).
 */
export interface SessionUser {
  userId: string;
  email: string | null;
  name: string | null;
  tier: UserTier;
}

/**
 * Public user profile data (safe to expose).
 */
export interface PublicUserProfile {
  id: string;
  name: string | null;
  email: string | null;
  tier: UserTier;
  storageUsedBytes: string; // BigInt as string
  createdAt: string;
}

/**
 * User storage info.
 */
export interface UserStorageInfo {
  usedBytes: string;
  tierLimitBytes: string | null; // null = no limit
  usedPercent: number;
  tier: UserTier;
}

/**
 * User subscription info.
 */
export interface UserSubscriptionInfo {
  tier: UserTier;
  active: boolean;
  planStartDate: string | null;
  planEndDate: string | null;
  paystackSubCode: string | null;
}
