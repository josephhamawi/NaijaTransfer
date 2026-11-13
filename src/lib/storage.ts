import { getStorageBucket } from "./firebase-admin";

function bucket() {
  return getStorageBucket().bucket(
    process.env.FIREBASE_STORAGE_BUCKET || "naijatransfer.firebasestorage.app"
  );
}

export async function getDownloadUrl(key: string, expiresInMs: number = 5 * 60 * 1000, filename?: string): Promise<string> {
  const file = bucket().file(key);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInMs,
    ...(filename && { responseDisposition: `attachment; filename="${encodeURIComponent(filename)}"` }),
  });
  return url;
}

/**
 * Concatenate source objects into a single destination object using
 * GCS Compose. Used by `/api/upload/file/batch-complete` to stitch
 * parallel parts back into the original file.
 *
 * Compose requires ≥ 2 sources. For the degenerate 1-source case
 * (tiny file that only had one part) we do a simple copy instead.
 * All sources must live in the same bucket as the destination.
 */
export async function composeFiles(
  destinationKey: string,
  sourceKeys: string[],
  contentType: string
): Promise<string> {
  const b = bucket();
  const destination = b.file(destinationKey);

  if (sourceKeys.length === 1) {
    await b.file(sourceKeys[0]).copy(destination);
    await destination.setMetadata({ contentType });
    return destinationKey;
  }

  const sources = sourceKeys.map((k) => b.file(k));
  await b.combine(sources, destination);
  await destination.setMetadata({ contentType });
  return destinationKey;
}

export async function deleteFile(key: string): Promise<void> {
  try {
    await bucket().file(key).delete();
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 404) return;
    throw error;
  }
}

export async function deleteByPrefix(prefix: string): Promise<number> {
  const [files] = await bucket().getFiles({ prefix });
  let count = 0;
  for (const file of files) { await file.delete(); count++; }
  return count;
}

export function getFileStream(key: string) {
  return bucket().file(key).createReadStream();
}

export async function checkStorageHealth(): Promise<boolean> {
  try { await bucket().getMetadata(); return true; } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────
// Direct-to-storage (browser → GCS) upload support.
//
// The old path pushed every byte through the Next.js box: browser →
// Caddy (Hetzner) → Node → GCS resumable session. That is two WAN legs
// for the same bytes, a single-threaded Node process in the middle, and
// a GCS *resumable* session (extra round trips) even for a 40 KB file.
// It is also impossible on Cloud Run, which caps request bodies at
// 32 MiB — which is why this is now the only upload path.
//
// These helpers let the API hand the browser a short-lived signed PUT
// URL so the bytes take one hop straight into the bucket — the same
// shape WeTransfer/Dropbox use (presigned direct-to-object-storage).
// ─────────────────────────────────────────────────────────────────────

/**
 * V4-signed PUT URL for `key`. The client MUST send exactly
 * `Content-Type: <contentType>` or GCS rejects the signature.
 *
 * Returns null when the runtime cannot sign. On App Hosting that means
 * the Cloud Run service account is missing
 * `roles/iam.serviceAccountTokenCreator` on itself — without it the GCS
 * SDK has no private key and no IAM signBlob fallback. There is no proxy
 * upload path left, so callers must treat null as a hard failure.
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresInMs: number = 12 * 60 * 60 * 1000
): Promise<string | null> {
  try {
    const [url] = await bucket().file(key).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + expiresInMs,
      contentType,
    });
    return url;
  } catch (err) {
    console.error("getSignedUploadUrl failed:", err);
    return null;
  }
}

/** Size in bytes of an object, or null when it doesn't exist. */
export async function getObjectSize(key: string): Promise<number | null> {
  try {
    const [meta] = await bucket().file(key).getMetadata();
    return Number(meta.size ?? 0);
  } catch {
    return null;
  }
}

/**
 * Part numbers already present under a multipart upload's part prefix.
 * One list call replaces the per-chunk Firestore `arrayUnion` write the
 * old proxy path did, so resume costs a single round trip.
 */
export async function listUploadedParts(partPrefix: string): Promise<number[]> {
  try {
    const [files] = await bucket().getFiles({ prefix: partPrefix });
    return files
      .map((f) => Number(f.name.slice(partPrefix.length)))
      .filter((n) => Number.isInteger(n) && n >= 1)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/**
 * Compose any number of part objects into one destination.
 *
 * GCS `compose` accepts at most 32 sources per call, so wide uploads
 * are composed in tiers: groups of 32 into scratch objects, then the
 * scratch objects into the destination. Compose is a metadata-level
 * operation server-side — no bytes move across the network.
 */
export async function composeMany(
  destinationKey: string,
  sourceKeys: string[],
  contentType: string
): Promise<string> {
  const MAX_SOURCES = 32;
  if (sourceKeys.length <= MAX_SOURCES) {
    return composeFiles(destinationKey, sourceKeys, contentType);
  }

  const b = bucket();
  const scratch: string[] = [];
  for (let i = 0; i < sourceKeys.length; i += MAX_SOURCES) {
    const group = sourceKeys.slice(i, i + MAX_SOURCES);
    const scratchKey = `${destinationKey}.compose-${String(
      i / MAX_SOURCES
    ).padStart(4, "0")}`;
    await b.combine(
      group.map((k) => b.file(k)),
      b.file(scratchKey)
    );
    scratch.push(scratchKey);
  }

  try {
    await composeMany(destinationKey, scratch, contentType);
  } finally {
    await Promise.allSettled(scratch.map((k) => deleteFile(k)));
  }
  return destinationKey;
}

/**
 * Whether the bucket's CORS policy actually permits a browser PUT from
 * `origin`. A bucket that hasn't had `npm run storage:cors` applied
 * makes `/batch-init` return 503 with one clear server-side error,
 * instead of every user's browser failing on opaque CORS errors.
 *
 * Cached for 5 minutes — this sits on the hot path of every upload.
 */
let corsCache: { at: number; origins: Record<string, boolean> } | null = null;

export async function isDirectUploadAllowed(origin: string): Promise<boolean> {
  const now = Date.now();
  if (corsCache && now - corsCache.at < 5 * 60 * 1000) {
    if (origin in corsCache.origins) return corsCache.origins[origin];
  } else {
    corsCache = { at: now, origins: {} };
  }

  let ok = false;
  try {
    const [meta] = await bucket().getMetadata();
    const rules = (meta.cors ?? []) as Array<{
      origin?: string[];
      method?: string[];
    }>;
    ok = rules.some(
      (r) =>
        (r.origin ?? []).some((o) => o === "*" || o === origin) &&
        (r.method ?? []).some((m) => m === "*" || m.toUpperCase() === "PUT")
    );
  } catch (err) {
    console.error("CORS probe failed:", err);
    ok = false;
  }

  corsCache.origins[origin] = ok;
  return ok;
}
