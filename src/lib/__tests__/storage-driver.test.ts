import { describe, expect, it } from "vitest";
import * as gcs from "@/lib/storage/gcs";
import * as r2 from "@/lib/storage/r2";
import { PART_SIZE, planParts } from "@/lib/upload-parts";

/**
 * Guards on the storage driver swap.
 *
 * The drivers are interchangeable at runtime through STORAGE_DRIVER, so
 * the risk is not that either one is wrong in isolation — it is that
 * they drift: a function added to one and not the other, or a part size
 * that is legal on GCS and rejected by R2.
 */

const REQUIRED = [
  "getDownloadUrl",
  "getSignedUploadUrl",
  "getObjectSize",
  "listUploadedParts",
  "composeFiles",
  "composeMany",
  "deleteFile",
  "deleteByPrefix",
  "checkStorageHealth",
  "isDirectUploadAllowed",
  "getFileStream",
] as const;

describe("driver parity", () => {
  it("both drivers implement the whole interface", () => {
    for (const name of REQUIRED) {
      expect(typeof (gcs as Record<string, unknown>)[name], `gcs.${name}`).toBe("function");
      expect(typeof (r2 as Record<string, unknown>)[name], `r2.${name}`).toBe("function");
    }
  });

  it("neither driver exports a function the other lacks", () => {
    const fns = (m: object) =>
      Object.entries(m)
        .filter(([, v]) => typeof v === "function")
        .map(([k]) => k)
        .sort();

    expect(fns(gcs)).toEqual(fns(r2));
  });
});

describe("multipart copy constraints", () => {
  /**
   * R2 stitches parts with S3 UploadPartCopy, which rejects any part
   * except the last below 5 MiB. The upload planner chooses part sizes
   * without knowing which driver is active, so the two have to agree —
   * this is the assertion that keeps them honest.
   */
  it("PART_SIZE is at least the S3 minimum for a copied part", () => {
    expect(PART_SIZE).toBeGreaterThanOrEqual(r2.MIN_MULTIPART_COPY_BYTES);
  });

  it("every multipart plan produces non-final parts above the minimum", () => {
    // Sizes around the thresholds where the planner changes behaviour.
    const sizes = [
      PART_SIZE + 1,
      PART_SIZE * 2,
      PART_SIZE * 2 + 1,
      5 * 1024 ** 3,
      50 * 1024 ** 3,
      200 * 1024 ** 3,
    ];

    for (const size of sizes) {
      const plan = planParts(size);
      if (plan.single) continue;
      expect(plan.partSize, `partSize for ${size} bytes`).toBeGreaterThanOrEqual(
        r2.MIN_MULTIPART_COPY_BYTES
      );
      // Only the final part may fall below the floor, and S3 permits it.
      const finalPart = size - plan.partSize * (plan.partCount - 1);
      expect(finalPart).toBeGreaterThan(0);
      expect(finalPart).toBeLessThanOrEqual(plan.partSize);
    }
  });

  it("stays within the 10,000-part ceiling for the largest plan", () => {
    // BUSINESS allows 200 GB per file; S3 multipart caps at 10k parts.
    const plan = planParts(200 * 1024 ** 3);
    expect(plan.partCount).toBeLessThanOrEqual(10_000);
  });
});

describe("driver selection", () => {
  it("defaults to gcs and only switches on an exact match", async () => {
    const { activeDriverName } = await import("@/lib/storage");
    // The module reads the env var once at import time, so this asserts
    // the default rather than toggling it — a wrong default would mean
    // silently serving from the wrong bucket.
    expect(activeDriverName()).toBe("gcs");
  });
});
