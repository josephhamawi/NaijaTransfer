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

export async function getDownloadUrl(key: string, expiresInMs: number = 5 * 60 * 1000, filename?: string): Promise<string> {
  const file = bucket().file(key);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInMs,
    ...(filename && { responseDisposition: `attachment; filename="${encodeURIComponent(filename)}"` }),
  });
  return url;
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
