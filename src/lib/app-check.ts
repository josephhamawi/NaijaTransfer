/**
 * Firebase App Check verification.
 *
 * Live Send's room-creation endpoint is reachable by anyone, including
 * anonymous senders, so the per-uid and per-IP quotas are not the only
 * control worth having. App Check adds attestation that the caller is
 * the real web app rather than a script.
 *
 * Two modes, by design:
 *
 *   • soft (default) — a missing or bad token is logged as a counter and
 *     the request proceeds. This is what makes the feature deployable
 *     before App Check is registered in the Firebase console, and what
 *     stops a reCAPTCHA outage from taking the product down.
 *
 *   • enforced — set `FIREBASE_APPCHECK_ENFORCE=true` once the console
 *     side is configured and traffic looks clean. Then a bad token is a
 *     403.
 *
 * Tokens are never logged. Only the outcome is.
 */

import type { NextRequest } from "next/server";

export type AppCheckOutcome = "valid" | "missing" | "invalid" | "unavailable";

export interface AppCheckResult {
  outcome: AppCheckOutcome;
  /** True when the request must be refused. */
  blocked: boolean;
}

export function appCheckEnforced(): boolean {
  return process.env.FIREBASE_APPCHECK_ENFORCE === "true";
}

export async function verifyAppCheck(request: NextRequest): Promise<AppCheckResult> {
  const token = request.headers.get("x-firebase-appcheck");
  const enforce = appCheckEnforced();

  if (!token) {
    return { outcome: "missing", blocked: enforce };
  }

  try {
    const { getAppCheck } = await import("firebase-admin/app-check");
    const { ensureInitialized } = await import("@/lib/firebase-admin");
    ensureInitialized();
    await getAppCheck().verifyToken(token);
    return { outcome: "valid", blocked: false };
  } catch {
    // Any failure here — a forged token, an unregistered app, a
    // reCAPTCHA outage — is indistinguishable from the outside, so it
    // gets one outcome. Soft mode lets it through; enforced mode does
    // not. Nothing about the token is logged.
    return { outcome: "invalid", blocked: enforce };
  }
}
