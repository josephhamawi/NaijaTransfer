/**
 * One-time migration: Postgres → Firestore.
 *
 * Reads a JSON export of the Postgres tables and writes them into
 * Firestore under the Firebase uid, which is now the only user key.
 *
 * ── Why a JSON export rather than a live connection ──────────────────
 * The database lives on the Hetzner box and is not reachable from a
 * laptop or from CI. Exporting first also means the migration runs
 * against a fixed snapshot: re-running it produces the same result,
 * which a live cursor over a database still taking writes would not.
 *
 * ── Producing the export (on the VM) ─────────────────────────────────
 *   pg_dump "$DATABASE_URL" -Fc -f naijatransfer.dump      # keep this
 *   psql "$DATABASE_URL" -At -c "SELECT json_build_object(
 *     'users',       (SELECT coalesce(json_agg(u), '[]') FROM users u),
 *     'payments',    (SELECT coalesce(json_agg(p), '[]') FROM payments p),
 *     'api_keys',    (SELECT coalesce(json_agg(k), '[]') FROM api_keys k),
 *     'file_requests', (SELECT coalesce(json_agg(r), '[]') FROM file_requests r),
 *     'file_request_uploads', (SELECT coalesce(json_agg(fu), '[]') FROM file_request_uploads fu),
 *     'fx_rates',    (SELECT coalesce(json_agg(f), '[]') FROM fx_rates f)
 *   )" > export.json
 *
 * ── Running it ───────────────────────────────────────────────────────
 *   GCLOUD_ACCOUNT=<owner@gmail.com> \
 *     npx tsx scripts/migrate-pg-to-firestore.ts export.json          # dry run
 *   npx tsx scripts/migrate-pg-to-firestore.ts export.json --apply    # write
 *   npx tsx scripts/migrate-pg-to-firestore.ts export.json --verify   # compare
 *
 * Dry run is the default on purpose: a migration you cannot inspect
 * before it writes is one you cannot trust.
 *
 * ── Identity ─────────────────────────────────────────────────────────
 * Each Postgres user is matched to a Firebase Auth account by email.
 * When no Firebase account exists, one is created with the bcrypt hash
 * carried over, so existing passwords keep working. The resulting uid
 * becomes the document id, and the old Prisma cuid is kept on the
 * document as `legacyId` — Paystack sends that cuid on every renewal of
 * a subscription created before this migration, and the webhook resolves
 * it through `getUserByAnyId`.
 *
 * Idempotent: documents are written with deterministic ids and `merge`,
 * so a second run converges instead of duplicating.
 */

import { readFileSync } from "node:fs";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// ─── Shapes of the exported rows ─────────────────────────────────────

interface PgUser {
  id: string;
  email: string | null;
  emailVerified: string | null;
  phone: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  hearAboutUs: string | null;
  image: string | null;
  tier: string;
  planStartDate: string | null;
  planEndDate: string | null;
  paystackCustomerId: string | null;
  paystackSubCode: string | null;
  storageUsedBytes: string | number | null;
  createdAt: string;
  updatedAt: string;
  /** Present only if the export joined the accounts table. */
  passwordHash?: string | null;
}

interface PgPayment {
  id: string;
  userId: string;
  type: string;
  amount: number;
  currency: string;
  paystackRef: string;
  paystackSubCode: string | null;
  status: string;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PgApiKey {
  id: string;
  userId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  tier: string;
  rateLimit: number;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PgFileRequest {
  id: string;
  userId: string;
  shortCode: string;
  title: string;
  message: string | null;
  status: string;
  maxUploads: number | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PgFileRequestUpload {
  id: string;
  requestId: string;
  uploaderName: string | null;
  uploaderEmail: string | null;
  transferId: string;
  uploadedAt: string;
}

interface PgFxRate {
  id: string;
  currency: string;
  market: string;
  buyRate: number;
  sellRate: number;
  source: string;
  fetchedAt: string;
}

interface Export {
  users?: PgUser[];
  payments?: PgPayment[];
  api_keys?: PgApiKey[];
  file_requests?: PgFileRequest[];
  file_request_uploads?: PgFileRequestUpload[];
  fx_rates?: PgFxRate[];
}

// ─── Setup ───────────────────────────────────────────────────────────

const [, , exportPath, ...flags] = process.argv;
const APPLY = flags.includes("--apply");
const VERIFY = flags.includes("--verify");

if (!exportPath) {
  console.error("Usage: tsx scripts/migrate-pg-to-firestore.ts <export.json> [--apply|--verify]");
  process.exit(1);
}

/**
 * Credentials.
 *
 * firebase-admin's Firestore client accepts only a certificate
 * credential or true application-default credentials — a hand-rolled
 * credential that merely supplies access tokens is rejected with
 * `firestore/invalid-credential`, even though it works for other
 * services. So ADC has to be genuinely correct before this runs.
 *
 * The trap worth knowing: `gcloud auth application-default login
 * --account X` only *hints* at X. The browser's account chooser
 * decides, and it will silently reuse whoever is already signed in.
 * When the project belongs to one Google account and the machine's ADC
 * belongs to another, the result is a 403 that reads like a
 * permissions problem rather than a wrong-identity one — which is why
 * preflight() below names the identity it actually found.
 */
async function preflight(projectId: string): Promise<void> {
  const { execFileSync } = await import("node:child_process");

  let identity = "(unknown)";
  try {
    const token = execFileSync("gcloud", ["auth", "application-default", "print-access-token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    const info = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
    ).then((r) => r.json() as Promise<{ email?: string }>);
    identity = info.email ?? identity;

    const probe = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?pageSize=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (probe.ok) return;

    throw new Error(`Firestore probe returned HTTP ${probe.status}`);
  } catch (err) {
    console.error(
      [
        "",
        "Cannot reach Firestore in project " + projectId + ".",
        "  application-default identity: " + identity,
        "  " + (err instanceof Error ? err.message : String(err)),
        "",
        "Fix: re-run the ADC login and pick the account that OWNS the project",
        "in the browser account chooser — the --account flag alone will not",
        "switch it if another account is already signed in:",
        "",
        "  gcloud auth application-default login --account <owner@gmail.com>",
        "",
      ].join("\n")
    );
    process.exit(1);
  }
}

function init(): Firestore {
  if (getApps().length === 0) {
    // Against the emulators there are no credentials to find, and
    // asking for application-default ones fails outright. This is also
    // what lets the migration be rehearsed end to end before it is ever
    // pointed at production.
    const emulated =
      Boolean(process.env.FIRESTORE_EMULATOR_HOST) ||
      Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

    if (emulated) {
      initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-livesend" });
    } else {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      const projectId = process.env.GCLOUD_PROJECT || "naijatransfer";

      initializeApp(
        raw
          ? { credential: cert(JSON.parse(raw)) }
          : { credential: applicationDefault(), projectId }
      );
    }
  }
  return getFirestore();
}

function date(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Lagos calendar day. Matches fx.service's bucketing exactly. */
function lagosDayKey(at: Date): string {
  return new Date(at.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Marks a uid that does not exist yet. Dry run only. */
const PLACEHOLDER_PREFIX = "<new-uid-for:";

function isPlaceholder(uid: string): boolean {
  return uid.startsWith(PLACEHOLDER_PREFIX);
}

const stats = {
  usersMatched: 0,
  usersCreatedInAuth: 0,
  usersWritten: 0,
  usersSkipped: 0,
  payments: 0,
  apiKeys: 0,
  fileRequests: 0,
  uploads: 0,
  fxPairs: 0,
  warnings: [] as string[],
};

// ─── Identity resolution ─────────────────────────────────────────────

/**
 * cuid → uid for every exported user.
 *
 * Resolution order matters: an existing Firebase account must be reused
 * rather than duplicated, because transfers and Live Send rooms are
 * already keyed by that uid. Creating a second account for the same
 * person would orphan everything they have ever sent.
 */
async function buildIdMap(users: PgUser[]): Promise<Map<string, string>> {
  const auth = getAuth();
  const map = new Map<string, string>();

  for (const user of users) {
    if (!user.email) {
      stats.usersSkipped += 1;
      stats.warnings.push(`user ${user.id}: no email, cannot map to a Firebase account`);
      continue;
    }

    try {
      const existing = await auth.getUserByEmail(user.email);
      map.set(user.id, existing.uid);
      stats.usersMatched += 1;
      continue;
    } catch {
      // No Firebase account yet — fall through and create one.
    }

    if (!APPLY) {
      // Dry run: stand in a placeholder so the rest of the migration
      // still reports what WOULD move. Nothing is written in this mode,
      // so the fake id never reaches Firestore — and placeholders only
      // exist in dry run, never under --apply.
      map.set(user.id, `${PLACEHOLDER_PREFIX}${user.email}`);
      stats.usersCreatedInAuth += 1;
      continue;
    }

    try {
      const created = await auth.createUser({
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        displayName: user.name ?? undefined,
        photoURL: user.image ?? undefined,
      });

      // Carry the bcrypt hash over when the export included one, so an
      // email/password user keeps their existing password.
      if (user.passwordHash) {
        await auth.importUsers(
          [{ uid: created.uid, email: user.email, passwordHash: Buffer.from(user.passwordHash) }],
          { hash: { algorithm: "BCRYPT" } }
        );
      }

      map.set(user.id, created.uid);
      stats.usersCreatedInAuth += 1;
    } catch (err) {
      stats.usersSkipped += 1;
      stats.warnings.push(
        `user ${user.id} (${user.email}): could not create Firebase account — ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  return map;
}

// ─── Writers ─────────────────────────────────────────────────────────

/** Batched writes, flushed well under Firestore's 500-operation limit. */
class Batcher {
  private ops: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];

  constructor(private readonly db: Firestore) {}

  set(ref: FirebaseFirestore.DocumentReference, data: Record<string, unknown>): void {
    if (APPLY && ref.path.includes(PLACEHOLDER_PREFIX)) {
      throw new Error(`refusing to write a placeholder document id: ${ref.path}`);
    }
    this.ops.push((batch) => batch.set(ref, data, { merge: true }));
  }

  async flush(): Promise<void> {
    if (!APPLY) {
      this.ops = [];
      return;
    }
    while (this.ops.length > 0) {
      const chunk = this.ops.splice(0, 400);
      const batch = this.db.batch();
      for (const op of chunk) op(batch);
      await batch.commit();
    }
  }
}

async function migrateUsers(db: Firestore, data: Export, ids: Map<string, string>) {
  const batcher = new Batcher(db);

  for (const user of data.users ?? []) {
    const uid = ids.get(user.id);
    if (!uid) continue;

    // merge:true — the Firestore user document already exists for anyone
    // who has signed in since Firebase Auth was added, and it holds the
    // fields auth owns. This fills in what only Postgres had.
    batcher.set(db.collection("users").doc(uid), {
      email: user.email,
      emailVerified: date(user.emailVerified),
      phone: user.phone,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      hearAboutUs: user.hearAboutUs,
      image: user.image,
      tier: user.tier,
      planStartDate: date(user.planStartDate),
      planEndDate: date(user.planEndDate),
      paystackCustomerId: user.paystackCustomerId,
      paystackSubCode: user.paystackSubCode,
      storageUsedBytes: Number(user.storageUsedBytes ?? 0),
      legacyId: user.id,
      createdAt: date(user.createdAt) ?? new Date(),
      updatedAt: new Date(),
    });
    stats.usersWritten += 1;

    // Uniqueness reservations — without these, the first profile save
    // after the migration would see the name as free and hand it out.
    if (user.username) {
      batcher.set(db.collection("usernames").doc(user.username.toLowerCase()), {
        uid,
        username: user.username,
      });
    }
    if (user.phone) {
      batcher.set(db.collection("phones").doc(user.phone.replace(/[^0-9+]/g, "")), {
        uid,
        phone: user.phone,
      });
    }
  }

  await batcher.flush();
}

async function migratePayments(db: Firestore, data: Export, ids: Map<string, string>) {
  const batcher = new Batcher(db);

  for (const payment of data.payments ?? []) {
    const uid = ids.get(payment.userId);
    if (!uid) {
      stats.warnings.push(`payment ${payment.id}: no uid for user ${payment.userId}`);
      continue;
    }

    // Keyed by Paystack reference, matching payment.service, so a
    // re-run and a replayed webhook both land on the same document.
    batcher.set(
      db.collection("users").doc(uid).collection("payments").doc(payment.paystackRef),
      {
        type: payment.type,
        amount: payment.amount,
        currency: payment.currency,
        paystackRef: payment.paystackRef,
        paystackSubCode: payment.paystackSubCode,
        status: payment.status,
        metadata: payment.metadata ? safeJson(payment.metadata) : null,
        createdAt: date(payment.createdAt) ?? new Date(),
        updatedAt: date(payment.updatedAt) ?? new Date(),
      }
    );
    stats.payments += 1;
  }

  await batcher.flush();
}

function safeJson(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

async function migrateApiKeys(db: Firestore, data: Export, ids: Map<string, string>) {
  const batcher = new Batcher(db);

  for (const key of data.api_keys ?? []) {
    const uid = ids.get(key.userId);
    if (!uid) {
      stats.warnings.push(`api key ${key.id}: no uid for user ${key.userId}`);
      continue;
    }

    // Document id is the existing hash, so keys already issued to
    // customers keep working without reissuing them.
    batcher.set(db.collection("apiKeys").doc(key.keyHash), {
      publicId: key.id,
      uid,
      keyPrefix: key.keyPrefix,
      name: key.name,
      tier: key.tier,
      rateLimit: key.rateLimit,
      lastUsedAt: date(key.lastUsedAt),
      isActive: key.isActive,
      createdAt: date(key.createdAt) ?? new Date(),
    });
    stats.apiKeys += 1;
  }

  await batcher.flush();
}

async function migrateFileRequests(db: Firestore, data: Export, ids: Map<string, string>) {
  const batcher = new Batcher(db);

  for (const request of data.file_requests ?? []) {
    const uid = ids.get(request.userId);
    if (!uid) {
      stats.warnings.push(`file request ${request.id}: no uid for user ${request.userId}`);
      continue;
    }

    // Keep the Postgres id as the document id: existing uploads
    // reference it, and the owner's dashboard links use it.
    batcher.set(db.collection("fileRequests").doc(request.id), {
      uid,
      shortCode: request.shortCode,
      title: request.title,
      message: request.message,
      status: request.status,
      maxUploads: request.maxUploads,
      expiresAt: date(request.expiresAt),
      createdAt: date(request.createdAt) ?? new Date(),
      updatedAt: date(request.updatedAt) ?? new Date(),
    });
    stats.fileRequests += 1;
  }

  for (const upload of data.file_request_uploads ?? []) {
    batcher.set(
      db.collection("fileRequests").doc(upload.requestId).collection("uploads").doc(upload.id),
      {
        uploaderName: upload.uploaderName,
        uploaderEmail: upload.uploaderEmail,
        transferId: upload.transferId,
        uploadedAt: date(upload.uploadedAt) ?? new Date(),
      }
    );
    stats.uploads += 1;
  }

  await batcher.flush();
}

/**
 * Collapse the fx_rates rows into one document per (currency, market).
 *
 * Postgres held one row per sample; Firestore holds one point per Lagos
 * day. Where several rows share a day, the latest wins — the same thing
 * the old cron did when it deleted the day's rows before inserting.
 */
async function migrateFxRates(db: Firestore, data: Export) {
  const pairs = new Map<
    string,
    {
      currency: string;
      market: string;
      source: string;
      points: Map<string, { d: string; b: number; s: number; at: Date }>;
    }
  >();

  for (const row of data.fx_rates ?? []) {
    const at = date(row.fetchedAt);
    if (!at) continue;

    const id = `${row.currency}_${row.market}`;
    const pair =
      pairs.get(id) ??
      { currency: row.currency, market: row.market, source: row.source, points: new Map() };

    const day = lagosDayKey(at);
    const existing = pair.points.get(day);
    if (!existing || existing.at < at) {
      pair.points.set(day, { d: day, b: row.buyRate, s: row.sellRate, at });
    }
    pairs.set(id, pair);
  }

  const batcher = new Batcher(db);

  for (const [id, pair] of pairs) {
    const points = [...pair.points.values()]
      .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))
      .slice(-1500)
      .map(({ d, b, s }) => ({ d, b, s }));

    const newest = [...pair.points.values()].sort((a, b) => b.at.getTime() - a.at.getTime())[0];

    batcher.set(db.collection("fxRates").doc(id), {
      currency: pair.currency,
      market: pair.market,
      source: pair.source,
      latest: newest ? { buy: newest.b, sell: newest.s, fetchedAt: newest.at } : null,
      points,
      updatedAt: new Date(),
    });
    stats.fxPairs += 1;
  }

  await batcher.flush();
}

// ─── Verification ────────────────────────────────────────────────────

/**
 * Compare what is in Firestore with what the export said.
 *
 * Counts alone would not catch the failure that matters most — a paying
 * subscriber whose plan did not carry over — so every user holding a
 * Paystack subscription code is checked field by field.
 */
async function verify(db: Firestore, data: Export, ids: Map<string, string>) {
  let mismatches = 0;

  const userCount = (await db.collection("users").count().get()).data().count;
  console.log(`users: ${data.users?.length ?? 0} exported, ${userCount} in Firestore`);

  for (const user of data.users ?? []) {
    const uid = ids.get(user.id);
    if (!uid || isPlaceholder(uid)) continue;

    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) {
      console.error(`MISSING user ${user.id} (${user.email}) → ${uid}`);
      mismatches += 1;
      continue;
    }

    const doc = snap.data() ?? {};
    if (doc.tier !== user.tier) {
      console.error(
        `TIER MISMATCH ${user.email}: postgres=${user.tier} firestore=${doc.tier}`
      );
      mismatches += 1;
    }
    if (user.paystackSubCode && doc.paystackSubCode !== user.paystackSubCode) {
      console.error(`SUBSCRIPTION MISMATCH ${user.email}: sub code did not carry over`);
      mismatches += 1;
    }
    if (doc.legacyId !== user.id) {
      console.error(
        `LEGACY ID MISSING ${user.email}: renewals from Paystack will not resolve`
      );
      mismatches += 1;
    }
  }

  const paid = (data.users ?? []).filter((u) => u.tier !== "FREE");
  console.log(`paid accounts checked: ${paid.length}`);
  console.log(mismatches === 0 ? "\nVERIFY OK — no mismatches" : `\nVERIFY FAILED — ${mismatches} mismatches`);
  return mismatches;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const data = JSON.parse(readFileSync(exportPath, "utf8")) as Export;

  if (!process.env.FIRESTORE_EMULATOR_HOST && !process.env.FIREBASE_SERVICE_ACCOUNT) {
    await preflight(process.env.GCLOUD_PROJECT || "naijatransfer");
  }

  const db = init();

  console.log(
    `${VERIFY ? "VERIFY" : APPLY ? "APPLY" : "DRY RUN"} — ${exportPath}\n` +
      `  users=${data.users?.length ?? 0} payments=${data.payments?.length ?? 0} ` +
      `apiKeys=${data.api_keys?.length ?? 0} fileRequests=${data.file_requests?.length ?? 0} ` +
      `uploads=${data.file_request_uploads?.length ?? 0} fxRates=${data.fx_rates?.length ?? 0}\n`
  );

  const ids = await buildIdMap(data.users ?? []);

  if (VERIFY) {
    const mismatches = await verify(db, data, ids);
    process.exit(mismatches === 0 ? 0 : 1);
  }

  await migrateUsers(db, data, ids);
  await migratePayments(db, data, ids);
  await migrateApiKeys(db, data, ids);
  await migrateFileRequests(db, data, ids);
  await migrateFxRates(db, data);

  console.log("\nResult:");
  console.log(`  users matched to existing Firebase accounts: ${stats.usersMatched}`);
  console.log(`  Firebase accounts ${APPLY ? "created" : "that would be created"}: ${stats.usersCreatedInAuth}`);
  console.log(`  user documents written:   ${stats.usersWritten}`);
  console.log(`  payments:                 ${stats.payments}`);
  console.log(`  api keys:                 ${stats.apiKeys}`);
  console.log(`  file requests / uploads:  ${stats.fileRequests} / ${stats.uploads}`);
  console.log(`  fx pairs:                 ${stats.fxPairs}`);
  console.log(`  users skipped:            ${stats.usersSkipped}`);

  if (stats.warnings.length > 0) {
    console.log(`\nWarnings (${stats.warnings.length}):`);
    for (const warning of stats.warnings.slice(0, 50)) console.log(`  - ${warning}`);
    if (stats.warnings.length > 50) console.log(`  … ${stats.warnings.length - 50} more`);
  }

  if (!APPLY) {
    console.log("\nDry run — nothing was written. Re-run with --apply, then --verify.");
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
