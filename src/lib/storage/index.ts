/**
 * Object storage, behind one interface with two drivers.
 *
 * Selected by `STORAGE_DRIVER`:
 *
 *   gcs  (default) — Firebase Cloud Storage. What runs today.
 *   r2             — Cloudflare R2. Same bytes, $0 egress.
 *
 * ── Why a switch instead of just migrating ───────────────────────────
 * Egress is the product's dominant variable cost and the only one that
 * grows with success rather than revenue — a PRO subscriber on GCS who
 * fills their quota and has it downloaded once costs about 5× what they
 * pay. R2 charges nothing for egress and fixes that outright.
 *
 * But the switch cannot be a flag day. The bucket has to exist, its
 * CORS policy has to allow browser PUTs, and the compose path has to be
 * proven against a live account before anything depends on it. A driver
 * lets the R2 code ship, be reviewed and be tested while GCS keeps
 * serving, and makes the cutover one environment variable — and the
 * rollback the same.
 *
 * Only file bytes move. Auth, Firestore, Hosting and Live Send
 * signalling stay on Firebase either way.
 *
 * ── Switching ────────────────────────────────────────────────────────
 *   1. Create the R2 bucket and an API token (Account ID, Access Key,
 *      Secret, bucket name) and set R2_* in the environment.
 *   2. Apply a CORS policy allowing PUT from the app's origins —
 *      `npm run storage:cors` covers GCS; R2's lives in the Cloudflare
 *      dashboard or its API.
 *   3. Set STORAGE_DRIVER=r2 and deploy.
 *
 * Existing objects do NOT move by themselves. Transfers already stored
 * in GCS stay reachable only while the GCS driver is selected, so flip
 * this when the bucket is empty or after copying what matters. It is
 * empty today.
 */

import * as gcs from "./gcs";
import * as r2 from "./r2";
import type { Readable } from "node:stream";

export type StorageDriverName = "gcs" | "r2";

export function activeDriverName(): StorageDriverName {
  return process.env.STORAGE_DRIVER === "r2" ? "r2" : "gcs";
}

const driver = activeDriverName() === "r2" ? r2 : gcs;

// Re-exported individually rather than `export *` so the two drivers
// are checked against each other at compile time: a function missing
// from either side is a type error here, not a runtime surprise in
// production.
export const getDownloadUrl = driver.getDownloadUrl;
export const getSignedUploadUrl = driver.getSignedUploadUrl;
export const getObjectSize = driver.getObjectSize;
export const listUploadedParts = driver.listUploadedParts;
export const composeFiles = driver.composeFiles;
export const composeMany = driver.composeMany;
export const deleteFile = driver.deleteFile;
export const deleteByPrefix = driver.deleteByPrefix;
export const checkStorageHealth = driver.checkStorageHealth;
export const isDirectUploadAllowed = driver.isDirectUploadAllowed;

/**
 * Read an object as a stream.
 *
 * The drivers differ here and the signature is the union: GCS returns a
 * stream synchronously, R2 returns a promise for one. Callers must
 * `await` — awaiting a non-promise is harmless, so one call site works
 * for both.
 */
export function getFileStream(key: string): Promise<Readable> {
  return Promise.resolve(driver.getFileStream(key) as Readable);
}
