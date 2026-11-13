import { getAuth } from "firebase-admin/auth";
import { ensureInitialized } from "./firebase-admin";
import { isOwnerEmail } from "./tier-limits";
import { getUser, upsertUserFromAuth, type UserDoc } from "@/services/user.service";
import type { NextRequest } from "next/server";
import type { UserTier } from "@/types/enums";

/**
 * Request authentication, backed entirely by Firestore.
 *
 * Before the migration this module read Postgres through Prisma while
 * transfers and uploads were already keyed by Firebase uid, so the same
 * person had two identities and two plan values. Everything here now
 * resolves to one record: `users/{uid}`.
 */

/**
 * Verify the Firebase ID token and return the caller's user document.
 *
 * Creates the document when a verified, email-bearing token arrives
 * without one — that is the first-sign-in path, and it keeps a user
 * from being locked out if `/api/auth/sync` has not run yet.
 * Anonymous tokens (no email) never get a user document: they are for
 * Live Send, which needs no account.
 */
export async function getAuthUser(request: NextRequest): Promise<UserDoc | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    ensureInitialized();
    const decoded = await getAuth().verifyIdToken(authHeader.slice(7));
    if (!decoded.email) return null;

    const existing = await getUser(decoded.uid);
    if (existing) return existing;

    const { user } = await upsertUserFromAuth(decoded.uid, {
      email: decoded.email,
      name: decoded.name ?? null,
      image: decoded.picture ?? null,
      tier: isOwnerEmail(decoded.email) ? "OWNER" : "FREE",
    });
    return user;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

/**
 * Verify the ID token and return the Firebase uid only.
 *
 * Use for anything keyed purely by identity — Live Send rooms, transfer
 * ownership — where no user document is required and an anonymous
 * caller is acceptable.
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
 * Pure, and the single place the rule lives, so the four endpoints that
 * gate cloud storage cannot drift apart. `accountTier` comes from the
 * user record that the Paystack webhook writes; an unrecognised value
 * falls back to FREE rather than being trusted.
 *
 * The owner is pinned by email rather than by stored tier, so the
 * entitlement survives a record being stale or missing.
 */
export function resolveEntitlementTier(
  email: string | null | undefined,
  accountTier: string | null | undefined
): UserTier {
  if (isOwnerEmail(email)) return "OWNER";
  if (accountTier === "PRO" || accountTier === "BUSINESS" || accountTier === "OWNER") {
    return accountTier;
  }
  return "FREE";
}

export interface AuthContext {
  /** Firebase uid — the only user key in the system. */
  uid: string;
  email: string | null;
  /** Plan entitlement, resolved from the user record. */
  tier: UserTier;
  /** Null for an anonymous caller. */
  user: UserDoc | null;
}

/**
 * Verify the ID token once and return identity and plan together.
 *
 * Read-only: a plan check must never create an account as a side
 * effect. Anonymous callers resolve to FREE — fine for Live Send,
 * never enough for stored storage.
 */
export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    ensureInitialized();
    const decoded = await getAuth().verifyIdToken(authHeader.slice(7));
    const email = decoded.email ?? null;

    const user = email ? await getUser(decoded.uid) : null;

    return {
      uid: decoded.uid,
      email,
      tier: resolveEntitlementTier(email, user?.tier),
      user,
    };
  } catch (error) {
    console.error("Auth context error:", error);
    return null;
  }
}
