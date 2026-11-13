/**
 * Users in Firestore.
 *
 * Replaces the Prisma `users` table. The important change is not the
 * store — it is the key: a user is now identified by their Firebase
 * uid everywhere, instead of a Prisma cuid in Postgres and a uid in
 * Firestore.
 *
 * That split is what made `getAuthUid()` necessary (see its old doc
 * comment: "Mixing the two yields empty results"), and it is why a
 * paying customer could look free to one endpoint and paid to another.
 * One key, one store, one answer.
 *
 * Uniqueness: Firestore has no unique indexes. `username` and `phone`
 * are kept unique by reservation documents written in the same
 * transaction as the user update — `usernames/{lowercased}` and
 * `phones/{digits}` — so two concurrent writers cannot both win.
 */

import { getDb } from "@/lib/firebase-admin";
import type { UserTier } from "@/types/enums";

export const USERS = "users";
export const USERNAMES = "usernames";
export const PHONES = "phones";

export interface UserDoc {
  /** Firebase uid. The only user key in the system. */
  id: string;
  email: string | null;
  emailVerified: Date | null;
  phone: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  hearAboutUs: string | null;
  image: string | null;
  tier: UserTier;
  planStartDate: Date | null;
  planEndDate: Date | null;
  paystackCustomerId: string | null;
  paystackSubCode: string | null;
  storageUsedBytes: number;
  /**
   * The user's old Prisma cuid, kept only so in-flight Paystack
   * subscriptions keep working: their `metadata.userId` was recorded
   * before the migration and still carries the cuid. Safe to drop once
   * every subscription created before the cutover has renewed.
   */
  legacyId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type Db = ReturnType<typeof getDb>;

function db(injected?: unknown): Db {
  return (injected as Db) ?? getDb();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const maybe = value as { toDate?: () => Date };
  if (typeof maybe.toDate === "function") return maybe.toDate();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function docToUser(id: string, data: Record<string, unknown>): UserDoc {
  return {
    id,
    email: (data.email as string) ?? null,
    emailVerified: toDate(data.emailVerified),
    phone: (data.phone as string) ?? null,
    name: (data.name as string) ?? null,
    firstName: (data.firstName as string) ?? null,
    lastName: (data.lastName as string) ?? null,
    username: (data.username as string) ?? null,
    hearAboutUs: (data.hearAboutUs as string) ?? null,
    image: (data.image as string) ?? null,
    tier: ((data.tier as UserTier) || "FREE") as UserTier,
    planStartDate: toDate(data.planStartDate),
    planEndDate: toDate(data.planEndDate),
    paystackCustomerId: (data.paystackCustomerId as string) ?? null,
    paystackSubCode: (data.paystackSubCode as string) ?? null,
    storageUsedBytes: Number(data.storageUsedBytes ?? 0),
    legacyId: (data.legacyId as string) ?? null,
    createdAt: toDate(data.createdAt) ?? new Date(0),
    updatedAt: toDate(data.updatedAt) ?? new Date(0),
  };
}

export async function getUser(uid: string, injected?: unknown): Promise<UserDoc | null> {
  const snap = await db(injected).collection(USERS).doc(uid).get();
  if (!snap.exists) return null;
  return docToUser(snap.id, snap.data() ?? {});
}

export async function getUserByEmail(
  email: string,
  injected?: unknown
): Promise<UserDoc | null> {
  const snap = await db(injected)
    .collection(USERS)
    .where("email", "==", email)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return docToUser(snap.docs[0].id, snap.docs[0].data() ?? {});
}

/**
 * Resolve a user from a Paystack `metadata.userId`.
 *
 * Accepts either a Firebase uid (everything created after the
 * migration) or a legacy Prisma cuid (subscriptions that existed
 * before it). Without the fallback, every pre-migration subscriber's
 * renewal webhook would silently fail to find its user and the
 * subscription would look cancelled.
 */
export async function getUserByAnyId(
  id: string,
  injected?: unknown
): Promise<UserDoc | null> {
  const direct = await getUser(id, injected);
  if (direct) return direct;

  const snap = await db(injected)
    .collection(USERS)
    .where("legacyId", "==", id)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return docToUser(snap.docs[0].id, snap.docs[0].data() ?? {});
}

/** Users holding a given Paystack subscription code. */
export async function getUsersBySubCode(
  subCode: string,
  injected?: unknown
): Promise<UserDoc[]> {
  const snap = await db(injected)
    .collection(USERS)
    .where("paystackSubCode", "==", subCode)
    .get();
  return snap.docs.map((d) => docToUser(d.id, d.data() ?? {}));
}

/**
 * Create the user document if it is missing, otherwise refresh the
 * fields an identity provider owns. Used by /api/auth/sync.
 */
export async function upsertUserFromAuth(
  uid: string,
  data: { email: string; name?: string | null; image?: string | null; tier?: UserTier },
  injected?: unknown
): Promise<{ user: UserDoc; created: boolean }> {
  const ref = db(injected).collection(USERS).doc(uid);
  const snap = await ref.get();
  const now = new Date();

  if (!snap.exists) {
    const created: Record<string, unknown> = {
      email: data.email,
      name: data.name || data.email.split("@")[0],
      image: data.image ?? null,
      tier: data.tier ?? "FREE",
      firstName: null,
      lastName: null,
      username: null,
      phone: null,
      hearAboutUs: null,
      planStartDate: null,
      planEndDate: null,
      paystackCustomerId: null,
      paystackSubCode: null,
      storageUsedBytes: 0,
      legacyId: null,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(created);
    return { user: docToUser(uid, created), created: true };
  }

  const update: Record<string, unknown> = { updatedAt: now };
  if (data.name) update.name = data.name;
  if (data.image) update.image = data.image;
  // Only ever an upgrade to OWNER here; a paid tier is set by the
  // Paystack webhook and must not be clobbered by a sign-in.
  if (data.tier === "OWNER") update.tier = "OWNER";

  await ref.update(update);
  const fresh = await ref.get();
  return { user: docToUser(uid, fresh.data() ?? {}), created: false };
}

export class UserConflictError extends Error {
  constructor(readonly field: "username" | "phone", message: string) {
    super(message);
    this.name = "UserConflictError";
  }
}

function phoneKey(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

export interface ProfileUpdate {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  hearAboutUs?: string | null;
  username?: string | null;
  name?: string | null;
}

/**
 * Update a profile, holding the uniqueness of `username` and `phone`.
 *
 * Everything happens in one transaction: read the reservation
 * documents, assert they are free or already ours, then write the user
 * and the reservations together. Checking first and writing after
 * would let two people claim the same username in the gap.
 */
export async function updateProfile(
  uid: string,
  update: ProfileUpdate,
  injected?: unknown
): Promise<UserDoc> {
  const database = db(injected);
  const userRef = database.collection(USERS).doc(uid);

  return database.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error("USER_NOT_FOUND");
    const current = docToUser(uid, snap.data() ?? {});

    const writes: Array<() => void> = [];
    const patch: Record<string, unknown> = { updatedAt: new Date() };

    if (update.username !== undefined && update.username !== current.username) {
      if (update.username) {
        const key = update.username.toLowerCase();
        const ref = database.collection(USERNAMES).doc(key);
        const held = await tx.get(ref);
        if (held.exists && held.data()?.uid !== uid) {
          throw new UserConflictError("username", "That username is already taken.");
        }
        writes.push(() => tx.set(ref, { uid, username: update.username }));
      }
      if (current.username) {
        const old = database.collection(USERNAMES).doc(current.username.toLowerCase());
        writes.push(() => tx.delete(old));
      }
      patch.username = update.username;
    }

    if (update.phone !== undefined && update.phone !== current.phone) {
      if (update.phone) {
        const key = phoneKey(update.phone);
        const ref = database.collection(PHONES).doc(key);
        const held = await tx.get(ref);
        if (held.exists && held.data()?.uid !== uid) {
          throw new UserConflictError(
            "phone",
            "That phone number is already linked to another account."
          );
        }
        writes.push(() => tx.set(ref, { uid, phone: update.phone }));
      }
      if (current.phone) {
        const old = database.collection(PHONES).doc(phoneKey(current.phone));
        writes.push(() => tx.delete(old));
      }
      patch.phone = update.phone;
    }

    if (update.firstName !== undefined) patch.firstName = update.firstName;
    if (update.lastName !== undefined) patch.lastName = update.lastName;
    if (update.hearAboutUs !== undefined) patch.hearAboutUs = update.hearAboutUs;
    if (update.name !== undefined && update.name) patch.name = update.name;

    for (const write of writes) write();
    tx.update(userRef, patch);

    return docToUser(uid, { ...(snap.data() ?? {}), ...patch });
  });
}

/** True when a username is free. Used by the generator's retry loop. */
export async function isUsernameAvailable(
  username: string,
  injected?: unknown
): Promise<boolean> {
  const snap = await db(injected).collection(USERNAMES).doc(username.toLowerCase()).get();
  return !snap.exists;
}

export interface SubscriptionUpdate {
  tier?: UserTier;
  planStartDate?: Date | null;
  planEndDate?: Date | null;
  paystackCustomerId?: string | null;
  paystackSubCode?: string | null;
}

/** Apply a subscription change. The Paystack webhook's only write path. */
export async function updateSubscription(
  uid: string,
  update: SubscriptionUpdate,
  injected?: unknown
): Promise<void> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(update)) {
    if (value !== undefined) patch[key] = value;
  }
  await db(injected).collection(USERS).doc(uid).update(patch);
}
