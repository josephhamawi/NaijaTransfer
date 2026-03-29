import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 client using S3-compatible API.
 * Used for file storage (uploads) and backup storage (DB dumps).
 */

function createR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

// Singleton R2 client
let r2Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = createR2Client();
  }
  return r2Client;
}

/**
 * Upload a file to R2.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | ReadableStream | Uint8Array,
  contentType: string,
  bucket?: string
): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket || process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/**
 * Generate a presigned download URL for a file on R2.
 * Default expiry: 5 minutes (300 seconds).
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 300,
  filename?: string
): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ...(filename && {
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
    }),
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from R2.
 */
export async function deleteFromR2(key: string, bucket?: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket || process.env.R2_BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Delete multiple files from R2 by prefix.
 * Lists all objects with the prefix and deletes them individually.
 */
export async function deleteByPrefix(prefix: string, bucket?: string): Promise<number> {
  const client = getR2Client();
  const bucketName = bucket || process.env.R2_BUCKET_NAME;

  const listResponse = await client.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    })
  );

  const objects = listResponse.Contents || [];
  let deletedCount = 0;

  for (const obj of objects) {
    if (obj.Key) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: obj.Key,
        })
      );
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Check R2 connectivity by performing a HEAD request on the bucket.
 * Used by the health check endpoint.
 */
export async function checkR2Connectivity(): Promise<boolean> {
  try {
    const client = getR2Client();
    // Try to head a non-existent object -- the request succeeding (even with 404)
    // proves connectivity. We catch the NoSuchKey error as a success.
    await client.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: "__health_check__",
      })
    );
    return true;
  } catch (error: unknown) {
    // A 404 (NoSuchKey / NotFound) means we connected to R2 successfully
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      (error.name === "NotFound" || error.name === "NoSuchKey")
    ) {
      return true;
    }
    return false;
  }
}
