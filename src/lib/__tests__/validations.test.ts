import { describe, it, expect } from "vitest";
import {
  createTransferSchema,
  verifyPasswordSchema,
  nigerianPhoneSchema,
  paginationSchema,
} from "../validations";

describe("createTransferSchema", () => {
  it("validates a valid transfer request", () => {
    const valid = {
      files: [{ name: "test.pdf", size: 1024, type: "application/pdf" }],
      settings: {
        type: "LINK",
        expiryDays: 7,
        downloadLimit: 50,
      },
    };
    const result = createTransferSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects empty files array", () => {
    const invalid = { files: [] };
    const result = createTransferSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects more than 100 files", () => {
    const files = Array.from({ length: 101 }, (_, i) => ({
      name: `file${i}.txt`,
      size: 100,
      type: "text/plain",
    }));
    const result = createTransferSchema.safeParse({ files });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 recipients", () => {
    const invalid = {
      files: [{ name: "test.pdf", size: 1024, type: "application/pdf" }],
      settings: {
        recipientEmails: Array.from({ length: 11 }, (_, i) => `user${i}@example.com`),
      },
    };
    const result = createTransferSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("verifyPasswordSchema", () => {
  it("validates a password", () => {
    const result = verifyPasswordSchema.safeParse({ password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = verifyPasswordSchema.safeParse({ password: "" });
    expect(result.success).toBe(false);
  });
});

describe("nigerianPhoneSchema", () => {
  it("validates a valid Nigerian phone number", () => {
    const result = nigerianPhoneSchema.safeParse("+2348012345678");
    expect(result.success).toBe(true);
  });

  it("rejects non-Nigerian phone numbers", () => {
    expect(nigerianPhoneSchema.safeParse("+1234567890").success).toBe(false);
    expect(nigerianPhoneSchema.safeParse("08012345678").success).toBe(false);
    expect(nigerianPhoneSchema.safeParse("+234801234567").success).toBe(false); // Too short
  });
});

describe("paginationSchema", () => {
  it("provides defaults", () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("coerces string values", () => {
    const result = paginationSchema.parse({ page: "3", limit: "50" });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it("clamps limit to max 100", () => {
    const result = paginationSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });
});
