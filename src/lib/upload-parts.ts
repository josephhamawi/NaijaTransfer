/**
 * Shared part layout for direct-to-storage uploads.
 *
 * Used by both the API (to mint signed URLs) and the browser (to slice
 * the File), so the two must never disagree — hence one module.
 *
 * Sizing rationale:
 *  - Files at or below PART_SIZE go up as a single PUT straight to the
 *    final object key. No scratch parts, no compose, no cleanup: the
 *    upload finishes in one request, which is what makes small-file
 *    transfers feel instant.
 *  - Larger files are split into PART_SIZE pieces so several TCP flows
 *    run at once (a single flow from Lagos rarely saturates the link)
 *    and so a dropped connection only costs one part, not the file.
 *  - Part count is capped at MAX_PARTS because a composed GCS object
 *    may not exceed 1024 components; the cap keeps us well inside that
 *    even after the tiered compose in `composeMany`.
 */

/** 16 MiB — big enough to amortise per-request overhead, small enough to retry cheaply. */
export const PART_SIZE = 16 * 1024 * 1024;

/** Hard cap on parts per file; part size grows past PART_SIZE beyond this. */
export const MAX_PARTS = 512;

export interface PartPlan {
  partCount: number;
  partSize: number;
  /** True when the file is uploaded as one PUT directly to its final key. */
  single: boolean;
}

export function planParts(fileSize: number): PartPlan {
  if (fileSize <= PART_SIZE) {
    return { partCount: 1, partSize: Math.max(fileSize, 1), single: true };
  }
  const partSize = Math.max(PART_SIZE, Math.ceil(fileSize / MAX_PARTS));
  const partCount = Math.ceil(fileSize / partSize);
  return { partCount, partSize, single: false };
}

/** Scratch object key for one part of a multipart upload. */
export function partKey(transferId: string, uploadId: string, partNumber: number): string {
  return `${partPrefix(transferId, uploadId)}${String(partNumber).padStart(4, "0")}`;
}

/** Prefix all scratch parts of an upload live under. */
export function partPrefix(transferId: string, uploadId: string): string {
  return `transfers/${transferId}/parts/${uploadId}/`;
}

/** Filesystem-safe leaf name, shared by the direct and proxy paths. */
export function sanitizeName(name: string): string {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Final destination key for a completed file. */
export function finalKeyFor(transferId: string, fileId: string, fileName: string): string {
  return `transfers/${transferId}/${fileId}/${sanitizeName(fileName)}`;
}
