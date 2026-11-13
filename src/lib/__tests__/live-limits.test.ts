import { describe, expect, it } from "vitest";
import {
  FALLBACK_MAX_FILE_BYTES,
  FALLBACK_MAX_TOTAL_BYTES,
  MAX_FILES_PER_SESSION,
  STREAM_MAX_FILE_BYTES,
  checkTransferSize,
  detectReceiveCapability,
  senderSideCapability,
} from "@/lib/live/limits";

describe("detectReceiveCapability", () => {
  it("picks the streaming path when the File System Access API is present", () => {
    const cap = detectReceiveCapability({
      showDirectoryPicker: () => {},
      isSecureContext: true,
    });
    expect(cap.saveMethod).toBe("stream");
    expect(cap.maxFileBytes).toBe(STREAM_MAX_FILE_BYTES);
    expect(cap.limitation).toBeNull();
  });

  it("falls back to bounded Blob when no writable handle is available", () => {
    const cap = detectReceiveCapability({ isSecureContext: true });
    expect(cap.saveMethod).toBe("blob");
    expect(cap.maxFileBytes).toBe(FALLBACK_MAX_FILE_BYTES);
    expect(cap.maxTotalBytes).toBe(FALLBACK_MAX_TOTAL_BYTES);
    // The user has to be told why, and what to do about it.
    expect(cap.limitation).toContain("1 GB");
  });

  it("refuses the streaming path outside a secure context", () => {
    // showDirectoryPicker exists but the page is http: the call would
    // throw, so treating it as available would break the transfer.
    const cap = detectReceiveCapability({
      showDirectoryPicker: () => {},
      isSecureContext: false,
    });
    expect(cap.saveMethod).toBe("blob");
  });

  it("does not throw on an environment with no window at all", () => {
    expect(detectReceiveCapability(undefined).saveMethod).toBe("blob");
    expect(detectReceiveCapability({}).saveMethod).toBe("blob");
  });
});

describe("senderSideCapability", () => {
  it("is the absolute ceiling, not the local browser's", () => {
    // The sender must not impose its own save limits on the recipient.
    const cap = senderSideCapability();
    expect(cap.maxFileBytes).toBe(STREAM_MAX_FILE_BYTES);
    expect(cap.maxFileBytes).toBeGreaterThan(FALLBACK_MAX_FILE_BYTES);
  });
});

describe("checkTransferSize", () => {
  const blobCap = detectReceiveCapability({});

  it("accepts an empty selection", () => {
    expect(checkTransferSize([], blobCap).ok).toBe(true);
  });

  it("accepts a selection inside the fallback limits", () => {
    expect(checkTransferSize([{ size: 1024 }], blobCap).ok).toBe(true);
  });

  it("rejects one oversized file before anything is sent", () => {
    const result = checkTransferSize([{ size: FALLBACK_MAX_FILE_BYTES + 1 }], blobCap);
    expect(result).toMatchObject({ ok: false, code: "FILE_TOO_LARGE" });
    expect(result.message).toContain("512 MB");
  });

  it("rejects a total over the fallback cap even when each file fits", () => {
    const files = [
      { size: FALLBACK_MAX_FILE_BYTES },
      { size: FALLBACK_MAX_FILE_BYTES },
      { size: FALLBACK_MAX_FILE_BYTES },
    ];
    const result = checkTransferSize(files, blobCap);
    expect(result).toMatchObject({ ok: false, code: "TRANSFER_TOO_LARGE" });
    expect(result.message).toContain("1 GB");
  });

  it("rejects too many files", () => {
    const files = Array.from({ length: MAX_FILES_PER_SESSION + 1 }, () => ({ size: 1 }));
    expect(checkTransferSize(files, blobCap)).toMatchObject({
      ok: false,
      code: "TOO_MANY_FILES",
    });
  });

  it("accepts exactly at the boundary", () => {
    expect(checkTransferSize([{ size: FALLBACK_MAX_FILE_BYTES }], blobCap).ok).toBe(true);
    const files = Array.from({ length: MAX_FILES_PER_SESSION }, () => ({ size: 1 }));
    expect(checkTransferSize(files, blobCap).ok).toBe(true);
  });

  it("allows far more on the streaming path than the fallback", () => {
    const streamCap = detectReceiveCapability({
      showDirectoryPicker: () => {},
      isSecureContext: true,
    });
    const big = [{ size: FALLBACK_MAX_TOTAL_BYTES * 4 }];
    expect(checkTransferSize(big, blobCap).ok).toBe(false);
    expect(checkTransferSize(big, streamCap).ok).toBe(true);
  });
});
