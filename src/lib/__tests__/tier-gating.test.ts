import { describe, expect, it } from "vitest";
import {
  TIER_LIMITS,
  canCreateStoredTransfer,
  getTierLimits,
  isOwnerEmail,
  OWNER_EMAIL,
} from "@/lib/tier-limits";
import { resolveEntitlementTier } from "@/lib/auth-api";
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

describe("resolveEntitlementTier", () => {
  it("honours a paid plan from the subscription store", () => {
    expect(resolveEntitlementTier("a@b.com", "PRO")).toBe("PRO");
    expect(resolveEntitlementTier("a@b.com", "BUSINESS")).toBe("BUSINESS");
  });

  it("falls back to FREE for an unknown or absent account", () => {
    expect(resolveEntitlementTier("a@b.com", null)).toBe("FREE");
    expect(resolveEntitlementTier("a@b.com", undefined)).toBe("FREE");
    expect(resolveEntitlementTier("a@b.com", "FREE")).toBe("FREE");
  });

  it("ignores a junk tier value rather than trusting it", () => {
    expect(resolveEntitlementTier("a@b.com", "ENTERPRISE")).toBe("FREE");
    expect(resolveEntitlementTier("a@b.com", "pro")).toBe("FREE");
  });

  it("pins the owner by email even when the store says FREE", () => {
    // The two stores disagree until the Firebase migration collapses
    // them; the owner's entitlement must not depend on which one wins.
    expect(resolveEntitlementTier(OWNER_EMAIL, "FREE")).toBe("OWNER");
    expect(resolveEntitlementTier(OWNER_EMAIL, null)).toBe("OWNER");
  });

  it("treats an anonymous caller (no email) as FREE", () => {
    expect(resolveEntitlementTier(null, null)).toBe("FREE");
    expect(resolveEntitlementTier(undefined, "PRO")).toBe("PRO");
  });

  it("decides stored-transfer access consistently with the gate", () => {
    expect(canCreateStoredTransfer(resolveEntitlementTier("a@b.com", "PRO"))).toBe(true);
    expect(canCreateStoredTransfer(resolveEntitlementTier("a@b.com", "FREE"))).toBe(false);
    expect(canCreateStoredTransfer(resolveEntitlementTier(OWNER_EMAIL, "FREE"))).toBe(true);
  });
});
