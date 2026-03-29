/** User subscription tier */
export type Tier = "free" | "pro" | "business";

/** Theme mode */
export type ThemeMode = "light" | "dark" | "system";

/** Upload connection state */
export type ConnectionState =
  | "idle"
  | "uploading"
  | "paused"
  | "reconnecting"
  | "resuming"
  | "completing"
  | "complete"
  | "error";

/** File upload state */
export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  progress: number;
  speed: number;
  eta: number;
  status: "pending" | "uploading" | "paused" | "complete" | "error";
  tusUrl?: string;
  error?: string;
}

/** Transfer data */
export interface Transfer {
  id: string;
  shortCode: string;
  files: TransferFile[];
  totalSize: number;
  expiresAt: string;
  downloadLimit: number;
  downloadCount: number;
  hasPassword: boolean;
  message?: string;
  senderEmail?: string;
  status: "active" | "expired" | "deleted";
}

/** Transfer file */
export interface TransferFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  previewUrl?: string;
}

/** Wallpaper data */
export interface Wallpaper {
  id: string;
  imageUrl: string;
  artistName: string;
  artworkTitle: string;
  artistUrl?: string;
}

/** Tier badge variant */
export type BadgeVariant = "free" | "pro" | "business" | "default";

/** Notification type */
export type NotificationType = "success" | "error" | "info" | "warning";

/** Notification data */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}
