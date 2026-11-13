/**
 * Storage reporting.
 *
 * Rewritten twice over by two earlier changes, and the old version was
 * measuring something that no longer exists: it walked a local upload
 * directory (`TUS_UPLOAD_DIR`) to estimate disk pressure. Uploads now
 * go browser → signed URL → Cloud Storage, so nothing is ever written
 * to local disk, and the "200 GB block device" it compared against was
 * the retired Oracle VM.
 *
 * What is worth reporting now is what Cloud Storage actually holds,
 * which is what the daily cron emails out.
 */

import { collection } from "@/lib/firebase-admin";

export interface StorageReport {
  date: string;
  activeTransferCount: number;
  storedBytes: number;
  /** Egress served this month and its estimated cost. */
  egressGbThisMonth: number;
  egressEstimatedUsd: number;
}

/**
 * Totals across every active transfer.
 *
 * A sum aggregation rather than a document scan: this runs daily and
 * only needs two numbers.
 */
export async function generateStorageReport(): Promise<StorageReport> {
  const { AggregateField } = await import("firebase-admin/firestore");

  const snap = await collection("transfers")
    .where("status", "==", "ACTIVE")
    .aggregate({
      count: AggregateField.count(),
      bytes: AggregateField.sum("totalSizeBytes"),
    })
    .get();

  const { getEgressReport } = await import("@/lib/egress");
  const egress = await getEgressReport();

  const data = snap.data();
  return {
    date: new Date().toISOString().split("T")[0],
    activeTransferCount: Number(data.count ?? 0),
    storedBytes: Number(data.bytes ?? 0),
    egressGbThisMonth: egress.totalGb,
    egressEstimatedUsd: egress.estimatedUsd,
  };
}
