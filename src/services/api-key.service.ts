/**
 * API keys in Firestore.
 *
 * The document id IS the SHA-256 of the key, which makes validation a
 * single `get` on every authenticated API request — no query, no index,
 * no scan. The raw key is never stored, so a dump of Firestore yields
 * nothing usable.
 *
 * A separate random `publicId` is what the dashboard and the API
 * responses expose. The old implementation returned the Prisma row id;
 * here the row id is the hash, and handing that out would leak the
 * verifier for the key.
 */

import { getDb } from "@/lib/firebase-admin";
import { generateApiKey } from "@/lib/nanoid";
import { hashApiKey } from "@/lib/server-utils";
import type { UserTier } from "@/types/enums";

export const API_KEYS = "apiKeys";

export interface ApiKeyDoc {
  /** Random, safe to display. Not the hash. */
  publicId: string;
  uid: string;
  keyPrefix: string;
  name: string;
  tier: UserTier;
  rateLimit: number;
  lastUsedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

type Db = ReturnType<typeof getDb>;

function db(injected?: unknown): Db {
  return (injected as Db) ?? getDb();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const maybe = value as { toDate?: () => Date };
  return typeof maybe.toDate === "function" ? maybe.toDate() : new Date(String(value));
}

function docToKey(data: Record<string, unknown>): ApiKeyDoc {
  return {
    publicId: String(data.publicId ?? ""),
    uid: String(data.uid ?? ""),
    keyPrefix: String(data.keyPrefix ?? ""),
    name: String(data.name ?? ""),
    tier: ((data.tier as UserTier) || "FREE") as UserTier,
    rateLimit: Number(data.rateLimit ?? 100),
    lastUsedAt: toDate(data.lastUsedAt),
    isActive: data.isActive !== false,
    createdAt: toDate(data.createdAt) ?? new Date(0),
  };
}

export async function createApiKey(
  uid: string,
  name: string,
  tier: UserTier = "FREE",
  injected?: unknown
): Promise<{ key: string; record: ApiKeyDoc }> {
  const { key, prefix } = await generateApiKey();
  const { nanoid } = await import("nanoid");

  const record: ApiKeyDoc = {
    publicId: nanoid(12),
    uid,
    keyPrefix: prefix,
    name,
    tier,
    rateLimit: 100,
    lastUsedAt: null,
    isActive: true,
    createdAt: new Date(),
  };

  await db(injected).collection(API_KEYS).doc(hashApiKey(key)).set(record);
  return { key, record };
}

/**
 * Validate a presented key.
 *
 * `lastUsedAt` is updated without awaiting: it is telemetry, and making
 * every authenticated API call wait on a write to record that it
 * happened would add a round trip to the hot path for no benefit.
 */
export async function validateApiKey(
  key: string,
  injected?: unknown
): Promise<ApiKeyDoc | null> {
  const ref = db(injected).collection(API_KEYS).doc(hashApiKey(key));
  const snap = await ref.get();
  if (!snap.exists) return null;

  const record = docToKey(snap.data() ?? {});
  if (!record.isActive) return null;

  void ref.update({ lastUsedAt: new Date() }).catch(() => {
    /* telemetry only */
  });

  return record;
}

export async function listUserApiKeys(
  uid: string,
  injected?: unknown
): Promise<ApiKeyDoc[]> {
  const snap = await db(injected)
    .collection(API_KEYS)
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => docToKey(d.data() ?? {}));
}

/** Revoke by the public id. Returns false when the key is not this user's. */
export async function revokeApiKey(
  publicId: string,
  uid: string,
  injected?: unknown
): Promise<boolean> {
  const snap = await db(injected)
    .collection(API_KEYS)
    .where("publicId", "==", publicId)
    .limit(1)
    .get();

  if (snap.empty) return false;
  const doc = snap.docs[0];
  if (doc.data()?.uid !== uid) return false;

  await doc.ref.update({ isActive: false });
  return true;
}
