/**
 * File requests in Firestore.
 *
 * A file request is a portal someone else uploads into while the owner
 * is away. That is asynchronous storage by definition, so it is a paid
 * feature — the plan check lives in the routes, keyed on the request
 * OWNER rather than the uploader, since the owner's plan is what pays
 * for the bytes.
 *
 * Replaces the Prisma `file_requests` and `file_request_uploads`
 * tables, with uploads as a subcollection so a request and its
 * submissions are read and deleted together.
 */

import { getDb } from "@/lib/firebase-admin";
import { generateRequestCode } from "@/lib/nanoid";

export const FILE_REQUESTS = "fileRequests";
export const UPLOADS = "uploads";

export interface FileRequestDoc {
  id: string;
  uid: string;
  shortCode: string;
  title: string;
  message: string | null;
  status: "OPEN" | "CLOSED";
  maxUploads: number | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileRequestUploadDoc {
  id: string;
  uploaderName: string | null;
  uploaderEmail: string | null;
  transferId: string;
  uploadedAt: Date;
}

type Db = ReturnType<typeof getDb>;

function db(injected?: unknown): Db {
  return (injected as Db) ?? getDb();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const maybe = value as { toDate?: () => Date };
  return typeof maybe.toDate === "function" ? maybe.toDate() : new Date(String(value));
}

function docToRequest(id: string, data: Record<string, unknown>): FileRequestDoc {
  return {
    id,
    uid: String(data.uid ?? ""),
    shortCode: String(data.shortCode ?? ""),
    title: String(data.title ?? ""),
    message: (data.message as string) ?? null,
    status: (data.status as "OPEN" | "CLOSED") ?? "OPEN",
    maxUploads: data.maxUploads === null || data.maxUploads === undefined
      ? null
      : Number(data.maxUploads),
    expiresAt: toDate(data.expiresAt),
    createdAt: toDate(data.createdAt) ?? new Date(0),
    updatedAt: toDate(data.updatedAt) ?? new Date(0),
  };
}

export async function createFileRequest(
  uid: string,
  input: { title: string; message?: string | null },
  injected?: unknown
): Promise<FileRequestDoc> {
  const now = new Date();
  const ref = db(injected).collection(FILE_REQUESTS).doc();
  const data = {
    uid,
    shortCode: await generateRequestCode(),
    title: input.title,
    message: input.message ?? null,
    status: "OPEN" as const,
    maxUploads: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(data);
  return docToRequest(ref.id, data);
}

export async function getFileRequestByCode(
  shortCode: string,
  injected?: unknown
): Promise<FileRequestDoc | null> {
  const snap = await db(injected)
    .collection(FILE_REQUESTS)
    .where("shortCode", "==", shortCode)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return docToRequest(snap.docs[0].id, snap.docs[0].data() ?? {});
}

/** Fetch by id, scoped to an owner so one user cannot read another's. */
export async function getOwnedFileRequest(
  id: string,
  uid: string,
  injected?: unknown
): Promise<FileRequestDoc | null> {
  const snap = await db(injected).collection(FILE_REQUESTS).doc(id).get();
  if (!snap.exists) return null;
  const request = docToRequest(snap.id, snap.data() ?? {});
  return request.uid === uid ? request : null;
}

export async function listUserFileRequests(
  uid: string,
  injected?: unknown
): Promise<Array<FileRequestDoc & { uploadCount: number }>> {
  const snap = await db(injected)
    .collection(FILE_REQUESTS)
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  // One aggregation per request rather than reading every upload: the
  // list view only needs the count.
  return Promise.all(
    snap.docs.map(async (doc) => {
      const count = await doc.ref.collection(UPLOADS).count().get();
      return {
        ...docToRequest(doc.id, doc.data() ?? {}),
        uploadCount: count.data().count,
      };
    })
  );
}

export async function listUploads(
  requestId: string,
  injected?: unknown
): Promise<FileRequestUploadDoc[]> {
  const snap = await db(injected)
    .collection(FILE_REQUESTS)
    .doc(requestId)
    .collection(UPLOADS)
    .orderBy("uploadedAt", "desc")
    .get();

  return snap.docs.map((d) => {
    const data = d.data() ?? {};
    return {
      id: d.id,
      uploaderName: (data.uploaderName as string) ?? null,
      uploaderEmail: (data.uploaderEmail as string) ?? null,
      transferId: String(data.transferId ?? ""),
      uploadedAt: toDate(data.uploadedAt) ?? new Date(0),
    };
  });
}

export async function recordUpload(
  requestId: string,
  input: { uploaderName?: string | null; uploaderEmail?: string | null; transferId: string },
  injected?: unknown
): Promise<string> {
  const ref = db(injected)
    .collection(FILE_REQUESTS)
    .doc(requestId)
    .collection(UPLOADS)
    .doc();
  await ref.set({
    uploaderName: input.uploaderName ?? null,
    uploaderEmail: input.uploaderEmail ?? null,
    transferId: input.transferId,
    uploadedAt: new Date(),
  });
  return ref.id;
}

/** Close a request. Returns false when it is not this user's. */
export async function closeFileRequest(
  id: string,
  uid: string,
  injected?: unknown
): Promise<boolean> {
  const ref = db(injected).collection(FILE_REQUESTS).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.uid !== uid) return false;
  await ref.update({ status: "CLOSED", updatedAt: new Date() });
  return true;
}
