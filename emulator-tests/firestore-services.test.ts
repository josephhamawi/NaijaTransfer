/**
 * Service tests against the real Firestore emulator.
 *
 * The in-memory double in `src/services/__tests__/fake-firestore.ts` is
 * deliberately minimal, and these services lean on behaviour it does
 * not model: transactions with multiple reads, `orderBy`, `count()` and
 * `sum()` aggregations, and subcollection semantics. Faking those would
 * mean testing the fake.
 *
 * Requires JDK 21+ for the emulator:
 *
 *     export JAVA_HOME=/usr/local/opt/openjdk@21
 *     npm run test:emulator
 *
 * Kept out of `npm test` so the default suite needs no JDK.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

/**
 * The project the Admin SDK actually talks to.
 *
 * Read from the initialised app rather than from GCLOUD_PROJECT:
 * `src/lib/firebase-admin.ts` falls back to a hardcoded project id when
 * no service account is configured, so the emulator data lives under
 * that id. Clearing a different project leaves every test seeing the
 * previous test's documents.
 */
let projectId = "naijatransfer";

async function clearFirestore() {
  const host = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  const res = await fetch(
    `http://${host}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    throw new Error(`Failed to clear emulator data for ${projectId}: ${res.status}`);
  }
}

// Imported lazily: these modules initialise the Admin SDK on first use,
// which must happen after the emulator env vars are in place.
let userService: typeof import("@/services/user.service");
let apiKeyService: typeof import("@/services/api-key.service");
let fileRequestService: typeof import("@/services/file-request.service");
let paymentService: typeof import("@/services/payment.service");
let transferService: typeof import("@/services/transfer.service");
let admin: typeof import("@/lib/firebase-admin");

beforeAll(async () => {
  userService = await import("@/services/user.service");
  apiKeyService = await import("@/services/api-key.service");
  fileRequestService = await import("@/services/file-request.service");
  paymentService = await import("@/services/payment.service");
  transferService = await import("@/services/transfer.service");
  admin = await import("@/lib/firebase-admin");
  projectId = admin.ensureInitialized().options.projectId ?? projectId;
});

beforeEach(async () => {
  await clearFirestore();
});

afterAll(async () => {
  await clearFirestore();
});

const UID = "uid-alice";
const OTHER = "uid-bob";

async function seedUser(uid = UID, overrides: Record<string, unknown> = {}) {
  await admin.getDb().collection("users").doc(uid).set({
    email: `${uid}@example.com`,
    name: uid,
    tier: "FREE",
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe("user.service", () => {
  it("creates a user document on first sign-in and is idempotent after", async () => {
    const first = await userService.upsertUserFromAuth(UID, {
      email: "alice@example.com",
      name: "Alice",
    });
    expect(first.created).toBe(true);
    expect(first.user.tier).toBe("FREE");

    const second = await userService.upsertUserFromAuth(UID, {
      email: "alice@example.com",
      name: "Alice Updated",
    });
    expect(second.created).toBe(false);
    expect(second.user.name).toBe("Alice Updated");
  });

  it("never downgrades a paid tier on sign-in", async () => {
    // The webhook owns tier. A sign-in that reset it would silently
    // un-subscribe a paying customer.
    await seedUser(UID, { tier: "PRO" });
    const { user } = await userService.upsertUserFromAuth(UID, {
      email: `${UID}@example.com`,
      tier: "FREE",
    });
    expect(user.tier).toBe("PRO");
  });

  it("pins the owner to OWNER on sign-in", async () => {
    await seedUser(UID);
    const { user } = await userService.upsertUserFromAuth(UID, {
      email: `${UID}@example.com`,
      tier: "OWNER",
    });
    expect(user.tier).toBe("OWNER");
  });

  it("resolves a user by uid and by legacy Prisma id", async () => {
    await seedUser(UID, { legacyId: "ckoldcuid" });

    expect((await userService.getUserByAnyId(UID))?.id).toBe(UID);
    // This is what keeps a pre-migration Paystack renewal working.
    expect((await userService.getUserByAnyId("ckoldcuid"))?.id).toBe(UID);
    expect(await userService.getUserByAnyId("nobody")).toBeNull();
  });

  it("finds users by subscription code", async () => {
    await seedUser(UID, { paystackSubCode: "SUB_1" });
    await seedUser(OTHER, { paystackSubCode: "SUB_2" });

    const found = await userService.getUsersBySubCode("SUB_1");
    expect(found.map((u) => u.id)).toEqual([UID]);
  });

  it("claims a username and refuses a second claimant", async () => {
    await seedUser(UID);
    await seedUser(OTHER);

    await userService.updateProfile(UID, { username: "ada123" });
    expect((await userService.getUser(UID))?.username).toBe("ada123");
    expect(await userService.isUsernameAvailable("ada123")).toBe(false);

    await expect(
      userService.updateProfile(OTHER, { username: "ada123" })
    ).rejects.toMatchObject({ field: "username" });
  });

  it("releases the old username when it changes", async () => {
    await seedUser(UID);
    await userService.updateProfile(UID, { username: "first1" });
    await userService.updateProfile(UID, { username: "second2" });

    expect(await userService.isUsernameAvailable("first1")).toBe(true);
    expect(await userService.isUsernameAvailable("second2")).toBe(false);
  });

  it("refuses a phone number already linked to another account", async () => {
    await seedUser(UID);
    await seedUser(OTHER);

    await userService.updateProfile(UID, { phone: "+2348012345678" });
    await expect(
      userService.updateProfile(OTHER, { phone: "+234 801 234 5678" })
    ).rejects.toMatchObject({ field: "phone" });
  });

  it("lets a user re-save their own username and phone unchanged", async () => {
    await seedUser(UID);
    await userService.updateProfile(UID, { username: "same11", phone: "+2340000000" });
    await expect(
      userService.updateProfile(UID, { username: "same11", phone: "+2340000000" })
    ).resolves.toMatchObject({ username: "same11" });
  });

  it("applies a subscription change without touching profile fields", async () => {
    await seedUser(UID, { firstName: "Ada" });
    await userService.updateSubscription(UID, {
      tier: "BUSINESS",
      paystackSubCode: "SUB_9",
      planEndDate: new Date("2027-01-01T00:00:00Z"),
    });

    const user = await userService.getUser(UID);
    expect(user?.tier).toBe("BUSINESS");
    expect(user?.paystackSubCode).toBe("SUB_9");
    expect(user?.firstName).toBe("Ada");
  });
});

describe("api-key.service", () => {
  it("issues a key that validates, and never stores the raw key", async () => {
    await seedUser(UID);
    const { key, record } = await apiKeyService.createApiKey(UID, "CI", "PRO");

    const validated = await apiKeyService.validateApiKey(key);
    expect(validated?.uid).toBe(UID);
    expect(validated?.tier).toBe("PRO");

    // The document id is the hash; the raw key must appear nowhere.
    const docs = await admin.getDb().collection("apiKeys").get();
    expect(JSON.stringify(docs.docs.map((d) => d.data()))).not.toContain(key);
    expect(record.publicId).not.toBe(key);
  });

  it("rejects an unknown or revoked key", async () => {
    await seedUser(UID);
    const { key, record } = await apiKeyService.createApiKey(UID, "CI");

    expect(await apiKeyService.validateApiKey("nt_live_nonsense")).toBeNull();

    expect(await apiKeyService.revokeApiKey(record.publicId, UID)).toBe(true);
    expect(await apiKeyService.validateApiKey(key)).toBeNull();
  });

  it("refuses to revoke another user's key", async () => {
    await seedUser(UID);
    const { key, record } = await apiKeyService.createApiKey(UID, "CI");

    expect(await apiKeyService.revokeApiKey(record.publicId, OTHER)).toBe(false);
    expect(await apiKeyService.validateApiKey(key)).not.toBeNull();
  });

  it("lists only the owner's keys, newest first", async () => {
    await apiKeyService.createApiKey(UID, "first");
    await new Promise((r) => setTimeout(r, 10));
    await apiKeyService.createApiKey(UID, "second");
    await apiKeyService.createApiKey(OTHER, "theirs");

    const keys = await apiKeyService.listUserApiKeys(UID);
    expect(keys.map((k) => k.name)).toEqual(["second", "first"]);
  });
});

describe("file-request.service", () => {
  it("creates a request and finds it by short code", async () => {
    const created = await fileRequestService.createFileRequest(UID, { title: "Send art" });
    const found = await fileRequestService.getFileRequestByCode(created.shortCode);
    expect(found?.id).toBe(created.id);
    expect(found?.uid).toBe(UID);
  });

  it("scopes a request to its owner", async () => {
    const created = await fileRequestService.createFileRequest(UID, { title: "Mine" });
    expect(await fileRequestService.getOwnedFileRequest(created.id, UID)).not.toBeNull();
    expect(await fileRequestService.getOwnedFileRequest(created.id, OTHER)).toBeNull();
  });

  it("records uploads and counts them in the listing", async () => {
    const created = await fileRequestService.createFileRequest(UID, { title: "Collect" });
    await fileRequestService.recordUpload(created.id, {
      uploaderName: "Ada",
      transferId: "tr1",
    });
    await fileRequestService.recordUpload(created.id, {
      uploaderName: "Bob",
      transferId: "tr2",
    });

    const list = await fileRequestService.listUserFileRequests(UID);
    expect(list).toHaveLength(1);
    expect(list[0].uploadCount).toBe(2);

    const uploads = await fileRequestService.listUploads(created.id);
    expect(uploads.map((u) => u.transferId).sort()).toEqual(["tr1", "tr2"]);
  });

  it("closes only the owner's request", async () => {
    const created = await fileRequestService.createFileRequest(UID, { title: "Closable" });

    expect(await fileRequestService.closeFileRequest(created.id, OTHER)).toBe(false);
    expect(await fileRequestService.closeFileRequest(created.id, UID)).toBe(true);

    // A closed request must stop accepting uploads at the route layer,
    // which keys off this status.
    expect((await fileRequestService.getFileRequestByCode(created.shortCode))?.status).toBe(
      "CLOSED"
    );
  });
});

describe("payment.service", () => {
  it("records a pending payment and settles it idempotently", async () => {
    await seedUser(UID);
    await paymentService.recordPendingPayment(UID, {
      amount: 200000,
      currency: "NGN",
      paystackRef: "ref_1",
    });

    await paymentService.markPaymentStatus(UID, "ref_1", "SUCCESS");
    // A replayed webhook must not create a second record.
    await paymentService.markPaymentStatus(UID, "ref_1", "SUCCESS");

    const payments = await paymentService.listUserPayments(UID);
    expect(payments).toHaveLength(1);
    expect(payments[0].status).toBe("SUCCESS");
    expect(payments[0].amount).toBe(200000);
  });

  it("settles a payment whose webhook arrives before the checkout write", async () => {
    await seedUser(UID);
    // Out-of-order: mark first, then the pending write never happens.
    await paymentService.markPaymentStatus(UID, "ref_race", "SUCCESS");

    const payments = await paymentService.listUserPayments(UID);
    expect(payments).toHaveLength(1);
    expect(payments[0].status).toBe("SUCCESS");
  });
});

describe("transfer.service storage usage", () => {
  async function seedTransfer(
    id: string,
    userId: string,
    status: string,
    bytes: number
  ) {
    await admin.getDb().collection("transfers").doc(id).set({
      shortCode: id,
      userId,
      status,
      totalSizeBytes: bytes,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86_400_000),
      downloadCount: 0,
      downloadLimit: 50,
      tier: "PRO",
    });
  }

  it("sums only the owner's active transfers", async () => {
    await seedTransfer("t1", UID, "ACTIVE", 1000);
    await seedTransfer("t2", UID, "ACTIVE", 2500);
    await seedTransfer("t3", UID, "EXPIRED", 9999);
    await seedTransfer("t4", OTHER, "ACTIVE", 7777);

    const usage = await transferService.getUserStorageUsage(UID);
    expect(usage.usedBytes).toBe(3500);
    expect(usage.activeTransfers).toBe(2);
  });

  it("reports zero for a user with nothing stored", async () => {
    const usage = await transferService.getUserStorageUsage("uid-nobody");
    expect(usage).toEqual({ usedBytes: 0, activeTransfers: 0 });
  });
});
