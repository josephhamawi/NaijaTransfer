/**
 * Live Send — receiver engine.
 *
 * Mirror of sender.ts: consumes the DataChannel, validates everything
 * the peer claims, and writes bytes to a SaveTarget. No Firebase, no
 * React, no network of its own.
 *
 * Validation is the point of this file. Every frame is checked against
 * the manifest the recipient actually accepted:
 *
 *   • the frame's fileIndex must be the file currently in flight
 *   • sequence numbers must advance by exactly one
 *   • a chunk may not push the file past its declared size
 *   • at `file-end`, byte count and CRC-32 must both match
 *
 * Anything else aborts the session instead of writing a partial or
 * mislabelled file to the user's disk.
 */

import {
  Crc32,
  decodeControl,
  decodeFrame,
  encodeControl,
  negotiateChunkSize,
  validateManifest,
  type Manifest,
  type ManifestFile,
} from "./protocol";
import { detectReceiveCapability, type ReceiveCapability } from "./limits";
import type { DataChannelLike } from "./sender";
import { ProtocolError } from "./sender";
import type { FileWriter, SaveTarget } from "./saver";

export type ReceiverPhase =
  | "connecting"
  | "awaiting-manifest"
  | "awaiting-acceptance"
  | "receiving"
  | "complete"
  | "cancelled"
  | "failed";

export interface ReceiverProgress {
  bytesReceived: number;
  totalBytes: number;
  fileIndex: number;
  fileCount: number;
  currentFileName: string;
}

export interface ReceiverCallbacks {
  onPhase?(phase: ReceiverPhase, detail?: string): void;
  /** Manifest passed validation; the UI must now ask the user. */
  onManifest?(manifest: Manifest, capability: ReceiveCapability): void;
  onProgress?(progress: ReceiverProgress): void;
  onFileSaved?(file: ManifestFile): void;
  onError?(code: string, message: string): void;
  onCancelledByPeer?(reason: string): void;
}

export interface ReceiverOptions {
  maxMessageSize?: number;
  capability?: ReceiveCapability;
  callbacks?: ReceiverCallbacks;
}

export class LiveReceiver {
  private readonly channel: DataChannelLike;
  private readonly cb: ReceiverCallbacks;
  private readonly capability: ReceiveCapability;
  private readonly chunkSize: number;

  private phase: ReceiverPhase = "connecting";
  private manifest: Manifest | null = null;
  private target: SaveTarget | null = null;

  private activeIndex = -1;
  private activeWriter: FileWriter | null = null;
  private activeCrc = new Crc32();
  private activeBytes = 0;
  private expectedSequence = 0;
  private bytesReceived = 0;
  private filesSaved = 0;
  private finished = false;
  /** Serialises writes so chunks land in order even though write() is async. */
  private writeChain: Promise<void> = Promise.resolve();

  private readonly onMessage = (ev: unknown) => {
    void this.handleMessage(ev as { data: unknown });
  };
  private readonly onClose = () => {
    if (!this.finished) this.fail("CHANNEL_CLOSED", "Connection interrupted — ask the sender to restart the transfer.");
  };
  private readonly onError = () => {
    if (!this.finished) this.fail("CHANNEL_ERROR", "The connection failed. Ask the sender to restart the transfer.");
  };

  constructor(channel: DataChannelLike, options: ReceiverOptions = {}) {
    this.channel = channel;
    this.cb = options.callbacks ?? {};
    this.capability = options.capability ?? detectReceiveCapability();
    this.chunkSize = negotiateChunkSize(options.maxMessageSize);

    channel.addEventListener("message", this.onMessage);
    channel.addEventListener("close", this.onClose);
    channel.addEventListener("error", this.onError);
    this.setPhase("awaiting-manifest");
  }

  /** The validated manifest, once one has arrived. */
  pendingManifest(): Manifest | null {
    return this.manifest;
  }

  receiveCapability(): ReceiveCapability {
    return this.capability;
  }

  /**
   * Accept the transfer and start writing into `target`.
   *
   * Called from the UI after the user has reviewed the manifest and —
   * on the streaming path — picked a folder, which is the user gesture
   * the File System Access API requires.
   */
  accept(target: SaveTarget): void {
    if (!this.manifest) {
      throw new Error("accept() called before a manifest arrived");
    }
    this.target = target;
    this.send(
      encodeControl({
        t: "accept",
        saveMethod: target.kind,
        maxAcceptBytes: this.capability.maxTotalBytes,
        chunkSize: this.chunkSize,
      })
    );
    this.setPhase("receiving");
  }

  /** Decline before any bytes move. */
  reject(code = "DECLINED", message = "The recipient declined the transfer."): void {
    this.send(encodeControl({ t: "reject", code, message }));
    this.setPhase("cancelled", message);
    this.close();
  }

  cancel(reason = "Cancelled by recipient"): void {
    try {
      if (this.channel.readyState === "open") {
        this.send(encodeControl({ t: "cancel", by: "recipient", reason }));
      }
    } catch {
      /* already gone */
    }
    void this.abortActiveWriter();
    this.setPhase("cancelled", reason);
    this.close();
  }

  // ── message handling ───────────────────────────────────────────────

  private async handleMessage(ev: { data: unknown }): Promise<void> {
    const data = ev.data;

    if (typeof data === "string") {
      this.handleControl(data);
      return;
    }

    // Binary. Chrome gives ArrayBuffer; some stacks give Blob.
    let buffer: ArrayBuffer | null = null;
    if (data instanceof ArrayBuffer) buffer = data;
    else if (typeof Blob !== "undefined" && data instanceof Blob) {
      buffer = await data.arrayBuffer();
    } else if (ArrayBuffer.isView(data)) {
      const view = data as ArrayBufferView;
      buffer = view.buffer.slice(
        view.byteOffset,
        view.byteOffset + view.byteLength
      ) as ArrayBuffer;
    }
    if (!buffer) {
      this.fail("BAD_FRAME", "Received an unreadable message.");
      return;
    }

    // Chain the writes rather than awaiting inline: DataChannel message
    // events are not queued behind our async work, so without this a
    // slow disk write would let the next chunk overtake it.
    this.writeChain = this.writeChain.then(() => this.handleFrame(buffer!)).catch((err) => {
      const code = err instanceof ProtocolError ? err.code : "WRITE_FAILED";
      const message =
        err instanceof ProtocolError
          ? err.message
          : "Could not save the file. Check disk space and restart the transfer.";
      this.fail(code, message);
    });
  }

  private handleControl(raw: string): void {
    const msg = decodeControl(raw);
    if (!msg) {
      this.fail("BAD_CONTROL", "Received a message this version cannot read.");
      return;
    }

    switch (msg.t) {
      case "hello":
        this.setPhase("awaiting-manifest");
        break;

      case "manifest": {
        const check = validateManifest(
          { files: msg.files, totalBytes: msg.totalBytes },
          {
            maxFiles: 100,
            maxFileBytes: this.capability.maxFileBytes,
            maxTotalBytes: this.capability.maxTotalBytes,
          }
        );
        if (!check.ok) {
          this.send(encodeControl({ t: "reject", code: check.code, message: check.message }));
          this.fail(check.code, check.message);
          return;
        }
        this.manifest = check.manifest;
        this.setPhase("awaiting-acceptance");
        this.cb.onManifest?.(check.manifest, this.capability);
        break;
      }

      case "file-start":
        this.writeChain = this.writeChain
          .then(() => this.startFile(msg.index, msg.fileId, msg.size))
          .catch((err) => {
            const code = err instanceof ProtocolError ? err.code : "OPEN_FAILED";
            this.fail(
              code,
              err instanceof ProtocolError
                ? err.message
                : "Could not create the file on disk."
            );
          });
        break;

      case "file-end":
        this.writeChain = this.writeChain
          .then(() => this.finishFile(msg.index, msg.bytes, msg.crc32))
          .catch((err) => {
            const code = err instanceof ProtocolError ? err.code : "CLOSE_FAILED";
            this.fail(
              code,
              err instanceof ProtocolError ? err.message : "Could not finish writing the file."
            );
          });
        break;

      case "all-sent":
        this.writeChain = this.writeChain.then(() => this.completeSession());
        break;

      case "cancel":
        void this.abortActiveWriter();
        this.cb.onCancelledByPeer?.(msg.reason);
        this.setPhase("cancelled", msg.reason);
        this.close();
        break;

      case "error":
        this.fail(msg.code, msg.message);
        break;

      default:
        break;
    }
  }

  // ── file lifecycle ─────────────────────────────────────────────────

  private async startFile(index: number, fileId: string, size: number): Promise<void> {
    if (!this.manifest || !this.target) {
      throw new ProtocolError("NOT_ACCEPTED", "Sender started a file before acceptance.");
    }
    const entry = this.manifest.files[index];
    if (!entry || entry.id !== fileId || entry.size !== size) {
      throw new ProtocolError(
        "MANIFEST_MISMATCH",
        "The sender started a file that was not in the agreed list."
      );
    }
    if (this.activeWriter) {
      throw new ProtocolError("OVERLAPPING_FILES", "The sender started a file before finishing the last one.");
    }

    this.activeIndex = index;
    this.activeWriter = await this.target.createWriter(entry.name, entry.mimeType, entry.size);
    this.activeCrc = new Crc32();
    this.activeBytes = 0;
    this.expectedSequence = 0;
  }

  private async handleFrame(buffer: ArrayBuffer): Promise<void> {
    const frame = decodeFrame(buffer);
    if (!frame) {
      throw new ProtocolError("BAD_FRAME", "Received a malformed chunk.");
    }
    if (!this.activeWriter || !this.manifest) {
      throw new ProtocolError("UNEXPECTED_DATA", "Received file data before the file started.");
    }
    if (frame.header.fileIndex !== this.activeIndex) {
      throw new ProtocolError("FRAME_FILE_MISMATCH", "A chunk arrived for the wrong file.");
    }
    if (frame.header.sequence !== this.expectedSequence) {
      throw new ProtocolError(
        "FRAME_OUT_OF_ORDER",
        "Chunks arrived out of order. Restart the transfer."
      );
    }

    const entry = this.manifest.files[this.activeIndex];
    if (this.activeBytes + frame.payload.byteLength > entry.size) {
      throw new ProtocolError(
        "FILE_OVERRUN",
        "The sender sent more data than the file should contain."
      );
    }

    await this.activeWriter.write(frame.payload);
    this.activeCrc.update(frame.payload);
    this.activeBytes += frame.payload.byteLength;
    this.bytesReceived += frame.payload.byteLength;
    this.expectedSequence += 1;

    this.cb.onProgress?.({
      bytesReceived: this.bytesReceived,
      totalBytes: this.manifest.totalBytes,
      fileIndex: this.activeIndex,
      fileCount: this.manifest.files.length,
      currentFileName: entry.name,
    });
  }

  private async finishFile(index: number, bytes: number, crc: number): Promise<void> {
    if (!this.activeWriter || !this.manifest || index !== this.activeIndex) {
      throw new ProtocolError("UNEXPECTED_END", "The sender ended a file that was not open.");
    }
    const entry = this.manifest.files[index];
    const localCrc = this.activeCrc.value();

    const sizeOk = this.activeBytes === bytes && bytes === entry.size;
    const crcOk = localCrc === crc;

    if (!sizeOk || !crcOk) {
      await this.activeWriter.abort();
      this.activeWriter = null;
      this.send(
        encodeControl({
          t: "file-ack",
          fileId: entry.id,
          index,
          bytes: this.activeBytes,
          crc32: localCrc,
          ok: false,
          error: !sizeOk
            ? "Byte count did not match the manifest."
            : "Integrity check failed.",
        })
      );
      throw new ProtocolError(
        "INTEGRITY_MISMATCH",
        "A file arrived incomplete or corrupted. Ask the sender to restart."
      );
    }

    await this.activeWriter.close();
    this.activeWriter = null;
    this.filesSaved += 1;

    this.send(
      encodeControl({
        t: "file-ack",
        fileId: entry.id,
        index,
        bytes: this.activeBytes,
        crc32: localCrc,
        ok: true,
      })
    );
    this.cb.onFileSaved?.(entry);
  }

  private async completeSession(): Promise<void> {
    if (!this.manifest) return;
    if (this.filesSaved !== this.manifest.files.length) {
      this.fail(
        "INCOMPLETE",
        "The sender finished before every file arrived. Ask them to restart."
      );
      return;
    }
    if (this.target?.finish) {
      try {
        await this.target.finish();
      } catch {
        /* non-fatal: files are already written */
      }
    }
    this.finished = true;
    this.send(
      encodeControl({
        t: "complete",
        files: this.filesSaved,
        bytes: this.bytesReceived,
      })
    );
    this.setPhase("complete");
    // Keep the channel open briefly so `complete` actually flushes
    // before the sender's side tears the connection down.
  }

  private async abortActiveWriter(): Promise<void> {
    const writer = this.activeWriter;
    this.activeWriter = null;
    if (writer) {
      try {
        await writer.abort();
      } catch {
        /* nothing to do */
      }
    }
  }

  // ── plumbing ───────────────────────────────────────────────────────

  private send(data: string): void {
    if (this.channel.readyState !== "open") return;
    this.channel.send(data);
  }

  private fail(code: string, message: string): void {
    if (this.phase === "failed" || this.phase === "complete") return;
    void this.abortActiveWriter();
    try {
      if (this.channel.readyState === "open") {
        this.send(encodeControl({ t: "error", code, message }));
      }
    } catch {
      /* already gone */
    }
    this.setPhase("failed", message);
    this.cb.onError?.(code, message);
  }

  private setPhase(phase: ReceiverPhase, detail?: string): void {
    this.phase = phase;
    this.cb.onPhase?.(phase, detail);
  }

  currentPhase(): ReceiverPhase {
    return this.phase;
  }

  /** Detach listeners. Does not close the channel — the caller owns it. */
  detach(): void {
    this.channel.removeEventListener("message", this.onMessage);
    this.channel.removeEventListener("close", this.onClose);
    this.channel.removeEventListener("error", this.onError);
  }

  private close(): void {
    this.detach();
  }
}
