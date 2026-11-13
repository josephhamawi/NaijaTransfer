/**
 * Egress budget enforcement.
 *
 * ── Why this file exists ──────────────────────────────────────────────
 * On the Hetzner VM, bandwidth was free: the CPX22 included 20 TB/month
 * for a flat €7.50. On Google Cloud Storage it is the single largest
 * variable cost in the product at roughly $0.12 per GB downloaded, and
 * nothing in the app used to count it.
 *
 * Without a counter, one abuser on the free tier can mint an unbounded
 * bill: 4 GB per transfer × 10 transfers/day × 50 downloads each is
 * 2 TB/day, which is about $240/day. That is the risk this file closes.
 *
 * ── Policy ───────────────────────────────────────────────────────────
 * Two independent limits, both monthly:
 *
 *   1. A platform-wide ceiling on UNPAID traffic (free tier + anonymous
 *      links). When it is hit, those downloads return 503 and paying
 *      customers keep working. Default 50 GB ≈ $6/month — deliberately
 *      set below the €7.50 VM this migration retires, so the free tier
 *      can never cost more than the server it replaced.
 *
 *   2. A per-user allowance for paid tiers, from TIER_LIMITS. A paying
 *      customer is never blocked by the free-tier ceiling, only by
 *      their own allowance.
 *
 * Cost only grows when revenue does, which is the whole requirement.
 *
 * ── Accounting accuracy ──────────────────────────────────────────────
 * Bytes are recorded when a signed URL is minted or a zip starts, not
 * when the transfer finishes. An abandoned download therefore counts
 * against the budget even though GCS never billed for it. That bias is
 * intentional: over-counting fails closed (small, safe) while
 * under-counting fails open (unbounded bill).
 */

import { collection, getDb } from "@/lib/firebase-admin";
import { getTierLimits } from "@/lib/tier-limits";
import type { UserTier } from "@/types/enums";

const GB = 1024 * 1024 * 1024;

/** GCS internet egress, USD per GB. Used only for reporting. */
export const EGRESS_USD_PER_GB = 0.12;

/** Default platform ceiling on unpaid egress, in GB. ~$6/month. */
const DEFAULT_FREE_POOL_GB = 50;

/**
 * Counter reads sit on the hot path of every download, so each instance
 * caches the current month's totals briefly. A 60s window means the
 * ceiling can be overshot by at most one minute of traffic — bounded,
 * and far cheaper than a Firestore read per download.
 */
const CACHE_TTL_MS = 60_000;

type Totals = { bytes: number; at: number };

let globalCache: Totals | null = null;
const userCache = new Map<string, Totals>();

/** Current month key, e.g. "2026-11". Buckets are calendar months. */
function monthKey(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function freePoolBytes(): number {
  const configured = Number(process.env.EGRESS_BUDGET_GB_MONTH);
  const gb = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_FREE_POOL_GB;
  return gb * GB;
}

function globalDoc(month = monthKey()) {
  return collection("counters").doc(`egress_${month}`);
}

function userDoc(uid: string, month = monthKey()) {
  return collection("users").doc(uid).collection("usage").doc(`egress_${month}`);
}

async function readGlobalBytes(): Promise<number> {
  const now = Date.now();
  if (globalCache && now - globalCache.at < CACHE_TTL_MS) return globalCache.bytes;

  let bytes = 0;
  try {
    const snap = await globalDoc().get();
    bytes = Number(snap.data()?.unpaidBytes ?? 0);
  } catch (err) {
    // A counter read failure must not take downloads offline. Fail open
    // on the read and let the next tick re-check; the write path still
    // records bytes, so the overshoot is a cache window, not a month.
    console.error("egress: global counter read failed", err);
    bytes = globalCache?.bytes ?? 0;
  }

  globalCache = { bytes, at: now };
  return bytes;
}

async function readUserBytes(uid: string): Promise<number> {
  const now = Date.now();
  const hit = userCache.get(uid);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.bytes;

  let bytes = 0;
  try {
    const snap = await userDoc(uid).get();
    bytes = Number(snap.data()?.bytes ?? 0);
  } catch (err) {
    console.error("egress: user counter read failed", err);
    bytes = hit?.bytes ?? 0;
  }

  userCache.set(uid, { bytes, at: now });
  return bytes;
}

export interface EgressDecision {
  allowed: boolean;
  /** Machine-readable reason when blocked. */
  reason?: "FREE_POOL_EXHAUSTED" | "TIER_ALLOWANCE_EXHAUSTED";
  /** Human-facing message, safe to return in an API response. */
  message?: string;
  usedBytes: number;
  limitBytes: number;
}

/**
 * Decide whether `sizeBytes` may be served for a transfer owned by
 * `userId` on `tier`.
 *
 * Paid tiers are checked against their own allowance only. Free and
 * anonymous traffic is checked against the shared platform pool. OWNER
 * is never limited.
 */
export async function checkEgressAllowed(
  tier: UserTier,
  userId: string | null,
  sizeBytes: number
): Promise<EgressDecision> {
  if (tier === "OWNER") {
    return { allowed: true, usedBytes: 0, limitBytes: Number.MAX_SAFE_INTEGER };
  }

  const paid = tier === "PRO" || tier === "BUSINESS";

  if (paid && userId) {
    const limitGb = getTierLimits(tier).monthlyEgressGb;
    const limitBytes = limitGb === null ? Number.MAX_SAFE_INTEGER : limitGb * GB;
    const usedBytes = await readUserBytes(userId);

    if (usedBytes + sizeBytes > limitBytes) {
      return {
        allowed: false,
        reason: "TIER_ALLOWANCE_EXHAUSTED",
        message: `This account has used its ${limitGb} GB monthly download allowance. It resets at the start of next month.`,
        usedBytes,
        limitBytes,
      };
    }
    return { allowed: true, usedBytes, limitBytes };
  }

  // Free tier and anonymous links share one platform-wide pool.
  const limitBytes = freePoolBytes();
  const usedBytes = await readGlobalBytes();

  if (usedBytes + sizeBytes > limitBytes) {
    return {
      allowed: false,
      reason: "FREE_POOL_EXHAUSTED",
      message:
        "Free downloads have hit this month's bandwidth limit. Upgrade to keep sending, or try again next month.",
      usedBytes,
      limitBytes,
    };
  }
  return { allowed: true, usedBytes, limitBytes };
}

/**
 * Record `sizeBytes` of egress. Fire-and-forget: never let accounting
 * failure break a download the budget already approved.
 *
 * Unpaid bytes land in `unpaidBytes` (what the pool ceiling checks) and
 * every byte lands in `totalBytes` (what the cost report reads), so the
 * two questions — "am I over budget" and "what will Google charge me" —
 * are answered by one doc.
 */
export async function recordEgress(
  tier: UserTier,
  userId: string | null,
  sizeBytes: number
): Promise<void> {
  if (sizeBytes <= 0) return;

  const paid = tier === "PRO" || tier === "BUSINESS" || tier === "OWNER";

  try {
    const { FieldValue } = await import("firebase-admin/firestore");
    const writes: Promise<unknown>[] = [
      globalDoc().set(
        {
          totalBytes: FieldValue.increment(sizeBytes),
          unpaidBytes: FieldValue.increment(paid ? 0 : sizeBytes),
          [`byTier.${tier}`]: FieldValue.increment(sizeBytes),
          updatedAt: new Date(),
        },
        { merge: true }
      ),
    ];

    if (userId) {
      writes.push(
        userDoc(userId).set(
          { bytes: FieldValue.increment(sizeBytes), updatedAt: new Date() },
          { merge: true }
        )
      );
    }

    await Promise.all(writes);

    // Keep the in-process view roughly current so a burst of downloads
    // inside one cache window still trips the ceiling.
    if (!paid && globalCache) globalCache.bytes += sizeBytes;
    if (userId) {
      const hit = userCache.get(userId);
      if (hit) hit.bytes += sizeBytes;
    }
  } catch (err) {
    console.error("egress: failed to record", err);
  }
}

/** Current month's usage and its dollar cost. Used by the cost report. */
export async function getEgressReport(month = monthKey()): Promise<{
  month: string;
  totalGb: number;
  unpaidGb: number;
  estimatedUsd: number;
  freePoolGb: number;
  byTier: Record<string, number>;
}> {
  const snap = await getDb().doc(`counters/egress_${month}`).get();
  const data = snap.data() ?? {};
  const totalBytes = Number(data.totalBytes ?? 0);
  const unpaidBytes = Number(data.unpaidBytes ?? 0);
  const byTierRaw = (data.byTier ?? {}) as Record<string, number>;

  return {
    month,
    totalGb: totalBytes / GB,
    unpaidGb: unpaidBytes / GB,
    estimatedUsd: (totalBytes / GB) * EGRESS_USD_PER_GB,
    freePoolGb: freePoolBytes() / GB,
    byTier: Object.fromEntries(
      Object.entries(byTierRaw).map(([k, v]) => [k, Number(v) / GB])
    ),
  };
}
