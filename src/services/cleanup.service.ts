/**
 * Cleanup Service
 * Handles expired transfer cleanup, orphaned chunk removal, and storage reclamation.
 * Implementation for Story 1.5: Expired Transfer Cleanup and Orphan Chunk Removal.
 */

import { db } from "@/lib/db";
import { deleteByPrefix } from "@/lib/r2";
import fs from "fs/promises";
import path from "path";

interface CleanupResult {
  expiredTransfers: number;
  bytesReclaimed: bigint;
  orphanedChunks: number;
  errors: string[];
}

/**
 * Clean up expired transfers: update status, delete R2 objects, update user storage.
 */
export async function cleanupExpiredTransfers(): Promise<CleanupResult> {
  const result: CleanupResult = {
    expiredTransfers: 0,
    bytesReclaimed: BigInt(0),
    orphanedChunks: 0,
    errors: [],
  };

  try {
    // Find all active transfers that have expired
    const expiredTransfers = await db.transfer.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: new Date() },
      },
      include: { files: true },
    });

    for (const transfer of expiredTransfers) {
      try {
        // Delete files from R2
        await deleteByPrefix(`transfers/${transfer.id}/`);
        await deleteByPrefix(`previews/${transfer.id}/`);

        // Update transfer status to EXPIRED
        await db.transfer.update({
          where: { id: transfer.id },
          data: { status: "EXPIRED" },
        });

        // Update user storage if transfer belongs to a user
        if (transfer.userId && transfer.totalSizeBytes > 0) {
          await db.user.update({
            where: { id: transfer.userId },
            data: {
              storageUsedBytes: {
                decrement: transfer.totalSizeBytes,
              },
            },
          });
        }

        result.expiredTransfers++;
        result.bytesReclaimed += transfer.totalSizeBytes;
      } catch (error) {
        result.errors.push(
          `Failed to cleanup transfer ${transfer.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `Failed to query expired transfers: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

/**
 * Clean up orphaned tus upload chunks older than 24 hours.
 */
export async function cleanupOrphanedChunks(): Promise<number> {
  const uploadDir = process.env.TUS_UPLOAD_DIR || "/tmp/uploads";
  let cleanedCount = 0;

  try {
    const entries = await fs.readdir(uploadDir, { withFileTypes: true });
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = Date.now() - maxAgeMs;

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(uploadDir, entry.name);
        try {
          const stat = await fs.stat(dirPath);
          if (stat.mtimeMs < cutoff) {
            await fs.rm(dirPath, { recursive: true, force: true });
            cleanedCount++;
          }
        } catch {
          // Skip entries that can't be stat'd
        }
      }
    }
  } catch (error) {
    // Upload directory may not exist yet
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Error cleaning orphaned chunks:", error);
    }
  }

  return cleanedCount;
}

/**
 * Run full cleanup: expired transfers + orphaned chunks.
 */
export async function runFullCleanup(): Promise<CleanupResult> {
  const result = await cleanupExpiredTransfers();
  result.orphanedChunks = await cleanupOrphanedChunks();

  console.warn(
    `Cleanup complete: ${result.expiredTransfers} transfers expired, ` +
      `${result.bytesReclaimed} bytes reclaimed, ${result.orphanedChunks} orphaned chunks removed` +
      (result.errors.length > 0 ? `, ${result.errors.length} errors` : "")
  );

  return result;
}
