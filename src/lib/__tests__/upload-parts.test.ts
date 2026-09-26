import { describe, expect, it } from "vitest";
import {
  MAX_PARTS,
  PART_SIZE,
  finalKeyFor,
  partKey,
  planParts,
} from "@/lib/upload-parts";

/**
 * The browser slices the File using this plan and the API signs URLs
 * using it. If the two ever disagree the upload silently corrupts, so
 * the plan is pinned by tests.
 */
describe("planParts", () => {
  it("sends an empty file as one part", () => {
    const plan = planParts(0);
    expect(plan).toEqual({ partCount: 1, partSize: 1, single: true });
  });

  it("sends anything up to the part size as a single direct PUT", () => {
    for (const size of [1, 1024, PART_SIZE - 1, PART_SIZE]) {
      const plan = planParts(size);
      expect(plan.single).toBe(true);
      expect(plan.partCount).toBe(1);
    }
  });

  it("splits larger files into parts of at least PART_SIZE", () => {
    const plan = planParts(PART_SIZE * 4 + 1);
    expect(plan.single).toBe(false);
    expect(plan.partCount).toBe(5);
    expect(plan.partSize).toBe(PART_SIZE);
  });

  it("covers the whole file exactly once", () => {
    for (const size of [
      PART_SIZE + 1,
      100 * 1024 * 1024,
      4 * 1024 ** 3,
      50 * 1024 ** 3,
    ]) {
      const { partCount, partSize } = planParts(size);
      // Last part is the only one allowed to be short.
      expect(partSize * (partCount - 1)).toBeLessThan(size);
      expect(partSize * partCount).toBeGreaterThanOrEqual(size);
    }
  });

  it("never exceeds the compose-safe part cap", () => {
    // 200 GB is the largest transfer any tier permits.
    expect(planParts(200 * 1024 ** 3).partCount).toBeLessThanOrEqual(MAX_PARTS);
  });
});

describe("key layout", () => {
  it("pads part numbers so lexicographic order matches numeric order", () => {
    const keys = [1, 2, 10, 100].map((n) => partKey("t1", "u1", n));
    expect(keys).toEqual([...keys].sort());
    expect(keys[0]).toBe("transfers/t1/parts/u1/0001");
  });

  it("sanitizes the destination name but keeps the extension", () => {
    expect(finalKeyFor("t1", "f1", "My Folder/oga's mix.wav")).toBe(
      "transfers/t1/f1/My_Folder_oga_s_mix.wav"
    );
  });
});
