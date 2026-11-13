import { getAuth } from "firebase-admin/auth";
import { db } from "./db";
import { ensureInitialized } from "./firebase-admin";
import { isOwnerEmail } from "./tier-limits";
import type { NextRequest } from "next/server";
import type { User } from "@prisma/client";
import type { UserTier } from "@/types/enums";

/**
 * Verify Firebase ID token from Authorization header and return Prisma user.
 * Creates user in Prisma if they don't exist yet (bridges Firebase Auth → Prisma).
 */
export async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    ensureInitialized();
    const decoded = await getAuth().verifyIdToken(token);

    if (!decoded.email) return null;

    // Find or create user in Prisma by email
    const user = await db.user.upsert({
      where: { email: decoded.email },
      update: {},
      create: {
        email: decoded.email,
        name: decoded.name || decoded.email.split("@")[0],
        image: decoded.picture || null,
      },
    });

    return user;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

/**
 * Verify the Firebase ID token and return the Firebase uid only.
 *
 * Use this for routes backed by Firestore (e.g. transfers), where records are
 * keyed by the Firebase uid set at upload time — NOT the Prisma cuid that
 * getAuthUser() returns. Mixing the two yields empty results.
 */
export async function getAuthUid(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    ensureInitialized();
    const decoded = await getAuth().verifyIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

/**
 * Decide which plan a caller is entitled to.
 *
 * Split out as a pure function because the answer decides whether cloud
 * storage is allowed at all, and getting it wrong in either direction
 * is expensive: too strict blocks a paying customer, too loose gives
 * away storage.
 *
 * `accountTier` must come from the store the Paystack webhook writes.
 * Today that is Postgres — see /api/webhooks/paystack. Firestore's
 * `users/{uid}.tier` is NOT a substitute: /api/auth/sync only ever
 * writes FREE or OWNER there, so a subscriber looks free in Firestore.
 * Phase 2 of the Firebase migration collapses the two stores; until
 * then this function is the single place that knows which one is
 * authoritative.
 */
export function resolveEntitlementTier(
  email: string | null | undefined,
  accountTier: string | null | undefined
): UserTier {
  // The owner is pinned by email so the entitlement survives any store
  // being out of sync.
  if (isOwnerEmail(email)) return "OWNER";
  if (accountTier === "PRO" || accountTier === "BUSINESS" || accountTier === "OWNER") {
    return accountTier;
  }
  return "FREE";
}

export interface AuthContext {
  /** Firebase uid — the identity transfers and Live Send rooms are keyed by. */
  uid: string;
  email: string | null;
  /** Plan entitlement, resolved from the subscription store of record. */
  tier: UserTier;
}

/**
 * Verify the caller's ID token once and return both their uid and their
 * real plan.
 *
 * Callers used to need getAuthUid() for identity and a separate lookup
 * for tier, which meant verifying the token twice and risked the two
 * disagreeing. Anonymous users resolve to FREE: an anonymous session is
 * fine for Live Send, never for stored storage.
 */
export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    ensureInitialized();
    const decoded = await getAuth().verifyIdToken(authHeader.slice(7));
    const email = decoded.email ?? null;

    // Read-only: a plan check must not create an account as a side
    // effect. Anonymous callers have no email and stay FREE.
    let accountTier: string | null = null;
    if (email) {
      const account = await db.user.findUnique({
        where: { email },
        select: { tier: true },
      });
      accountTier = account?.tier ?? null;
    }

    return { uid: decoded.uid, email, tier: resolveEntitlementTier(email, accountTier) };
  } catch (error) {
    console.error("Auth context error:", error);
    return null;
  }
}
