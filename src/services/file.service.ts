import { collection } from "@/lib/firebase-admin";
import { deleteFile, getDownloadUrl, getFileStream } from "@/lib/storage";
import archiver from "archiver";
import type { FileDoc } from "./transfer.service";

/**
 * Strip path-traversal segments and absolute-path prefixes from an
 * uploader-controlled relative path. The result is safe to use as an
 * archive entry name (which some unzippers will treat as a filesystem
 * path on extract) while preserving folder structure for legitimate
 * uploads like "MyFolder/sub/file.txt".
 */
function safeRelativePath(input: string): string {
  const cleaned = input
    .replace(/\\/g, "/")
    .split("/")
    .filter((seg) => seg && seg !== "." && seg !== "..")
    .join("/");
  return cleaned || "file";
}

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
    originalName: safeRelativePath(data.originalName),
    sizeBytes: data.sizeBytes,
    mimeType: data.mimeType,
    storageKey: data.storageKey,
    previewKey: null,
    createdAt: new Date(),
  };

  await ref.set(file);

  // Mirror the authoritative uploadedSizeBytes counter into
  // totalSizeBytes for backward-compat with read paths that still use it.
  // The actual source of truth is the transfer doc counters maintained
  // transactionally by /api/upload/file.
  const transferSnap = await collection("transfers").doc(transferId).get();
  const uploadedBytes =
    (transferSnap.data()?.uploadedSizeBytes as number | undefined) ?? 0;
  await collection("transfers").doc(transferId).update({
    totalSizeBytes: uploadedBytes,
  });

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

/**
 * Stream a ZIP of files in a transfer. When `pathPrefix` is provided,
 * only files whose originalName starts with `${pathPrefix}/` are
 * included (used to download a single uploaded folder). The ZIP entries
 * are then re-rooted at the prefix so the user unzips into one folder.
 */
export async function streamZipDownload(
  transferId: string,
  pathPrefix?: string
): Promise<{ stream: archiver.Archiver; totalSize: number } | null> {
  const allFiles = await getTransferFiles(transferId);
  const files = pathPrefix
    ? allFiles.filter((f) => f.originalName.startsWith(`${pathPrefix}/`))
    : allFiles;
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
