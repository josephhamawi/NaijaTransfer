/**
 * Prove the R2 driver works against a live bucket, before anything in
 * production depends on it.
 *
 * The part worth proving is `composeFiles`. GCS stitches objects with a
 * native `compose`; R2 has no equivalent, so the driver creates a
 * multipart upload whose parts are server-side COPIES of the already
 * uploaded part objects (`UploadPartCopy`). That path is type-checked
 * but has never run against Cloudflare, and it carries a constraint
 * type-checking cannot see: every copied part except the last must be
 * at least 5 MiB.
 *
 * So this uploads parts at the real PART_SIZE, stitches them, and
 * compares the result byte for byte with what went in. Anything less
 * would be testing that the SDK compiles, not that the design works.
 *
 * Usage:
 *   STORAGE_DRIVER=r2 npx tsx scripts/verify-r2.ts
 *
 * Writes only under `verify-r2/` and deletes everything it created.
 */

import crypto from "node:crypto";
import { PART_SIZE } from "@/lib/upload-parts";

process.env.STORAGE_DRIVER = "r2";

const PREFIX = `verify-r2/${Date.now()}/`;
let failures = 0;

function check(name: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function main() {
  const r2 = await import("@/lib/storage/r2");
  const { S3Client, ListMultipartUploadsCommand } = await import("@aws-sdk/client-s3");

  console.log(`R2 verification against bucket "${process.env.R2_BUCKET_NAME}"\n`);

  // ── 1. health ──────────────────────────────────────────────────────
  check("bucket reachable", await r2.checkStorageHealth());

  // ── 2. single-part upload via signed PUT ───────────────────────────
  const smallKey = `${PREFIX}small.bin`;
  const smallBody = crypto.randomBytes(64 * 1024);
  const smallUrl = await r2.getSignedUploadUrl(smallKey, "application/octet-stream");
  check("signed upload URL minted", Boolean(smallUrl));

  if (smallUrl) {
    const put = await fetch(smallUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: smallBody,
    });
    check("signed PUT accepted", put.ok, `HTTP ${put.status}`);
  }

  check(
    "object size matches what was written",
    (await r2.getObjectSize(smallKey)) === smallBody.length
  );

  // ── 3. signed download round-trips the same bytes ──────────────────
  const getUrl = await r2.getDownloadUrl(smallKey, 60_000, "small.bin");
  const got = Buffer.from(await (await fetch(getUrl)).arrayBuffer());
  check("signed GET returns identical bytes", got.equals(smallBody));

  // ── 4. the compose path, at real part sizes ────────────────────────
  //
  // Two parts at PART_SIZE (16 MiB) plus a short tail, which is the
  // shape a real multi-part upload produces and the shape that would
  // break if the 5 MiB floor were violated.
  const partBodies = [
    crypto.randomBytes(PART_SIZE),
    crypto.randomBytes(PART_SIZE),
    crypto.randomBytes(1024 * 1024),
  ];
  const partKeys = partBodies.map((_, i) => `${PREFIX}parts/${String(i + 1).padStart(4, "0")}`);

  for (let i = 0; i < partBodies.length; i++) {
    const url = await r2.getSignedUploadUrl(partKeys[i], "application/octet-stream");
    if (!url) {
      check(`part ${i + 1} URL`, false);
      continue;
    }
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: partBodies[i],
    });
    if (!res.ok) check(`part ${i + 1} uploaded`, false, `HTTP ${res.status}`);
  }
  check("all parts uploaded", true, `${partBodies.length} parts, ${PART_SIZE / 1024 ** 2} MiB each`);

  const listed = await r2.listUploadedParts(`${PREFIX}parts/`);
  check("listUploadedParts finds every part", listed.length === partBodies.length,
    `found [${listed.join(", ")}]`);

  const composedKey = `${PREFIX}composed.bin`;
  await r2.composeMany(composedKey, partKeys, "application/octet-stream");

  const expected = Buffer.concat(partBodies);
  const composedSize = await r2.getObjectSize(composedKey);
  check("composed object has the full byte count", composedSize === expected.length,
    `${composedSize} vs ${expected.length}`);

  const composedUrl = await r2.getDownloadUrl(composedKey, 120_000);
  const composed = Buffer.from(await (await fetch(composedUrl)).arrayBuffer());
  check("composed object is byte-identical to the source", composed.equals(expected),
    `sha ${crypto.createHash("sha256").update(composed).digest("hex").slice(0, 16)} vs ` +
    `${crypto.createHash("sha256").update(expected).digest("hex").slice(0, 16)}`);

  // ── 5. single-source compose (the degenerate case) ─────────────────
  const copyKey = `${PREFIX}copied.bin`;
  await r2.composeMany(copyKey, [smallKey], "application/octet-stream");
  check("single-source compose copies correctly",
    (await r2.getObjectSize(copyKey)) === smallBody.length);

  // ── 6. no multipart uploads left billing ───────────────────────────
  //
  // An aborted or abandoned multipart upload keeps its parts and bills
  // for them while no object exists to show for it, and no object
  // listing reveals them.
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  const pending = await s3.send(
    new ListMultipartUploadsCommand({ Bucket: process.env.R2_BUCKET_NAME!, Prefix: PREFIX })
  );
  check("no dangling multipart uploads", (pending.Uploads ?? []).length === 0,
    `${(pending.Uploads ?? []).length} pending`);

  // ── 7. CORS, which gates every browser upload ──────────────────────
  const corsOk = await r2.isDirectUploadAllowed("https://naijatransfer.com");
  check("CORS allows PUT from https://naijatransfer.com", corsOk,
    corsOk ? "" : "batch-init would return 503 for every upload");

  // ── 8. cleanup ─────────────────────────────────────────────────────
  const deleted = await r2.deleteByPrefix(PREFIX);
  check("deleteByPrefix removed everything", deleted > 0, `${deleted} objects`);
  const leftover = await r2.listUploadedParts(PREFIX);
  check("bucket left clean", leftover.length === 0);

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nVerification crashed:", err);
  process.exit(1);
});
