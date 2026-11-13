import { describe, expect, it } from "vitest";
import {
  TIER_LIMITS,
  canCreateStoredTransfer,
  getTierLimits,
  isOwnerEmail,
  OWNER_EMAIL,
} from "@/lib/tier-limits";
import type { UserTier } from "@/types/enums";

describe("stored-transfer entitlement", () => {
  it("denies the free tier", () => {
    expect(canCreateStoredTransfer("FREE")).toBe(false);
  });

  it("allows every paid tier and the owner", () => {
    for (const tier of ["PRO", "BUSINESS", "OWNER"] as UserTier[]) {
      expect(canCreateStoredTransfer(tier)).toBe(true);
    }
  });

  it("keeps Live Send available to everyone, paid included", () => {
    for (const tier of Object.keys(TIER_LIMITS) as UserTier[]) {
      expect(getTierLimits(tier).liveSend).toBe(true);
    }
  });

  it("reads the flag from the tier table rather than hardcoding tiers", () => {
    // Guards against the gate drifting from the table it documents.
    for (const tier of Object.keys(TIER_LIMITS) as UserTier[]) {
      expect(canCreateStoredTransfer(tier)).toBe(TIER_LIMITS[tier].storedTransfers);
    }
  });
});

describe("owner entitlement", () => {
  it("recognises the owner email regardless of case", () => {
    expect(isOwnerEmail(OWNER_EMAIL)).toBe(true);
    expect(isOwnerEmail(OWNER_EMAIL.toUpperCase())).toBe(true);
  });

  it("does not recognise anyone else", () => {
    expect(isOwnerEmail("someone@else.com")).toBe(false);
    expect(isOwnerEmail(null)).toBe(false);
    expect(isOwnerEmail(undefined)).toBe(false);
    expect(isOwnerEmail("")).toBe(false);
  });

  it("gives the owner stored transfers", () => {
    expect(canCreateStoredTransfer("OWNER")).toBe(true);
  });
});
