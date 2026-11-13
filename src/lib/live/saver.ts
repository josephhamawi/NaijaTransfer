/**
 * Where received bytes go.
 *
 * Two real strategies, chosen by what the receiving browser supports:
 *
 *   • DirectorySaveTarget — File System Access API. Each chunk is
 *     written straight through to disk, so a 10 GB file costs 10 GB of
 *     disk and a few hundred KB of memory. Requires a user gesture to
 *     obtain the directory handle.
 *
 *   • BlobSaveTarget — bounded fallback for browsers with no writable
 *     handle (Firefox, Safari). Chunks are kept as Blob parts and
 *     assembled when the file completes. This genuinely does hold the
 *     file, which is why limits.ts caps it hard and the sender refuses
 *     oversized transfers before sending anything.
 *
 * The Blob path keeps `Blob` parts rather than `ArrayBuffer`s on
 * purpose: a Blob is owned by the browser and may be backed by disk,
 * whereas an array of ArrayBuffers is unavoidably resident JS heap.
 * It is still accumulation — it is not pretending to stream.
 */

export interface FileWriter {
  write(chunk: Uint8Array): Promise<void>;
  /** Finish the file. Returns only once the bytes are durable/delivered. */
  close(): Promise<void>;
  /** Give up on this file and discard what was written where possible. */
  abort(): Promise<void>;
}

export interface SaveTarget {
  readonly kind: "stream" | "blob";
  createWriter(name: string, mimeType: string, expectedSize: number): Promise<FileWriter>;
  /** Called once the whole session finishes successfully. */
  finish?(): Promise<void>;
}

// ─── File System Access API ──────────────────────────────────────────

interface FsWritable {
  write(data: Uint8Array | Blob): Promise<void>;
  close(): Promise<void>;
  abort?(): Promise<void>;
}
interface FsFileHandle {
  createWritable(options?: { keepExistingData?: boolean }): Promise<FsWritable>;
}
export interface FsDirectoryHandle {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FsFileHandle>;
  queryPermission?(options?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission?(options?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
  readonly name?: string;
}

/**
 * Ask the user for a folder. MUST be called from a user gesture — the
 * browser rejects the call otherwise, which is why the receive UI wires
 * it to an explicit button rather than doing it on mount.
 */
export async function pickDirectory(): Promise<FsDirectoryHandle | null> {
  const picker = (globalThis as { showDirectoryPicker?: (opts?: unknown) => Promise<FsDirectoryHandle> })
    .showDirectoryPicker;
  if (typeof picker !== "function") return null;
  try {
    return await picker({ mode: "readwrite", id: "naijatransfer-live" });
  } catch {
    // User dismissed the picker. Not an error — the caller offers it again.
    return null;
  }
}

export class DirectorySaveTarget implements SaveTarget {
  readonly kind = "stream" as const;

  constructor(private readonly dir: FsDirectoryHandle) {}

  /** Confirm write permission is still granted before accepting bytes. */
  async ensurePermission(): Promise<boolean> {
    if (typeof this.dir.queryPermission === "function") {
      const state = await this.dir.queryPermission({ mode: "readwrite" });
      if (state === "granted") return true;
      if (typeof this.dir.requestPermission === "function") {
        return (await this.dir.requestPermission({ mode: "readwrite" })) === "granted";
      }
      return false;
    }
    return true;
  }

  async createWriter(name: string): Promise<FileWriter> {
    const handle = await this.dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    let closed = false;

    return {
      async write(chunk: Uint8Array) {
        // Copy into a standalone buffer: the caller reuses its receive
        // buffer, and `write` is async, so handing over a view of
        // shared memory risks writing bytes that changed underneath.
        await writable.write(chunk.slice());
      },
      async close() {
        if (closed) return;
        closed = true;
        await writable.close();
      },
      async abort() {
        if (closed) return;
        closed = true;
        try {
          if (writable.abort) await writable.abort();
          else await writable.close();
        } catch {
          /* nothing further to do */
        }
      },
    };
  }
}

// ─── Bounded Blob fallback ───────────────────────────────────────────

export interface SavedBlob {
  name: string;
  blob: Blob;
}

export class BlobSaveTarget implements SaveTarget {
  readonly kind = "blob" as const;
  private readonly saved: SavedBlob[] = [];

  constructor(
    private readonly maxFileBytes: number,
    private readonly onFileReady: (file: SavedBlob) => void
  ) {}

  async createWriter(name: string, mimeType: string): Promise<FileWriter> {
    const parts: Blob[] = [];
    let bytes = 0;
    const max = this.maxFileBytes;
    const saved = this.saved;
    const onFileReady = this.onFileReady;

    return {
      async write(chunk: Uint8Array) {
        bytes += chunk.byteLength;
        if (bytes > max) {
          // Defence in depth: the sender already refused this, and the
          // receiver checked the manifest. Reaching here means the peer
          // lied about sizes, so stop before memory is the problem.
          parts.length = 0;
          throw new Error("FALLBACK_LIMIT_EXCEEDED");
        }
        parts.push(new Blob([chunk.slice()]));
      },
      async close() {
        const blob = new Blob(parts, { type: mimeType || "application/octet-stream" });
        parts.length = 0;
        const entry = { name, blob };
        saved.push(entry);
        onFileReady(entry);
      },
      async abort() {
        parts.length = 0;
      },
    };
  }

  files(): SavedBlob[] {
    return this.saved;
  }
}

/**
 * Hand a completed Blob to the user as a download.
 *
 * Only used by the fallback path; the streaming path has already
 * written the file to the folder the user chose.
 */
export function triggerBlobDownload(file: SavedBlob): void {
  const url = URL.createObjectURL(file.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke late: Safari aborts the download if the URL dies too soon.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
