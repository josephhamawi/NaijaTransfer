import { storage } from "./firebase-admin";

const bucket = storage.bucket();

/**
 * Upload a file to Firebase Storage.
 */
export async function uploadFile(
  key: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const file = bucket.file(key);
  await file.save(data, { contentType, resumable: false });
  return key;
}

/**
 * Generate a signed download URL (expires in 5 minutes by default).
 */
export async function getDownloadUrl(
  key: string,
  expiresInMs: number = 5 * 60 * 1000,
  filename?: string
): Promise<string> {
  const file = bucket.file(key);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInMs,
    ...(filename && {
      responseDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    }),
  });
  return url;
}

/**
 * Delete a file from Firebase Storage.
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    await bucket.file(key).delete();
  } catch (error: unknown) {
    // Ignore "not found" errors
    if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 404) return;
    throw error;
  }
}

/**
 * Delete all files with a given prefix.
 */
export async function deleteByPrefix(prefix: string): Promise<number> {
  const [files] = await bucket.getFiles({ prefix });
  let count = 0;
  for (const file of files) {
    await file.delete();
    count++;
  }
  return count;
}

/**
 * Get a readable stream for a file (for ZIP downloads).
 */
export function getFileStream(key: string) {
  return bucket.file(key).createReadStream();
}

/**
 * Check if Firebase Storage is accessible.
 */
export async function checkStorageHealth(): Promise<boolean> {
  try {
    await bucket.getMetadata();
    return true;
  } catch {
    return false;
  }
}
