import { describe, it, expect } from "vitest";
import { sanitizeFilename, hashIp, apiSuccess, apiError } from "../server-utils";

describe("sanitizeFilename", () => {
  it("allows safe filenames", () => {
    expect(sanitizeFilename("document.pdf")).toBe("document.pdf");
    expect(sanitizeFilename("my-file_2024.txt")).toBe("my-file_2024.txt");
  });

  it("strips path separators", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("etcpasswd");
    expect(sanitizeFilename("path/to/file.txt")).toBe("pathtofile.txt");
    expect(sanitizeFilename("C:\\Windows\\system.dll")).toBe("CWindowssystem.dll");
  });

  it("replaces special characters with underscores", () => {
    expect(sanitizeFilename("my file (1).pdf")).toBe("my_file__1_.pdf");
    expect(sanitizeFilename("résumé.docx")).toBe("r_sum_.docx");
  });

  it("removes leading dots", () => {
    expect(sanitizeFilename(".hidden")).toBe("hidden");
    expect(sanitizeFilename("...triple")).toBe("triple");
  });

  it("handles empty or all-invalid filenames", () => {
    expect(sanitizeFilename("")).toBe("unnamed_file");
    expect(sanitizeFilename("///")).toBe("unnamed_file");
  });

  it("truncates to 255 characters", () => {
    const longName = "a".repeat(300) + ".txt";
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(255);
    expect(result.endsWith(".txt")).toBe(true);
  });
});

describe("hashIp", () => {
  it("returns a consistent SHA-256 hash", () => {
    const hash1 = hashIp("192.168.1.1");
    const hash2 = hashIp("192.168.1.1");
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex = 64 chars
  });

  it("returns different hashes for different IPs", () => {
    const hash1 = hashIp("192.168.1.1");
    const hash2 = hashIp("192.168.1.2");
    expect(hash1).not.toBe(hash2);
  });
});

describe("apiSuccess", () => {
  it("wraps data in envelope", () => {
    const result = apiSuccess({ id: "123" });
    expect(result).toEqual({ data: { id: "123" } });
  });

  it("includes meta when provided", () => {
    const result = apiSuccess({ id: "123" }, { page: 1 });
    expect(result).toEqual({ data: { id: "123" }, meta: { page: 1 } });
  });
});

describe("apiError", () => {
  it("wraps error in envelope", () => {
    const result = apiError("NOT_FOUND", "Transfer not found");
    expect(result).toEqual({
      error: { code: "NOT_FOUND", message: "Transfer not found" },
    });
  });

  it("includes details when provided", () => {
    const result = apiError("VALIDATION_ERROR", "Invalid input", { field: "email" });
    expect(result).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: { field: "email" },
      },
    });
  });
});
