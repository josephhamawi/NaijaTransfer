import { collection, getDb } from "@/lib/firebase-admin";
import { deleteByPrefix } from "@/lib/storage";

interface CleanupResult {
  expiredTransfers: number;
  bytesReclaimed: number;
  orphanedChunks: number;
  errors: string[];
}

/**
 * Clean up expired transfers: delete files from Firebase Storage + Firestore docs.
 */
export async function cleanupExpiredTransfers(): Promise<CleanupResult> {
  const result: CleanupResult = {
    expiredTransfers: 0,
    bytesReclaimed: 0,
    orphanedChunks: 0,
    errors: [],
  };

  try {
    const now = new Date();
    const snap = await collection("transfers")
      .where("status", "==", "ACTIVE")
      .where("expiresAt", "<=", now)
      .get();

    for (const doc of snap.docs) {
      try {
        const data = doc.data();

        // Delete files from Firebase Storage
        await deleteByPrefix(`transfers/${doc.id}/`);

        // Delete files subcollection
        const filesSnap = await doc.ref.collection("files").get();
        const batch = getDb().batch();
        filesSnap.docs.forEach((f) => batch.delete(f.ref));
        await batch.commit();

        // Update transfer status
        await doc.ref.update({ status: "EXPIRED" });

        result.expiredTransfers++;
        result.bytesReclaimed += data.totalSizeBytes || 0;
      } catch (error) {
        result.errors.push(`Transfer ${doc.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } catch (error) {
    result.errors.push(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Delete download logs older than 90 days.
 */
export async function cleanupOldLogs(): Promise<number> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const snap = await getDb()
      .collection("downloadLogs")
      .where("downloadedAt", "<=", cutoff)
      .limit(500)
      .get();

    const batch = getDb().batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    return snap.docs.length;
  } catch {
    return 0;
  }
}

/**
 * Run full cleanup.
 */
export async function runFullCleanup(): Promise<CleanupResult> {
  const result = await cleanupExpiredTransfers();
  result.orphanedChunks = await cleanupOldLogs();

  console.log(
    `Cleanup: ${result.expiredTransfers} expired, ${result.bytesReclaimed} bytes reclaimed, ${result.orphanedChunks} old logs deleted` +
      (result.errors.length > 0 ? `, ${result.errors.length} errors` : "")
  );

  return result;
}
