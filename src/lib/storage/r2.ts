/**
 * Cloudflare R2 driver.
 *
 * ── Why this exists ──────────────────────────────────────────────────
 * Egress. Cloud Storage bills roughly $0.12 per GB downloaded, which on
 * a file-transfer product is the dominant cost and the one that scales
 * with success rather than with revenue: a PRO subscriber paying ₦2,000
 * (about $1.27 net) who fills their 50 GB quota and has it downloaded
 * once costs about $6.47 to serve. R2 charges $0 for egress, which
 * turns that same customer into roughly $0.35 of storage and nothing
 * else.
 *
 * Only file BYTES move. Auth, Firestore, Hosting and Live Send
 * signalling all stay on Firebase.
 *
 * ── The compose problem, and why the client did not change ───────────
 * The upload flow splits a large file into parts, uploads each part
 * straight from the browser to object storage, and then stitches them
 * server-side. On GCS that last step is `compose`, which R2 has no
 * equivalent of.
 *
 * The obvious alternative — real S3 multipart uploads — would work, but
 * it changes the browser protocol: each `UploadPart` returns an ETag
 * that the client must collect and hand back at completion. That is a
 * change to the upload engine, its tests, and the CORS policy.
 *
 * Instead this uses multipart with `UploadPartCopy`: the parts are
 * uploaded as ordinary objects exactly as before, and the stitch
 * creates a multipart upload whose parts are server-side COPIES of
 * those objects. No bytes pass through the app, no ETag round-trip
 * reaches the browser, and `src/lib/upload-client.ts` is untouched.
 *
 * Constraint that comes with it: every copied part except the last must
 * be at least 5 MiB. PART_SIZE in upload-parts.ts is 16 MiB, so this
 * holds — but it is a real coupling, which is why MIN_COPY_PART_BYTES
 * is asserted below rather than assumed.
 */

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetBucketCorsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCopyCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";

/** S3 forbids copied multipart parts smaller than this, except the last. */
const MIN_COPY_PART_BYTES = 5 * 1024 * 1024;

let client: S3Client | null = null;

function s3(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 driver selected but R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY are not set."
    );
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

function bucketName(): string {
  const name = process.env.R2_BUCKET_NAME;
  if (!name) throw new Error("R2 driver selected but R2_BUCKET_NAME is not set.");
  return name;
}

// ─── Reads ───────────────────────────────────────────────────────────

export async function getDownloadUrl(
  key: string,
  expiresInMs: number = 5 * 60 * 1000,
  filename?: string
): Promise<string> {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: bucketName(),
      Key: key,
      ...(filename && {
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
      }),
    }),
    { expiresIn: Math.max(1, Math.floor(expiresInMs / 1000)) }
  );
}

export function getFileStream(key: string) {
  // Returns a promise-wrapped stream rather than a stream, so callers
  // that pipe it must await. archiver accepts a stream, so the zip path
  // awaits this before appending.
  return s3()
    .send(new GetObjectCommand({ Bucket: bucketName(), Key: key }))
    .then((res) => res.Body as Readable);
}

export async function getObjectSize(key: string): Promise<number | null> {
  try {
    const head = await s3().send(
      new HeadObjectCommand({ Bucket: bucketName(), Key: key })
    );
    return Number(head.ContentLength ?? 0);
  } catch {
    return null;
  }
}

export async function checkStorageHealth(): Promise<boolean> {
  try {
    await s3().send(new HeadBucketCommand({ Bucket: bucketName() }));
    return true;
  } catch {
    return false;
  }
}

// ─── Writes ──────────────────────────────────────────────────────────

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresInMs: number = 12 * 60 * 60 * 1000
): Promise<string | null> {
  try {
    return await getSignedUrl(
      s3(),
      new PutObjectCommand({ Bucket: bucketName(), Key: key, ContentType: contentType }),
      { expiresIn: Math.max(1, Math.floor(expiresInMs / 1000)) }
    );
  } catch (err) {
    console.error("R2 getSignedUploadUrl failed:", err);
    return null;
  }
}

export async function deleteFile(key: string): Promise<void> {
  try {
    await s3().send(new DeleteObjectCommand({ Bucket: bucketName(), Key: key }));
  } catch (error: unknown) {
    // A missing object is the desired end state, not a failure.
    const name = (error as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") return;
    throw error;
  }
}

export async function deleteByPrefix(prefix: string): Promise<number> {
  let deleted = 0;
  let token: string | undefined;

  do {
    const list = await s3().send(
      new ListObjectsV2Command({
        Bucket: bucketName(),
        Prefix: prefix,
        ContinuationToken: token,
      })
    );

    const keys = (list.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => Boolean(k));

    if (keys.length > 0) {
      // DeleteObjects takes up to 1000 keys per call, which matches the
      // page size ListObjectsV2 returns.
      await s3().send(
        new DeleteObjectsCommand({
          Bucket: bucketName(),
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        })
      );
      deleted += keys.length;
    }

    token = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (token);

  return deleted;
}

export async function listUploadedParts(partPrefix: string): Promise<number[]> {
  try {
    const parts: number[] = [];
    let token: string | undefined;

    do {
      const list = await s3().send(
        new ListObjectsV2Command({
          Bucket: bucketName(),
          Prefix: partPrefix,
          ContinuationToken: token,
        })
      );
      for (const obj of list.Contents ?? []) {
        const n = Number(obj.Key?.slice(partPrefix.length));
        if (Number.isInteger(n) && n >= 1) parts.push(n);
      }
      token = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (token);

    return parts.sort((a, b) => a - b);
  } catch {
    return [];
  }
}

// ─── Compose, via multipart UploadPartCopy ───────────────────────────

/**
 * Stitch `sourceKeys` into one object at `destinationKey`.
 *
 * Server-side throughout: `UploadPartCopy` tells R2 to copy bytes it
 * already holds into a part of a new multipart upload, so nothing is
 * downloaded and re-uploaded.
 *
 * A failed stitch aborts the multipart upload. Without that, R2 keeps
 * the uploaded parts and bills for them indefinitely while no object
 * exists to show for it.
 */
export async function composeFiles(
  destinationKey: string,
  sourceKeys: string[],
  contentType: string
): Promise<string> {
  const Bucket = bucketName();

  if (sourceKeys.length === 0) {
    throw new Error("composeFiles called with no sources");
  }

  // One source needs no multipart at all — a plain server-side copy is
  // cheaper and has no 5 MiB floor, which matters for small files.
  if (sourceKeys.length === 1) {
    const { CopyObjectCommand } = await import("@aws-sdk/client-s3");
    await s3().send(
      new CopyObjectCommand({
        Bucket,
        Key: destinationKey,
        CopySource: `${Bucket}/${sourceKeys[0]}`,
        ContentType: contentType,
        MetadataDirective: "REPLACE",
      })
    );
    return destinationKey;
  }

  const created = await s3().send(
    new CreateMultipartUploadCommand({
      Bucket,
      Key: destinationKey,
      ContentType: contentType,
    })
  );
  const uploadId = created.UploadId;
  if (!uploadId) throw new Error("R2 did not return an UploadId");

  try {
    const parts: Array<{ ETag: string; PartNumber: number }> = [];

    for (let i = 0; i < sourceKeys.length; i++) {
      const copied = await s3().send(
        new UploadPartCopyCommand({
          Bucket,
          Key: destinationKey,
          UploadId: uploadId,
          PartNumber: i + 1,
          CopySource: `${Bucket}/${sourceKeys[i]}`,
        })
      );
      const etag = copied.CopyPartResult?.ETag;
      if (!etag) throw new Error(`No ETag copying part ${i + 1}`);
      parts.push({ ETag: etag, PartNumber: i + 1 });
    }

    await s3().send(
      new CompleteMultipartUploadCommand({
        Bucket,
        Key: destinationKey,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      })
    );

    return destinationKey;
  } catch (err) {
    // Abandoned multipart uploads are billed storage that no listing
    // will show. Always clean up.
    await s3()
      .send(
        new AbortMultipartUploadCommand({
          Bucket,
          Key: destinationKey,
          UploadId: uploadId,
        })
      )
      .catch(() => {});
    throw err;
  }
}

/**
 * Same as composeFiles. GCS caps compose at 32 sources and needed
 * tiering; S3 multipart allows 10,000 parts, so one pass is enough.
 */
export async function composeMany(
  destinationKey: string,
  sourceKeys: string[],
  contentType: string
): Promise<string> {
  if (sourceKeys.length > 10_000) {
    throw new Error(
      `Cannot compose ${sourceKeys.length} parts: S3 multipart allows at most 10,000.`
    );
  }
  return composeFiles(destinationKey, sourceKeys, contentType);
}

/** Exported so the upload planner can assert its part size stays legal. */
export const MIN_MULTIPART_COPY_BYTES = MIN_COPY_PART_BYTES;

// ─── CORS ────────────────────────────────────────────────────────────

let corsCache: { at: number; origins: Record<string, boolean> } | null = null;

/**
 * Whether the bucket advertises browser PUTs from `origin`.
 *
 * Same contract as the GCS driver: `/api/upload/file/batch-init` refuses
 * to mint signed URLs when this is false, so a bucket without a CORS
 * rule fails loudly in one place instead of as an opaque browser error
 * on every upload.
 */
export async function isDirectUploadAllowed(origin: string): Promise<boolean> {
  const now = Date.now();
  if (corsCache && now - corsCache.at < 5 * 60 * 1000) {
    if (origin in corsCache.origins) return corsCache.origins[origin];
  } else {
    corsCache = { at: now, origins: {} };
  }

  let ok = false;
  try {
    const cors = await s3().send(new GetBucketCorsCommand({ Bucket: bucketName() }));
    ok = (cors.CORSRules ?? []).some(
      (rule) =>
        (rule.AllowedOrigins ?? []).some((o) => o === "*" || o === origin) &&
        (rule.AllowedMethods ?? []).some((m) => m === "*" || m.toUpperCase() === "PUT")
    );
  } catch (err) {
    console.error("R2 CORS probe failed:", err);
    ok = false;
  }

  corsCache.origins[origin] = ok;
  return ok;
}
