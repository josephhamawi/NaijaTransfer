import { db } from "@/lib/db";
import { deleteByPrefix } from "@/lib/r2";
import { generateShortCode } from "@/lib/nanoid";
import { getTierLimits } from "@/lib/tier-limits";
import bcrypt from "bcryptjs";
import type { Transfer, Prisma } from "@prisma/client";
import type { UserTier } from "@/types/enums";

type TransferWithFiles = Prisma.TransferGetPayload<{ include: { files: true } }>;

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

export async function createTransfer(input: CreateTransferInput): Promise<Transfer> {
  const limits = getTierLimits(input.tier);

  // Check daily limit
  if (input.userId) {
    const canCreate = await checkDailyTransferLimit(input.userId, input.tier);
    if (!canCreate) {
      throw new Error("DAILY_LIMIT_REACHED");
    }
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

  return db.transfer.create({
    data: {
      shortCode,
      type: input.recipientEmails?.length ? "EMAIL" : "LINK",
      status: "ACTIVE",
      userId: input.userId ?? null,
      senderEmail: input.senderEmail ?? null,
      recipientEmails: JSON.stringify(input.recipientEmails ?? []),
      message: input.message ?? null,
      passwordHash,
      downloadLimit,
      downloadCount: 0,
      totalSizeBytes: 0,
      tier: input.tier,
      expiresAt,
    },
  });
}

export async function getTransferByCode(shortCode: string): Promise<TransferWithFiles | null> {
  const transfer = await db.transfer.findUnique({
    where: { shortCode },
    include: { files: true },
  });

  if (!transfer) return null;
  if (transfer.status === "DELETED") return null;
  if (transfer.expiresAt < new Date()) {
    await db.transfer.update({ where: { id: transfer.id }, data: { status: "EXPIRED" } });
    return null;
  }

  return transfer;
}

export async function deleteTransfer(transferId: string, userId: string): Promise<boolean> {
  const transfer = await db.transfer.findFirst({
    where: { id: transferId, userId },
  });
  if (!transfer) return false;

  // Delete files from R2
  await deleteByPrefix(`transfers/${transferId}/`);

  // Delete DB records
  await db.file.deleteMany({ where: { transferId } });
  await db.downloadLog.deleteMany({ where: { transferId } });
  await db.transfer.delete({ where: { id: transferId } });

  return true;
}

export async function validateDownloadAccess(
  shortCode: string,
  password?: string
): Promise<{ valid: boolean; error?: string; transfer?: TransferWithFiles }> {
  const transfer = await getTransferByCode(shortCode);

  if (!transfer) {
    return { valid: false, error: "TRANSFER_NOT_FOUND" };
  }

  if (transfer.expiresAt < new Date()) {
    return { valid: false, error: "TRANSFER_EXPIRED" };
  }

  if (transfer.downloadLimit && transfer.downloadCount >= transfer.downloadLimit) {
    return { valid: false, error: "DOWNLOAD_LIMIT_REACHED" };
  }

  if (transfer.passwordHash) {
    if (!password) {
      return { valid: false, error: "PASSWORD_REQUIRED" };
    }
    const match = await bcrypt.compare(password, transfer.passwordHash);
    if (!match) {
      return { valid: false, error: "INVALID_PASSWORD" };
    }
  }

  return { valid: true, transfer };
}

export async function incrementDownloadCount(
  transferId: string,
  ip: string,
  userAgent: string,
  fileId?: string
): Promise<boolean> {
  const transfer = await db.transfer.findUnique({ where: { id: transferId } });
  if (!transfer) return false;

  if (transfer.downloadLimit && transfer.downloadCount >= transfer.downloadLimit) {
    return false;
  }

  await db.$transaction([
    db.transfer.update({
      where: { id: transferId },
      data: { downloadCount: { increment: 1 } },
    }),
    db.downloadLog.create({
      data: {
        transferId,
        fileId: fileId ?? null,
        ipHash: Buffer.from(ip).toString("base64").slice(0, 20),
        userAgent: userAgent.slice(0, 500),
        country: null,
      },
    }),
  ]);

  return true;
}

export async function getUserTransfers(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ transfers: TransferWithFiles[]; total: number }> {
  const [transfers, total] = await Promise.all([
    db.transfer.findMany({
      where: { userId, status: { not: "DELETED" } },
      include: { files: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.transfer.count({ where: { userId, status: { not: "DELETED" } } }),
  ]);

  return { transfers, total };
}

export async function updateTransferSettings(
  transferId: string,
  userId: string,
  data: { expiryDays?: number; downloadLimit?: number; password?: string | null }
): Promise<Transfer | null> {
  const transfer = await db.transfer.findFirst({
    where: { id: transferId, userId },
    include: { user: true },
  });
  if (!transfer) return null;

  const tier = transfer.user?.tier ?? "FREE";
  const limits = getTierLimits(tier as UserTier);
  const updateData: Prisma.TransferUpdateInput = {};

  if (data.expiryDays !== undefined) {
    const days = Math.min(data.expiryDays, limits.maxExpiryDays);
    const newExpiry = new Date(transfer.createdAt);
    newExpiry.setDate(newExpiry.getDate() + days);
    updateData.expiresAt = newExpiry;
  }

  if (data.downloadLimit !== undefined) {
    updateData.downloadLimit = limits.maxDownloadLimit
      ? Math.min(data.downloadLimit, limits.maxDownloadLimit)
      : data.downloadLimit;
  }

  if (data.password !== undefined) {
    updateData.passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;
  }

  return db.transfer.update({ where: { id: transferId }, data: updateData });
}

export async function checkDailyTransferLimit(userId: string, tier: UserTier): Promise<boolean> {
  const limits = getTierLimits(tier);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayCount = await db.transfer.count({
    where: {
      userId,
      createdAt: { gte: startOfDay },
    },
  });

  return todayCount < limits.dailyTransferLimit;
}

export async function updateTransferSize(transferId: string, totalSizeBytes: number): Promise<void> {
  await db.transfer.update({
    where: { id: transferId },
    data: { totalSizeBytes },
  });
}
