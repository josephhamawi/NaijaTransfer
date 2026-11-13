import { describe, expect, it } from "vitest";
import {
  Crc32,
  FRAME_HEADER_BYTES,
  MAX_CHUNK_BYTES,
  MIN_CHUNK_BYTES,
  PROTOCOL_VERSION,
  SAFE_DEFAULT_MAX_MESSAGE,
  chunkSizeUnsupported,
  crc32,
  decodeControl,
  decodeFrame,
  dedupeFileNames,
  encodeControl,
  encodeFrame,
  negotiateChunkSize,
  safeFileName,
  validateManifest,
} from "@/lib/live/protocol";

describe("control messages", () => {
  it("round-trips a manifest", () => {
    const raw = encodeControl({
      t: "manifest",
      files: [{ id: "a", name: "a.txt", size: 10, mimeType: "text/plain" }],
      totalBytes: 10,
    });
    const msg = decodeControl(raw);
    expect(msg).toMatchObject({ v: PROTOCOL_VERSION, t: "manifest", totalBytes: 10 });
  });

  it("rejects a message from a different protocol version", () => {
    const foreign = JSON.stringify({ v: PROTOCOL_VERSION + 1, t: "manifest", files: [] });
    expect(decodeControl(foreign)).toBeNull();
  });

  it("rejects malformed input instead of throwing", () => {
    expect(decodeControl("not json")).toBeNull();
    expect(decodeControl("[]")).toBeNull();
    expect(decodeControl('{"v":1}')).toBeNull();
  });
});

describe("frame framing", () => {
  it("round-trips a payload with its file index and sequence", () => {
    const payload = new Uint8Array([1, 2, 3, 250]);
    const frame = encodeFrame(7, 42, payload);

    expect(frame.byteLength).toBe(FRAME_HEADER_BYTES + payload.byteLength);
    const decoded = decodeFrame(frame)!;
    expect(decoded.header).toMatchObject({
      version: PROTOCOL_VERSION,
      fileIndex: 7,
      sequence: 42,
    });
    expect([...decoded.payload]).toEqual([1, 2, 3, 250]);
  });

  it("handles a zero-length payload", () => {
    const decoded = decodeFrame(encodeFrame(0, 0, new Uint8Array()))!;
    expect(decoded.payload.byteLength).toBe(0);
  });

  it("rejects a buffer shorter than the header", () => {
    expect(decodeFrame(new ArrayBuffer(FRAME_HEADER_BYTES - 1))).toBeNull();
  });

  it("rejects a frame carrying an unknown version", () => {
    const buf = new ArrayBuffer(FRAME_HEADER_BYTES + 1);
    new DataView(buf).setUint16(0, 99, false);
    expect(decodeFrame(buf)).toBeNull();
  });

  it("survives large sequence numbers", () => {
    const decoded = decodeFrame(encodeFrame(1, 4_294_967_295, new Uint8Array([9])))!;
    expect(decoded.header.sequence).toBe(4_294_967_295);
  });
});

describe("negotiateChunkSize", () => {
  it("leaves room for the header", () => {
    expect(negotiateChunkSize(65536)).toBe(65536 - FRAME_HEADER_BYTES);
  });

  it("caps at the protocol maximum even when the peer allows more", () => {
    expect(negotiateChunkSize(1024 * 1024 * 1024)).toBe(MAX_CHUNK_BYTES);
  });

  it("falls back to the safe default when the limit is unknown", () => {
    for (const unknown of [undefined, null, 0, NaN]) {
      expect(negotiateChunkSize(unknown as number)).toBe(
        SAFE_DEFAULT_MAX_MESSAGE - FRAME_HEADER_BYTES
      );
    }
  });

  it("never returns below the floor", () => {
    expect(negotiateChunkSize(1024)).toBe(MIN_CHUNK_BYTES);
  });

  it("flags a connection too small to carry the protocol", () => {
    expect(chunkSizeUnsupported(1024)).toBe(true);
    expect(chunkSizeUnsupported(65536)).toBe(false);
    // Unknown is not "unsupported" — the safe default applies.
    expect(chunkSizeUnsupported(undefined)).toBe(false);
  });
});

describe("safeFileName", () => {
  it("keeps only the leaf of a path, both separators", () => {
    expect(safeFileName("folder/sub/report.pdf")).toBe("report.pdf");
    expect(safeFileName("C:\\Users\\me\\report.pdf")).toBe("report.pdf");
  });

  it("defuses traversal attempts", () => {
    expect(safeFileName("../../../etc/passwd")).toBe("passwd");
    expect(safeFileName("..")).toBe("unnamed_file");
  });

  it("strips control characters and Windows-illegal characters", () => {
    expect(safeFileName("bad\u0000name<>:.txt")).toBe("bad_name___.txt");
  });

  it("does not produce a hidden file", () => {
    expect(safeFileName(".bashrc")).toBe("bashrc");
  });

  it("escapes reserved device names", () => {
    expect(safeFileName("CON")).toBe("_CON");
    expect(safeFileName("com1.txt")).toBe("_com1.txt");
  });

  it("falls back for an empty result", () => {
    expect(safeFileName("")).toBe("unnamed_file");
    expect(safeFileName("///")).toBe("unnamed_file");
  });

  it("truncates long names but keeps an extension", () => {
    const name = safeFileName(`${"a".repeat(400)}.jpg`);
    expect(name.length).toBeLessThanOrEqual(200);
    expect(name.endsWith(".jpg")).toBe(true);
  });

  it("preserves unicode that is legal in a filename", () => {
    expect(safeFileName("Olúwáṣẹ́gun.pdf")).toBe("Olúwáṣẹ́gun.pdf");
  });
});

describe("dedupeFileNames", () => {
  it("leaves distinct names alone", () => {
    expect(dedupeFileNames(["a.txt", "b.txt"])).toEqual(["a.txt", "b.txt"]);
  });

  it("suffixes collisions before the extension", () => {
    expect(dedupeFileNames(["IMG_1.jpg", "IMG_1.jpg", "IMG_1.jpg"])).toEqual([
      "IMG_1.jpg",
      "IMG_1 (2).jpg",
      "IMG_1 (3).jpg",
    ]);
  });

  it("treats names differing only by case as colliding", () => {
    // Windows and macOS default filesystems are case-insensitive, so
    // these two would overwrite each other on disk.
    expect(dedupeFileNames(["Photo.png", "photo.png"])).toEqual([
      "Photo.png",
      "photo (2).png",
    ]);
  });

  it("does not generate a suffix that collides with a real file", () => {
    const out = dedupeFileNames(["a.txt", "a (2).txt", "a.txt"]);
    expect(new Set(out.map((n) => n.toLowerCase())).size).toBe(3);
  });

  it("handles names with no extension", () => {
    expect(dedupeFileNames(["README", "README"])).toEqual(["README", "README (2)"]);
  });

  it("sanitises while deduping", () => {
    expect(dedupeFileNames(["dir/a.txt", "other/a.txt"])).toEqual(["a.txt", "a (2).txt"]);
  });
});

describe("Crc32", () => {
  it("matches the known IEEE value for a standard input", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("is identical whether fed in one piece or many", () => {
    const bytes = new Uint8Array(5000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31) % 256;

    const whole = crc32(bytes);
    const chunked = new Crc32();
    for (let i = 0; i < bytes.length; i += 97) chunked.update(bytes.subarray(i, i + 97));

    expect(chunked.value()).toBe(whole);
  });

  it("changes when a single byte changes", () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    const b = new Uint8Array([1, 2, 3, 5]);
    expect(crc32(a)).not.toBe(crc32(b));
  });

  it("detects reordering", () => {
    expect(crc32(new Uint8Array([1, 2]))).not.toBe(crc32(new Uint8Array([2, 1])));
  });

  it("can be read mid-stream without disturbing the result", () => {
    const c = new Crc32();
    c.update(new Uint8Array([1, 2, 3]));
    const mid = c.value();
    c.update(new Uint8Array([4]));
    const end = c.value();
    expect(mid).not.toBe(end);
    expect(end).toBe(crc32(new Uint8Array([1, 2, 3, 4])));
  });
});

describe("validateManifest", () => {
  const limits = { maxFiles: 3, maxFileBytes: 1000, maxTotalBytes: 1500 };

  it("accepts a well-formed manifest and returns our own total", () => {
    const result = validateManifest(
      {
        files: [
          { id: "1", name: "a.txt", size: 100, mimeType: "text/plain" },
          { id: "2", name: "b.txt", size: 200, mimeType: "text/plain" },
        ],
        totalBytes: 300,
      },
      limits
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.manifest.totalBytes).toBe(300);
  });

  it("rejects a total that disagrees with the file sizes", () => {
    const result = validateManifest(
      { files: [{ id: "1", name: "a", size: 100, mimeType: "" }], totalBytes: 999 },
      limits
    );
    expect(result).toMatchObject({ ok: false, code: "MANIFEST_MISMATCH" });
  });

  it("rejects too many files", () => {
    const files = Array.from({ length: 4 }, (_, i) => ({
      id: `${i}`,
      name: `f${i}`,
      size: 1,
      mimeType: "",
    }));
    expect(validateManifest({ files, totalBytes: 4 }, limits)).toMatchObject({
      ok: false,
      code: "TOO_MANY_FILES",
    });
  });

  it("rejects an oversized file", () => {
    expect(
      validateManifest(
        { files: [{ id: "1", name: "big", size: 1001, mimeType: "" }], totalBytes: 1001 },
        limits
      )
    ).toMatchObject({ ok: false, code: "FILE_TOO_LARGE" });
  });

  it("rejects an oversized total", () => {
    const files = [
      { id: "1", name: "a", size: 900, mimeType: "" },
      { id: "2", name: "b", size: 900, mimeType: "" },
    ];
    expect(validateManifest({ files, totalBytes: 1800 }, limits)).toMatchObject({
      ok: false,
      code: "TRANSFER_TOO_LARGE",
    });
  });

  it("rejects negative, fractional and non-numeric sizes", () => {
    for (const size of [-1, 1.5, "100", null, undefined, NaN]) {
      expect(
        validateManifest(
          { files: [{ id: "1", name: "a", size, mimeType: "" }], totalBytes: 0 },
          limits
        )
      ).toMatchObject({ ok: false });
    }
  });

  it("rejects a missing or absurd file id", () => {
    expect(
      validateManifest({ files: [{ name: "a", size: 1, mimeType: "" }], totalBytes: 1 }, limits)
    ).toMatchObject({ ok: false, code: "BAD_MANIFEST" });
    expect(
      validateManifest(
        { files: [{ id: "x".repeat(65), name: "a", size: 1, mimeType: "" }], totalBytes: 1 },
        limits
      )
    ).toMatchObject({ ok: false, code: "BAD_MANIFEST" });
  });

  it("rejects an empty or non-array file list", () => {
    expect(validateManifest({ files: [], totalBytes: 0 }, limits)).toMatchObject({ ok: false });
    expect(validateManifest({ files: "nope", totalBytes: 0 }, limits)).toMatchObject({
      ok: false,
    });
    expect(validateManifest(null, limits)).toMatchObject({ ok: false });
  });

  it("sanitises and dedupes names, and defaults a bad mime type", () => {
    const result = validateManifest(
      {
        files: [
          { id: "1", name: "../a.txt", size: 1, mimeType: "text/plain" },
          { id: "2", name: "dir/a.txt", size: 1, mimeType: 12345 },
        ],
        totalBytes: 2,
      },
      limits
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifest.files.map((f) => f.name)).toEqual(["a.txt", "a (2).txt"]);
      expect(result.manifest.files[1].mimeType).toBe("application/octet-stream");
    }
  });
});
