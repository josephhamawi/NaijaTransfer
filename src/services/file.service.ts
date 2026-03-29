import { collection } from "@/lib/firebase-admin";
import { uploadFile, deleteFile, getDownloadUrl, getFileStream } from "@/lib/storage";
import archiver from "archiver";
import type { FileDoc } from "./transfer.service";

export async function createFile(
  transferId: string,
  data: {
    filename: string;
    originalName: string;
    sizeBytes: number;
    mimeType: string;
    storageKey: string;
  }
): Promise<FileDoc> {
  const ref = collection("transfers").doc(transferId).collection("files").doc();

  const file: Omit<FileDoc, "id"> = {
    transferId,
    filename: data.filename,
    originalName: data.originalName,
    sizeBytes: data.sizeBytes,
    mimeType: data.mimeType,
    storageKey: data.storageKey,
    previewKey: null,
    createdAt: new Date(),
  };

  await ref.set(file);

  // Update transfer total size
  const filesSnap = await collection("transfers").doc(transferId).collection("files").get();
  const totalSize = filesSnap.docs.reduce((sum, d) => sum + (d.data().sizeBytes || 0), 0);
  await collection("transfers").doc(transferId).update({ totalSizeBytes: totalSize });

  return { ...file, id: ref.id };
}

export async function getFileById(transferId: string, fileId: string): Promise<FileDoc | null> {
  const doc = await collection("transfers").doc(transferId).collection("files").doc(fileId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as FileDoc;
}

export async function getTransferFiles(transferId: string): Promise<FileDoc[]> {
  const snap = await collection("transfers").doc(transferId).collection("files").orderBy("createdAt").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FileDoc));
}

export async function getFileDownloadUrl(
  storageKey: string,
  originalName: string,
  expiresInMs: number = 5 * 60 * 1000
): Promise<string> {
  return getDownloadUrl(storageKey, expiresInMs, originalName);
}

export async function streamZipDownload(
  transferId: string
): Promise<{ stream: archiver.Archiver; totalSize: number } | null> {
  const files = await getTransferFiles(transferId);
  if (files.length === 0) return null;

  const archive = archiver("zip", { zlib: { level: 1 } });
  let totalSize = 0;

  for (const file of files) {
    totalSize += file.sizeBytes;
    const stream = getFileStream(file.storageKey);
    archive.append(stream, { name: file.originalName });
  }

  archive.finalize();
  return { stream: archive, totalSize };
}

export async function deleteTransferFiles(transferId: string): Promise<number> {
  const files = await getTransferFiles(transferId);
  let deleted = 0;
  for (const file of files) {
    try {
      await deleteFile(file.storageKey);
      deleted++;
    } catch {
      console.error(`Failed to delete storage: ${file.storageKey}`);
    }
  }
  return deleted;
}

export async function generateThumbnail(
  storageKey: string,
  mimeType: string
): Promise<string | null> {
  if (!mimeType.startsWith("image/")) return null;
  // TODO: Implement thumbnail generation with sharp
  // For now, return null — previews will show file type icons
  return null;
}
