/**
 * Storage Monitor Service
 * Tracks storage utilization, generates reports, and triggers auto-rejection.
 * Implementation for Story 1.8: Storage Monitoring and Auto-Rejection.
 */

import fs from "fs/promises";
import { STORAGE } from "@/lib/constants";

interface StorageStatus {
  usedPercent: number;
  usedBytes: number;
  totalBytes: number;
  status: "ok" | "warning" | "critical";
}

/**
 * Check current storage utilization of the upload directory.
 * Returns percentage used and status classification.
 */
export async function checkStorageUtilization(): Promise<StorageStatus> {
  const uploadDir = process.env.TUS_UPLOAD_DIR || "/tmp/uploads";

  try {
    // Ensure the upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Use filesystem stats to estimate utilization
    // In production on Linux, this would use statvfs or df
    // For portability, we calculate based on directory size
    const totalBytes = await getDirectorySize(uploadDir);

    // Block storage is 200GB on Oracle; use env or default
    const maxBytes = 200 * 1024 * 1024 * 1024; // 200 GB

    const usedPercent = Math.round((totalBytes / maxBytes) * 100);

    let status: "ok" | "warning" | "critical" = "ok";
    if (usedPercent >= STORAGE.CRITICAL_THRESHOLD_PERCENT) {
      status = "critical";
    } else if (usedPercent >= STORAGE.WARNING_THRESHOLD_PERCENT) {
      status = "warning";
    }

    return {
      usedPercent,
      usedBytes: totalBytes,
      totalBytes: maxBytes,
      status,
    };
  } catch (error) {
    // If we can't check storage, assume ok but log
    console.error("Storage utilization check failed:", error);
    return {
      usedPercent: 0,
      usedBytes: 0,
      totalBytes: 200 * 1024 * 1024 * 1024,
      status: "ok",
    };
  }
}

/**
 * Check if new uploads should be rejected due to storage pressure.
 */
export async function shouldRejectUploads(): Promise<boolean> {
  const threshold = parseInt(
    process.env.STORAGE_THRESHOLD_PERCENT || String(STORAGE.CRITICAL_THRESHOLD_PERCENT),
    10
  );
  const status = await checkStorageUtilization();
  return status.usedPercent >= threshold;
}

/**
 * Calculate the total size of a directory recursively.
 */
async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = `${dirPath}/${entry.name}`;

      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        const stat = await fs.stat(fullPath);
        totalSize += stat.size;
      }
    }
  } catch {
    // Directory may not exist or be inaccessible
  }

  return totalSize;
}

/**
 * Generate a daily storage report.
 */
export async function generateStorageReport(): Promise<{
  date: string;
  uploadDirUsedBytes: number;
  uploadDirUsedPercent: number;
  activeTransferCount: number;
}> {
  const { db } = await import("@/lib/db");

  const [storage, activeCount] = await Promise.all([
    checkStorageUtilization(),
    db.transfer.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    date: new Date().toISOString().split("T")[0],
    uploadDirUsedBytes: storage.usedBytes,
    uploadDirUsedPercent: storage.usedPercent,
    activeTransferCount: activeCount,
  };
}
