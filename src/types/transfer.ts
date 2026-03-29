import type { Transfer, File } from "@prisma/client";
import type { TransferStatus, TransferType, UserTier } from "@/types/enums";

/**
 * Transfer with files included (common query result).
 */
export type TransferWithFiles = Transfer & {
  files: File[];
};

/**
 * Create transfer request payload.
 */
export interface CreateTransferRequest {
  files: {
    name: string;
    size: number;
    type: string;
  }[];
  settings: {
    type?: TransferType;
    title?: string;
    message?: string;
    senderEmail?: string;
    recipientEmails?: string[];
    password?: string;
    expiryDays?: number;
    downloadLimit?: number;
  };
}

/**
 * Create transfer response.
 */
export interface CreateTransferResponse {
  transferId: string;
  files: {
    fileId: string;
    tusUploadUrl: string;
  }[];
}

/**
 * Transfer activation response (after all files uploaded).
 */
export interface TransferActivationResponse {
  shortCode: string;
  downloadUrl: string;
  qrCodeSvg: string;
}

/**
 * Download page transfer data (public, sanitized).
 */
export interface PublicTransferData {
  shortCode: string;
  title?: string;
  message?: string;
  senderEmail?: string;
  status: TransferStatus;
  expiresAt: string;
  downloadLimit: number;
  downloadCount: number;
  downloadsRemaining: number;
  totalSizeBytes: string; // BigInt serialized as string
  tier: UserTier;
  showAds: boolean;
  hasPassword: boolean;
  files: PublicFileData[];
  createdAt: string;
}

/**
 * Public file data (sanitized for download page).
 */
export interface PublicFileData {
  id: string;
  filename: string;
  originalName: string;
  sizeBytes: string; // BigInt serialized as string
  mimeType: string;
  hasPreview: boolean;
}
