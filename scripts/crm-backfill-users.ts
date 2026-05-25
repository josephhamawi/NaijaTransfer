/**
 * One-off (or cron) backfill: push existing NaijaTransfer users into the CRM.
 *
 * Reads users from Postgres (Prisma) and POSTs them to the CRM's /users/import
 * endpoint in batches. Safe to run repeatedly — the CRM upserts by uid.
 *
 * Usage:
 *   CRM_APP_ID=... CRM_API_KEY=... npx tsx scripts/crm-backfill-users.ts
 *   (or: npm run crm:backfill-users  — reads the same env vars)
 *
 * This script is standalone: it does not import app code and cannot affect the
 * running web app.
 */
import { PrismaClient } from "@prisma/client";

const CRM_ENDPOINT = process.env.CRM_ENDPOINT || "https://api-ei3nxpoa5q-uc.a.run.app";
const CRM_APP_ID = process.env.CRM_APP_ID || "";
const CRM_API_KEY = process.env.CRM_API_KEY || "";
const BATCH_SIZE = 500;

async function main() {
  if (!CRM_APP_ID || !CRM_API_KEY) {
    console.error("Missing CRM_APP_ID and/or CRM_API_KEY. Set them and re-run.");
    process.exit(1);
  }

  const db = new PrismaClient();
  let processed = 0;
  let imported = 0;
  let updated = 0;
  let errors = 0;
  let skip = 0;

  try {
    const total = await db.user.count();
    console.log(`Backfilling ${total} users to CRM app "${CRM_APP_ID}" at ${CRM_ENDPOINT}`);

    // Page through users in stable id order.
    for (;;) {
      const users = await db.user.findMany({
        orderBy: { id: "asc" },
        skip,
        take: BATCH_SIZE,
        select: { id: true, email: true, name: true, phone: true, image: true, createdAt: true },
      });
      if (users.length === 0) break;
      skip += users.length;

      const payload = users.map((u) => ({
        uid: u.id,
        email: u.email ?? undefined,
        displayName: u.name ?? undefined,
        phone: u.phone ?? undefined,
        avatar: u.image ?? undefined,
        createdAt: u.createdAt?.toISOString(),
      }));

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
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
