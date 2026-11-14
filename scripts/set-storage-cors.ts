/**
 * Apply the bucket CORS policy that lets browsers PUT straight into
 * storage.
 *
 * Direct uploads are the whole point of /api/upload/file/batch-init: the
 * bytes go from the user's browser into the bucket in one hop instead of
 * NOTE ON CREDENTIALS: this uses the Admin SDK, which picks up
 * application-default credentials — NOT whatever `gcloud config` says.
 * If ADC belongs to an account without access to the bucket, it fails
 * with a confusing storage.buckets.get denial. Either run
 * `gcloud auth application-default login --account <owner>` first, or
 * apply the policy with gcloud directly:
 *
 *   gcloud storage buckets update gs://naijatransfer.firebasestorage.app \
 *     --cors-file=cors.json --project naijatransfer --account <owner>
 *
 * being proxied through the app server. A cross-origin PUT only works if
 * the bucket itself advertises the origin, and that policy lives on the
 * bucket, not in this repo — so it has to be pushed once per bucket.
 *
 * Until it is applied, batch-init reports `direct: false` (it reads the
 * live CORS config) and uploads fall back to the proxy path. Nothing
 * breaks; it's just the slow route.
 *
 * Usage:
 *   npm run storage:cors            # apply
 *   npm run storage:cors -- --check # print current policy, change nothing
 *
 * Credentials come from the same env the app uses
 * (FIREBASE_SERVICE_ACCOUNT / GOOGLE_APPLICATION_CREDENTIALS / the
 * FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY pair). Run it on the
 * server, or anywhere those are set.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Next loads .env.local for the app; a bare tsx process doesn't.
function loadEnvFile(file: string) {
  let raw: string;
  try {
    raw = readFileSync(resolve(process.cwd(), file), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key] !== undefined) continue;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const ORIGINS = [
  "https://naijatransfer.com",
  "https://www.naijatransfer.com",
  // App Hosting's default backend URL. Needed before the custom domain
  // is cut over, because /api/upload/file/batch-init refuses to mint
  // signed URLs for an origin the bucket does not advertise — without
  // this, every upload on the hosted.app URL returns 503.
  "https://main--naijatransfer.europe-west4.hosted.app",
  "http://localhost:3000",
  ...(process.env.APP_URL ? [process.env.APP_URL] : []),
  ...(process.env.EXTRA_CORS_ORIGINS
    ? process.env.EXTRA_CORS_ORIGINS.split(",").map((o) => o.trim())
    : []),
].filter((v, i, a) => v && a.indexOf(v) === i);

const CORS = [
  {
    origin: ORIGINS,
    method: ["GET", "HEAD", "PUT", "POST", "OPTIONS"],
    // Content-Type is signed into the PUT URL, so the browser sends it
    // and the preflight must allow it. ETag/x-goog-* are what the
    // response exposes back to the page.
    responseHeader: [
      "Content-Type",
      "Content-Length",
      "Content-Range",
      "Content-Disposition",
      "ETag",
      "Date",
      "x-goog-resumable",
      "x-goog-generation",
    ],
    maxAgeSeconds: 3600,
  },
];

async function main() {
  const check = process.argv.includes("--check");

  const { getStorageBucket } = await import("../src/lib/firebase-admin");
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "naijatransfer.firebasestorage.app";
  const bucket = getStorageBucket().bucket(bucketName);

  const [before] = await bucket.getMetadata();
  console.log(`Bucket: ${bucketName}`);
  console.log("Current CORS:", JSON.stringify(before.cors ?? [], null, 2));

  if (check) return;

  await bucket.setCorsConfiguration(CORS);
  const [after] = await bucket.getMetadata();
  console.log("Applied CORS:", JSON.stringify(after.cors ?? [], null, 2));
  console.log("\nDirect browser uploads are now enabled for:\n  " + ORIGINS.join("\n  "));
}

main().catch((err) => {
  console.error("Failed to set CORS:", err?.message ?? err);
  process.exit(1);
});
