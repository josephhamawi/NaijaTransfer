import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getStorageBucket } from "./firebase-admin";

function bucket() {
  return getStorageBucket().bucket(
    process.env.FIREBASE_STORAGE_BUCKET || "naijatransfer.firebasestorage.app"
  );
}

export async function uploadFile(key: string, data: Buffer, contentType: string): Promise<string> {
  const file = bucket().file(key);
  await file.save(data, { contentType, resumable: false });
  return key;
}

/**
 * Stream an upload directly to Firebase/GCS without buffering in memory.
 * Accepts either a Node Readable or a WHATWG ReadableStream (what Next.js
 * request.body is). Uses a resumable GCS upload so large files aren't held
 * in the Node process — memory stays flat regardless of file size.
 *
 * This replaces the previous `file.arrayBuffer() → Buffer → file.save()`
 * path, which loaded the entire file into memory and OOM-killed Node
 * workers on multi-GB uploads (which the client then reported as
 * "Connection lost").
 */
export async function uploadFileStream(
  key: string,
  source: Readable | ReadableStream<Uint8Array>,
  contentType: string
): Promise<string> {
  const file = bucket().file(key);
  const readable =
    source instanceof Readable ? source : Readable.fromWeb(source as never);
  const writable = file.createWriteStream({
    contentType,
    resumable: true,
    // 8 MiB chunks is the GCS default for resumable uploads; keep it
    // explicit so behavior is predictable.
    chunkSize: 8 * 1024 * 1024,
  });
  await pipeline(readable, writable);
  return key;
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
 * GCS Compose. Used by the multipart-upload `/complete` endpoint to
 * stitch parallel parts back into the original file.
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
