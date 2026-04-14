import { getDb, collection } from "@/lib/firebase-admin";
import { generateShortCode } from "@/lib/nanoid";
import { getTierLimits } from "@/lib/tier-limits";
import { deleteByPrefix } from "@/lib/storage";
import bcrypt from "bcryptjs";
import type { UserTier } from "@/types/enums";

export interface TransferDoc {
  id: string;
  shortCode: string;
  userId: string | null;
  type: "LINK" | "EMAIL";
  status: string;
  message: string | null;
  senderEmail: string | null;
  recipientEmails: string[];
  passwordHash: string | null;
  expiresAt: Date;
  downloadLimit: number;
  downloadCount: number;
  totalSizeBytes: number;
  tier: string;
  showAds: boolean;
  createdAt: Date;
  files?: FileDoc[];
}

export interface FileDoc {
  id: string;
  transferId: string;
  filename: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  storageKey: string;
  previewKey: string | null;
  createdAt: Date;
}

interface CreateTransferInput {
  userId?: string;
  tier: UserTier;
  senderEmail?: string;
  recipientEmails?: string[];
  message?: string;
  passwordPlain?: string;
  expiryDays?: number;
  downloadLimit?: number;
}

export async function createTransfer(input: CreateTransferInput): Promise<TransferDoc> {
  const limits = getTierLimits(input.tier);

  if (input.userId) {
    const canCreate = await checkDailyTransferLimit(input.userId, input.tier);
    if (!canCreate) throw new Error("DAILY_LIMIT_REACHED");
  }

  const expiryDays = Math.min(input.expiryDays ?? limits.defaultExpiryDays, limits.maxExpiryDays);
  const downloadLimit = input.downloadLimit
    ? (limits.maxDownloadLimit ? Math.min(input.downloadLimit, limits.maxDownloadLimit) : input.downloadLimit)
    : limits.defaultDownloadLimit;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  let passwordHash: string | null = null;
  if (input.passwordPlain) {
    passwordHash = await bcrypt.hash(input.passwordPlain, 10);
  }

  const shortCode = await generateShortCode();
  const ref = collection("transfers").doc();

  const transfer: Omit<TransferDoc, "id" | "files"> = {
    shortCode,
    userId: input.userId ?? null,
    type: input.recipientEmails?.length ? "EMAIL" : "LINK",
    status: "ACTIVE",
    message: input.message ?? null,
    senderEmail: input.senderEmail ?? null,
    recipientEmails: input.recipientEmails ?? [],
    passwordHash,
    expiresAt,
    downloadLimit,
    downloadCount: 0,
    totalSizeBytes: 0,
    tier: input.tier,
    showAds: limits.showAds,
    createdAt: new Date(),
  };

  // Seed the atomic quota counters used by /api/upload/file. Keeping
  // them on the transfer doc means a single-doc transaction can assert
  // the cap and reserve a slot without reading the entire files
  // subcollection.
  const transferWithCounters = {
    ...transfer,
    uploadedFileCount: 0,
    uploadedSizeBytes: 0,
  };

  await ref.set(transferWithCounters);
  return { ...transfer, id: ref.id, files: [] };
}

export async function getTransferByCode(shortCode: string): Promise<TransferDoc | null> {
  const snap = await collection("transfers").where("shortCode", "==", shortCode).limit(1).get();
  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data();
  const transfer = docToTransfer(doc.id, data);

  if (transfer.status === "DELETED") return null;
  if (transfer.expiresAt < new Date()) {
    await doc.ref.update({ status: "EXPIRED" });
    return null;
  }

  // Load files subcollection
  const filesSnap = await doc.ref.collection("files").orderBy("createdAt").get();
  transfer.files = filesSnap.docs.map((f) => ({ id: f.id, ...f.data() } as FileDoc));

  return transfer;
}

export async function deleteTransfer(transferId: string, userId: string): Promise<boolean> {
  const ref = collection("transfers").doc(transferId);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;

  await deleteByPrefix(`transfers/${transferId}/`);

  // Delete files subcollection
  const filesSnap = await ref.collection("files").get();
  const batch = getDb().batch();
  filesSnap.docs.forEach((f) => batch.delete(f.ref));
  batch.delete(ref);
  await batch.commit();

  return true;
}

export async function validateDownloadAccess(
  shortCode: string,
  password?: string
): Promise<{ valid: boolean; error?: string; transfer?: TransferDoc }> {
  const transfer = await getTransferByCode(shortCode);
  if (!transfer) return { valid: false, error: "TRANSFER_NOT_FOUND" };
  if (transfer.expiresAt < new Date()) return { valid: false, error: "TRANSFER_EXPIRED" };
  if (transfer.downloadLimit && transfer.downloadCount >= transfer.downloadLimit) {
    return { valid: false, error: "DOWNLOAD_LIMIT_REACHED" };
  }
  if (transfer.passwordHash) {
    if (!password) return { valid: false, error: "PASSWORD_REQUIRED" };
    const match = await bcrypt.compare(password, transfer.passwordHash);
    if (!match) return { valid: false, error: "INVALID_PASSWORD" };
  }
  return { valid: true, transfer };
}

export async function incrementDownloadCount(
  transferId: string,
  ip: string,
  userAgent: string,
  fileId?: string
): Promise<boolean> {
  const ref = collection("transfers").doc(transferId);
  const doc = await ref.get();
  if (!doc.exists) return false;

  const data = doc.data()!;
  if (data.downloadLimit && data.downloadCount >= data.downloadLimit) return false;

  await ref.update({
    downloadCount: (data.downloadCount || 0) + 1,
  });

  // Log download
  await getDb().collection("downloadLogs").add({
    transferId,
    fileId: fileId ?? null,
    ipHash: Buffer.from(ip).toString("base64").slice(0, 20),
    userAgent: (userAgent || "").slice(0, 500),
    downloadedAt: new Date(),
  });

  return true;
}

export async function getUserTransfers(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ transfers: TransferDoc[]; total: number }> {
  const query = collection("transfers")
    .where("userId", "==", userId)
    .where("status", "!=", "DELETED")
    .orderBy("createdAt", "desc");

  const countSnap = await query.count().get();
  const total = countSnap.data().count;

  const snap = await query.offset((page - 1) * limit).limit(limit).get();
  const transfers: TransferDoc[] = [];

  for (const doc of snap.docs) {
    const t = docToTransfer(doc.id, doc.data());
    const filesSnap = await doc.ref.collection("files").get();
    t.files = filesSnap.docs.map((f) => ({ id: f.id, ...f.data() } as FileDoc));
    transfers.push(t);
  }

  return { transfers, total };
}

export async function updateTransferSettings(
  transferId: string,
  userId: string,
  data: { expiryDays?: number; downloadLimit?: number; password?: string | null }
): Promise<TransferDoc | null> {
  const ref = collection("transfers").doc(transferId);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.userId !== userId) return null;

  const updates: Record<string, unknown> = {};
  const docData = doc.data()!;

  if (data.expiryDays !== undefined) {
    const newExpiry = new Date(docData.createdAt.toDate());
    newExpiry.setDate(newExpiry.getDate() + data.expiryDays);
    updates.expiresAt = newExpiry;
  }
  if (data.downloadLimit !== undefined) {
    updates.downloadLimit = data.downloadLimit;
  }
  if (data.password !== undefined) {
    updates.passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;
  }

  await ref.update(updates);
  return getTransferByCode(docData.shortCode);
}

export async function checkDailyTransferLimit(userId: string, tier: UserTier): Promise<boolean> {
  const limits = getTierLimits(tier);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const snap = await collection("transfers")
    .where("userId", "==", userId)
    .where("createdAt", ">=", startOfDay)
    .count()
    .get();

  return snap.data().count < limits.dailyTransferLimit;
}

function docToTransfer(id: string, data: FirebaseFirestore.DocumentData): TransferDoc {
  return {
    id,
    shortCode: data.shortCode,
    userId: data.userId,
    type: data.type,
    status: data.status,
    message: data.message,
    senderEmail: data.senderEmail,
    recipientEmails: data.recipientEmails || [],
    passwordHash: data.passwordHash,
    expiresAt: data.expiresAt?.toDate?.() ?? new Date(data.expiresAt),
    downloadLimit: data.downloadLimit,
    downloadCount: data.downloadCount || 0,
    totalSizeBytes: data.totalSizeBytes || 0,
    tier: data.tier,
    showAds: data.showAds ?? true,
    createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt),
    files: [],
  };
}
