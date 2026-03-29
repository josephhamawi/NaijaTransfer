import { db } from "@/lib/db";
import { uploadToR2, deleteFromR2, getPresignedDownloadUrl, getR2Client } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import archiver from "archiver";
import type { File as PrismaFile } from "@prisma/client";

export async function getTransferFiles(transferId: string): Promise<PrismaFile[]> {
  return db.file.findMany({
    where: { transferId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createFile(
  transferId: string,
  data: {
    filename: string;
    originalName: string;
    sizeBytes: number | bigint;
    mimeType: string;
    r2Key: string;
    checksum?: string;
  }
): Promise<PrismaFile> {
  const file = await db.file.create({
    data: {
      transferId,
      filename: data.filename,
      originalName: data.originalName,
      sizeBytes: BigInt(data.sizeBytes),
      mimeType: data.mimeType,
      r2Key: data.r2Key,
      checksum: data.checksum ?? null,
    },
  });

  // Update transfer total size
  const totalSize = await db.file.aggregate({
    where: { transferId },
    _sum: { sizeBytes: true },
  });

  await db.transfer.update({
    where: { id: transferId },
    data: { totalSizeBytes: totalSize._sum.sizeBytes ?? 0 },
  });

  return file;
}

export async function getFileById(fileId: string): Promise<PrismaFile | null> {
  return db.file.findUnique({ where: { id: fileId } });
}

export async function getFileDownloadUrl(
  fileId: string,
  expiresIn: number = 300
): Promise<{ url: string; filename: string } | null> {
  const file = await db.file.findUnique({ where: { id: fileId } });
  if (!file) return null;

  const url = await getPresignedDownloadUrl(file.r2Key, expiresIn, file.originalName);
  return { url, filename: file.originalName };
}

export async function streamZipDownload(
  transferId: string
): Promise<{ stream: archiver.Archiver; totalSize: number } | null> {
  const files = await getTransferFiles(transferId);
  if (files.length === 0) return null;

  const archive = archiver("zip", { zlib: { level: 1 } }); // fast compression
  const client = getR2Client();

  let totalSize = 0;
  for (const file of files) {
    totalSize += Number(file.sizeBytes);
    const response = await client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: file.r2Key,
      })
    );

    if (response.Body) {
      const stream = response.Body as Readable;
      archive.append(stream, { name: file.originalName });
    }
  }

  archive.finalize();
  return { stream: archive, totalSize };
}

export async function deleteTransferFiles(transferId: string): Promise<number> {
  const files = await getTransferFiles(transferId);
  let deleted = 0;

  for (const file of files) {
    try {
      await deleteFromR2(file.r2Key);
      deleted++;
    } catch {
      console.error(`Failed to delete R2 object: ${file.r2Key}`);
    }
  }

  await db.file.deleteMany({ where: { transferId } });
  return deleted;
}

export async function generateThumbnail(
  r2Key: string,
  mimeType: string
): Promise<string | null> {
  if (!mimeType.startsWith("image/")) return null;

  try {
    const sharp = (await import("sharp")).default;
    const client = getR2Client();

    const response = await client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
      })
    );

    if (!response.Body) return null;

    const chunks: Uint8Array[] = [];
    const stream = response.Body as Readable;
    for await (const chunk of stream) {
      chunks.push(chunk as Uint8Array);
    }
    const buffer = Buffer.concat(chunks);

    const thumbnail = await sharp(buffer)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();

    const previewKey = r2Key.replace(/^transfers\//, "previews/") + ".preview.jpg";
    await uploadToR2(previewKey, thumbnail, "image/jpeg");

    await db.file.updateMany({
      where: { r2Key },
      data: { r2PreviewKey: previewKey },
    });

    return previewKey;
  } catch (error) {
    console.error("Thumbnail generation failed:", error);
    return null;
  }
}
