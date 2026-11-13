/**
 * Live Send wire protocol — version 1.
 *
 * Runs over a single reliable, ordered WebRTC DataChannel. Two message
 * shapes share that channel:
 *
 *   • Control messages — JSON strings. Small, infrequent, both directions.
 *   • Data frames      — ArrayBuffers: a 12-byte header then raw bytes.
 *
 * The header exists so the receiver can *validate* rather than trust.
 * A reliable ordered channel already guarantees delivery order, so the
 * sequence number is not there to reorder anything: it is there so a
 * desynchronised or malicious peer is caught at the first bad frame
 * instead of silently producing a corrupt file.
 *
 * This module is deliberately free of browser, React and Firebase
 * imports. It is pure data handling, which is what makes it directly
 * unit-testable and what lets the end-to-end harness bundle it without
 * pulling in the app.
 */

export const PROTOCOL_VERSION = 1;

/** Header: u16 version, u16 flags, u32 fileIndex, u32 sequence. */
export const FRAME_HEADER_BYTES = 12;

/**
 * Chunk-size bounds.
 *
 * Browsers disagree on SCTP message limits. Chrome reports 256 KiB,
 * Firefox historically 64 KiB (1 GiB on recent builds), Safari lower
 * still. `negotiateChunkSize` clamps whatever the connection reports
 * into this range instead of trusting it, because sending one byte over
 * a peer's real limit silently closes the DataChannel.
 */
export const MIN_CHUNK_BYTES = 16 * 1024;
export const MAX_CHUNK_BYTES = 256 * 1024;
/** Fallback when `RTCSctpTransport.maxMessageSize` is unavailable. */
export const SAFE_DEFAULT_MAX_MESSAGE = 64 * 1024;

/** Pause reading when this many bytes are already queued in the channel. */
export const BUFFER_HIGH_WATER = 8 * 1024 * 1024;
/** Resume once the channel drains to this level. */
export const BUFFER_LOW_WATER = 1 * 1024 * 1024;

export type SaveMethod = "stream" | "blob";

export interface ManifestFile {
  /** Stable id for this file within the session. */
  id: string;
  /** Safe display name. Never a path. */
  name: string;
  size: number;
  mimeType: string;
}

export interface Manifest {
  files: ManifestFile[];
  totalBytes: number;
}

// ─── Control messages ────────────────────────────────────────────────

export type ControlMessage =
  | { v: number; t: "hello"; role: "sender" | "recipient"; maxMessageSize: number }
  | { v: number; t: "manifest"; files: ManifestFile[]; totalBytes: number }
  | {
      v: number;
      t: "accept";
      saveMethod: SaveMethod;
      /** Hard cap the receiver can actually honour, in bytes. */
      maxAcceptBytes: number;
      chunkSize: number;
    }
  | { v: number; t: "reject"; code: string; message: string }
  | { v: number; t: "file-start"; fileId: string; index: number; size: number }
  | { v: number; t: "file-end"; fileId: string; index: number; bytes: number; crc32: number }
  | {
      v: number;
      t: "file-ack";
      fileId: string;
      index: number;
      bytes: number;
      crc32: number;
      ok: boolean;
      error?: string;
    }
  | { v: number; t: "all-sent" }
  | { v: number; t: "complete"; files: number; bytes: number }
  | { v: number; t: "cancel"; by: "sender" | "recipient"; reason: string }
  | { v: number; t: "error"; code: string; message: string };

/**
 * Omit that distributes over a union. A plain `Omit<ControlMessage, "v">`
 * collapses the union to its common keys, which would let any message
 * be built with any other message's fields.
 */
type ControlPayload = ControlMessage extends infer M
  ? M extends ControlMessage
    ? Omit<M, "v">
    : never
  : never;

export function encodeControl(msg: ControlPayload): string {
  return JSON.stringify({ v: PROTOCOL_VERSION, ...msg });
}

/**
 * Parse a control message. Returns null for anything that is not a
 * recognisable, version-matching control message — callers treat null
 * as a protocol error rather than guessing.
 */
export function decodeControl(raw: string): ControlMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const msg = parsed as Record<string, unknown>;
  if (msg.v !== PROTOCOL_VERSION) return null;
  if (typeof msg.t !== "string") return null;
  return msg as unknown as ControlMessage;
}

// ─── Data frames ─────────────────────────────────────────────────────

export interface FrameHeader {
  version: number;
  flags: number;
  fileIndex: number;
  sequence: number;
}

export function encodeFrame(
  fileIndex: number,
  sequence: number,
  payload: ArrayBuffer | Uint8Array
): ArrayBuffer {
  const bytes = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
  const out = new Uint8Array(FRAME_HEADER_BYTES + bytes.byteLength);
  const view = new DataView(out.buffer);
  view.setUint16(0, PROTOCOL_VERSION, false);
  view.setUint16(2, 0, false);
  view.setUint32(4, fileIndex, false);
  view.setUint32(8, sequence, false);
  out.set(bytes, FRAME_HEADER_BYTES);
  return out.buffer;
}

export interface DecodedFrame {
  header: FrameHeader;
  payload: Uint8Array;
}

/** Returns null when the buffer is too short or the version is wrong. */
export function decodeFrame(buffer: ArrayBuffer): DecodedFrame | null {
  if (buffer.byteLength < FRAME_HEADER_BYTES) return null;
  const view = new DataView(buffer);
  const version = view.getUint16(0, false);
  if (version !== PROTOCOL_VERSION) return null;
  return {
    header: {
      version,
      flags: view.getUint16(2, false),
      fileIndex: view.getUint32(4, false),
      sequence: view.getUint32(8, false),
    },
    payload: new Uint8Array(buffer, FRAME_HEADER_BYTES),
  };
}

/**
 * Largest payload that fits one SCTP message on this connection.
 *
 * `reported` is `RTCPeerConnection.sctp?.maxMessageSize`. Zero, NaN and
 * undefined all mean "unknown", which maps to the conservative default
 * rather than to an optimistic guess.
 */
export function negotiateChunkSize(reported: number | undefined | null): number {
  const usable =
    typeof reported === "number" && Number.isFinite(reported) && reported > 0
      ? reported
      : SAFE_DEFAULT_MAX_MESSAGE;
  const forPayload = usable - FRAME_HEADER_BYTES;
  if (forPayload < MIN_CHUNK_BYTES) {
    // Still return the floor: a channel this constrained cannot carry
    // the protocol, and the caller surfaces that as a real error rather
    // than sending frames that will close the channel.
    return MIN_CHUNK_BYTES;
  }
  return Math.min(MAX_CHUNK_BYTES, forPayload);
}

/** True when the connection genuinely cannot carry our minimum frame. */
export function chunkSizeUnsupported(reported: number | undefined | null): boolean {
  if (typeof reported !== "number" || !Number.isFinite(reported) || reported <= 0) {
    return false; // unknown → we use the safe default, which is fine
  }
  return reported - FRAME_HEADER_BYTES < MIN_CHUNK_BYTES;
}

// ─── Names ───────────────────────────────────────────────────────────

/**
 * Reduce a peer-supplied name to something safe to display and to pass
 * to a file-system API.
 *
 * The name arrives from the *other browser*, so it is untrusted input:
 * path separators, traversal sequences, control characters and
 * Windows-reserved device names all have to go before this string is
 * handed to `getFileHandle()` or rendered.
 */
export function safeFileName(input: string): string {
  let name = String(input ?? "");

  // Take the leaf of anything path-shaped, both separators.
  name = name.split(/[/\\]/).pop() ?? "";

  // Control characters, null bytes and characters illegal on Windows.
  // eslint-disable-next-line no-control-regex
  name = name.replace(/[\x00-\x1f\x7f<>:"|?*]/g, "_");

  // Leading dots hide the file; trailing dots and spaces are stripped
  // by Windows and would desync the name we acked.
  name = name.replace(/^\.+/, "").replace(/[. ]+$/, "");

  // Reserved DOS device names, with or without an extension.
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(name)) {
    name = `_${name}`;
  }

  if (!name) name = "unnamed_file";

  if (name.length > 200) {
    const dot = name.lastIndexOf(".");
    const ext = dot > 0 ? name.slice(dot, dot + 16) : "";
    name = name.slice(0, 200 - ext.length) + ext;
  }

  return name;
}

/**
 * Make every name in a list unique, inserting " (2)", " (3)" … before
 * the extension. Two files legitimately called `IMG_0001.jpg` from
 * different folders must not overwrite each other on disk.
 */
export function dedupeFileNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((raw) => {
    const name = safeFileName(raw);
    const key = name.toLowerCase();
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count === 0) return name;

    const dot = name.lastIndexOf(".");
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    // Guard against the suffixed name colliding with a real file too.
    let n = count + 1;
    let candidate = `${stem} (${n})${ext}`;
    while (seen.has(candidate.toLowerCase())) {
      n += 1;
      candidate = `${stem} (${n})${ext}`;
    }
    seen.set(candidate.toLowerCase(), 1);
    return candidate;
  });
}

// ─── Integrity ───────────────────────────────────────────────────────

/**
 * CRC-32 (IEEE 802.3), computed incrementally.
 *
 * Chosen over SHA-256 because Web Crypto has no streaming digest: a
 * cryptographic hash would mean holding the whole file in memory, which
 * is exactly what this feature must never do. CRC-32 updates per chunk
 * in constant memory and reliably catches truncation, reordering and
 * transport corruption.
 *
 * It is a corruption check, NOT an authenticity check — a hostile
 * sender could forge a matching CRC. That is an acceptable boundary
 * here: the recipient already chose to accept files from this sender.
 */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export class Crc32 {
  private state = 0xffffffff;

  update(bytes: Uint8Array): void {
    let crc = this.state;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    this.state = crc;
  }

  /** Current digest. Safe to call mid-stream. */
  value(): number {
    return (this.state ^ 0xffffffff) >>> 0;
  }

  reset(): void {
    this.state = 0xffffffff;
  }
}

export function crc32(bytes: Uint8Array): number {
  const c = new Crc32();
  c.update(bytes);
  return c.value();
}

// ─── Manifest validation ─────────────────────────────────────────────

export interface ManifestLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
}

export type ManifestCheck =
  | { ok: true; manifest: Manifest }
  | { ok: false; code: string; message: string };

/**
 * Validate a manifest received from a peer against local limits before
 * a single byte is accepted. Everything here is attacker-controlled.
 */
export function validateManifest(input: unknown, limits: ManifestLimits): ManifestCheck {
  if (!input || typeof input !== "object") {
    return { ok: false, code: "BAD_MANIFEST", message: "Manifest was not an object." };
  }
  const raw = input as { files?: unknown; totalBytes?: unknown };
  if (!Array.isArray(raw.files) || raw.files.length === 0) {
    return { ok: false, code: "BAD_MANIFEST", message: "Manifest listed no files." };
  }
  if (raw.files.length > limits.maxFiles) {
    return {
      ok: false,
      code: "TOO_MANY_FILES",
      message: `Live Send carries up to ${limits.maxFiles} files at a time.`,
    };
  }

  const files: ManifestFile[] = [];
  let total = 0;

  for (const entry of raw.files) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, code: "BAD_MANIFEST", message: "Malformed file entry." };
    }
    const f = entry as Record<string, unknown>;
    // Require a real number rather than coercing: `Number(null)` is 0,
    // which would quietly turn a malformed entry into a valid 0-byte
    // file instead of rejecting the manifest.
    const size = f.size;
    if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0) {
      return { ok: false, code: "BAD_SIZE", message: "A file reported an invalid size." };
    }
    if (size > limits.maxFileBytes) {
      return {
        ok: false,
        code: "FILE_TOO_LARGE",
        message: "A file is larger than this browser can receive.",
      };
    }
    if (typeof f.id !== "string" || f.id.length === 0 || f.id.length > 64) {
      return { ok: false, code: "BAD_MANIFEST", message: "A file had an invalid id." };
    }
    total += size;
    files.push({
      id: f.id,
      name: safeFileName(typeof f.name === "string" ? f.name : ""),
      size,
      mimeType:
        typeof f.mimeType === "string" && f.mimeType.length <= 128
          ? f.mimeType
          : "application/octet-stream",
    });
  }

  if (total > limits.maxTotalBytes) {
    return {
      ok: false,
      code: "TRANSFER_TOO_LARGE",
      message: "This transfer is larger than this browser can receive.",
    };
  }

  // Trust our own sum, not the peer's claim, but flag disagreement:
  // a mismatch means the peers disagree about the transfer.
  const claimed = Number(raw.totalBytes);
  if (Number.isFinite(claimed) && claimed !== total) {
    return {
      ok: false,
      code: "MANIFEST_MISMATCH",
      message: "The file list is inconsistent. Ask the sender to restart.",
    };
  }

  const names = dedupeFileNames(files.map((f) => f.name));
  files.forEach((f, i) => {
    f.name = names[i];
  });

  return { ok: true, manifest: { files, totalBytes: total } };
}
