/**
 * One-off (or cron) backfill: push existing NaijaTransfer users into the CRM.
 *
 * Reads users from Firestore and POSTs them to the CRM's /users/import
 * endpoint in batches. Safe to run repeatedly — the CRM upserts by uid.
 *
 * The uid sent is the Firebase uid, which is now the only user key.
 * Re-running after the Postgres migration re-keys every CRM record that
 * was imported under the old Prisma cuid.
 *
 * Usage:
 *   CRM_APP_ID=... CRM_API_KEY=... npx tsx scripts/crm-backfill-users.ts
 *   (or: npm run crm:backfill-users  — reads the same env vars)
 *
 * This script is standalone: it does not import app code and cannot affect the
 * running web app.
 */
import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const CRM_ENDPOINT = process.env.CRM_ENDPOINT || "https://api-ei3nxpoa5q-uc.a.run.app";
const CRM_APP_ID = process.env.CRM_APP_ID || "";
const CRM_API_KEY = process.env.CRM_API_KEY || "";
const BATCH_SIZE = 500;

async function main() {
  if (!CRM_APP_ID || !CRM_API_KEY) {
    console.error("Missing CRM_APP_ID and/or CRM_API_KEY. Set them and re-run.");
    process.exit(1);
  }

  if (getApps().length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    initializeApp(raw ? { credential: cert(JSON.parse(raw)) } : { credential: applicationDefault() });
  }
  const db = getFirestore();

  let processed = 0;
  let imported = 0;
  let updated = 0;
  let errors = 0;

  const total = (await db.collection("users").count().get()).data().count;
    console.log(`Backfilling ${total} users to CRM app "${CRM_APP_ID}" at ${CRM_ENDPOINT}`);

    // Page by document id — stable, and avoids an offset scan that gets
    // more expensive with every page.
    let cursor: string | null = null;
    for (;;) {
      let query = db.collection("users").orderBy("__name__").limit(BATCH_SIZE);
      if (cursor) query = query.startAfter(cursor);
      const snap = await query.get();
      if (snap.empty) break;
      cursor = snap.docs[snap.docs.length - 1].id;

      const payload = snap.docs.map((doc) => {
        const u = doc.data();
        const createdAt = u.createdAt?.toDate?.() ?? (u.createdAt ? new Date(u.createdAt) : null);
        return {
          uid: doc.id,
          email: u.email ?? undefined,
          displayName: u.name ?? undefined,
          phone: u.phone ?? undefined,
          avatar: u.image ?? undefined,
          createdAt: createdAt?.toISOString(),
        };
      });
      const users = snap.docs;

      try {
        const res = await fetch(`${CRM_ENDPOINT}/users/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appId: CRM_APP_ID, apiKey: CRM_API_KEY, users: payload }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          errors += users.length;
          console.error(`Batch failed (${res.status}):`, data.error || res.statusText);
        } else {
          imported += data.imported || 0;
          updated += data.updated || 0;
          errors += data.errors || 0;
        }
      } catch (err: any) {
        errors += users.length;
        console.error("Batch request error:", err.message);
      }

      processed += users.length;
      console.log(`  ${processed}/${total} processed…`);
    }

  console.log(`\nDone. processed=${processed} imported=${imported} updated=${updated} errors=${errors}`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
