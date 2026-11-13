import { describe, expect, it, vi } from "vitest";
import { LiveSender, type DataChannelLike } from "@/lib/live/sender";
import { LiveReceiver } from "@/lib/live/receiver";
import { BUFFER_HIGH_WATER, decodeFrame, encodeControl } from "@/lib/live/protocol";
import type { FileWriter, SaveTarget } from "@/lib/live/saver";
import type { ReceiveCapability } from "@/lib/live/limits";

/**
 * In-process DataChannel pair.
 *
 * Exercises the real sender and receiver against each other without a
 * browser: same framing, same control messages, same acks, same
 * validation. The browser end-to-end test (e2e/live-send.spec.ts) then
 * covers what this cannot — real RTCPeerConnection, real SCTP limits,
 * real disk writes.
 *
 * `bufferedAmount` is simulated so backpressure is observable: sends
 * accumulate, and `drain()` empties the queue and fires
 * `bufferedamountlow`, which is exactly the event the sender parks on.
 */
class FakeChannel implements DataChannelLike {
  peer!: FakeChannel;
  readyState = "open";
  bufferedAmountLowThreshold = 0;
  bufferedAmount = 0;
  /** When true, queued bytes are only released by an explicit drain(). */
  holdBuffer = false;
  sentCount = 0;

  private listeners = new Map<string, Set<(ev: unknown) => void>>();

  send(data: string | ArrayBuffer): void {
    if (this.readyState !== "open") throw new Error("channel closed");
    this.sentCount += 1;
    const size = typeof data === "string" ? data.length : data.byteLength;
    this.bufferedAmount += size;
    if (!this.holdBuffer) {
      // Default: the queue clears immediately, like a fast link.
      this.bufferedAmount = 0;
    }
    // Deliver asynchronously: a real channel never calls the peer's
    // handler synchronously inside send().
    queueMicrotask(() => this.peer.emit("message", { data }));
  }

  drain(): void {
    this.bufferedAmount = 0;
    this.emit("bufferedamountlow", {});
  }

  close(): void {
    this.readyState = "closed";
    this.emit("close", {});
    this.peer.readyState = "closed";
    this.peer.emit("close", {});
  }

  /** Drop the connection on one side only, as a network failure would. */
  breakLink(): void {
    this.readyState = "closed";
    this.emit("close", {});
  }

  addEventListener(type: string, listener: (ev: unknown) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (ev: unknown) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0;
  }

  emit(type: string, ev: unknown): void {
    for (const l of [...(this.listeners.get(type) ?? [])]) l(ev);
  }
}

function channelPair(): [FakeChannel, FakeChannel] {
  const a = new FakeChannel();
  const b = new FakeChannel();
  a.peer = b;
  b.peer = a;
  return [a, b];
}

/** Collects received bytes so the test can compare them to the source. */
class MemorySaveTarget implements SaveTarget {
  readonly kind = "stream" as const;
  readonly files = new Map<string, Uint8Array>();
  /** Set to fail the Nth created writer, to test receiver-side errors. */
  failOnWrite: string | null = null;

  async createWriter(name: string): Promise<FileWriter> {
    const parts: Uint8Array[] = [];
    const shouldFail = this.failOnWrite === name;
    const files = this.files;

    return {
      async write(chunk) {
        if (shouldFail) throw new Error("disk full");
        parts.push(chunk.slice());
      },
      async close() {
        const total = parts.reduce((s, p) => s + p.byteLength, 0);
        const out = new Uint8Array(total);
        let off = 0;
        for (const p of parts) {
          out.set(p, off);
          off += p.byteLength;
        }
        files.set(name, out);
      },
      async abort() {
        parts.length = 0;
      },
    };
  }
}

const STREAM_CAP: ReceiveCapability = {
  saveMethod: "stream",
  maxFileBytes: 1024 * 1024 * 1024,
  maxTotalBytes: 1024 * 1024 * 1024,
  limitation: null,
};

function bytes(n: number, seed = 7): Uint8Array {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = (i * seed + 11) % 256;
  return out;
}

function fileOf(name: string, data: Uint8Array, type = "application/octet-stream") {
  // Pass the underlying buffer: a Uint8Array view is not a BlobPart
  // under the DOM lib this project targets.
  const buffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer;
  return { id: `id-${name}`, name, file: new File([buffer], name, { type }) };
}

/** Wire a receiver that auto-accepts into `target`. */
function autoAcceptReceiver(
  channel: FakeChannel,
  target: SaveTarget,
  capability: ReceiveCapability = STREAM_CAP
): LiveReceiver {
  const receiver: LiveReceiver = new LiveReceiver(channel, {
    maxMessageSize: 65536,
    capability,
    callbacks: { onManifest: () => receiver.accept(target) },
  });
  return receiver;
}

describe("sender ↔ receiver, end to end in process", () => {
  it("delivers a single file byte-for-byte", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    autoAcceptReceiver(recvCh, target);

    const source = bytes(200_000);
    const sender = new LiveSender(sendCh, [fileOf("report.pdf", source)], {
      maxMessageSize: 65536,
    });

    await sender.run();

    const received = target.files.get("report.pdf")!;
    expect(received.byteLength).toBe(source.byteLength);
    expect(received).toEqual(source);
  });

  it("delivers several files sequentially, each intact", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    autoAcceptReceiver(recvCh, target);

    const a = bytes(1, 3);
    const b = bytes(70_000, 5);
    const c = bytes(130_000, 9);

    const sender = new LiveSender(
      sendCh,
      [fileOf("a.bin", a), fileOf("b.bin", b), fileOf("c.bin", c)],
      { maxMessageSize: 65536 }
    );
    await sender.run();

    expect(target.files.get("a.bin")).toEqual(a);
    expect(target.files.get("b.bin")).toEqual(b);
    expect(target.files.get("c.bin")).toEqual(c);
  });

  it("handles a zero-byte file", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    autoAcceptReceiver(recvCh, target);

    await new LiveSender(sendCh, [fileOf("empty.txt", new Uint8Array())], {
      maxMessageSize: 65536,
    }).run();

    expect(target.files.get("empty.txt")).toEqual(new Uint8Array());
  });

  it("splits a file into frames no larger than the negotiated chunk", async () => {
    const [sendCh, recvCh] = channelPair();
    const seen: number[] = [];
    recvCh.addEventListener("message", (ev) => {
      const data = (ev as { data: unknown }).data;
      if (data instanceof ArrayBuffer) {
        seen.push(decodeFrame(data)!.payload.byteLength);
      }
    });

    const target = new MemorySaveTarget();
    autoAcceptReceiver(recvCh, target);

    // 32 KiB limit → 32756-byte payloads after the 12-byte header.
    await new LiveSender(sendCh, [fileOf("x.bin", bytes(100_000))], {
      maxMessageSize: 32 * 1024,
    }).run();

    expect(seen.length).toBeGreaterThan(1);
    expect(Math.max(...seen)).toBeLessThanOrEqual(32 * 1024 - 12);
    expect(seen.reduce((s, n) => s + n, 0)).toBe(100_000);
  });

  it("reports progress monotonically up to the total", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    autoAcceptReceiver(recvCh, target);

    const seen: number[] = [];
    await new LiveSender(sendCh, [fileOf("p.bin", bytes(150_000))], {
      maxMessageSize: 65536,
      callbacks: { onProgress: (p) => seen.push(p.bytesSent) },
    }).run();

    expect(seen.length).toBeGreaterThan(1);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    expect(seen.at(-1)).toBe(150_000);
  });
});

describe("backpressure", () => {
  it("stops sending while the channel queue is above the high-water mark", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    autoAcceptReceiver(recvCh, target);

    sendCh.holdBuffer = true;

    const total = BUFFER_HIGH_WATER * 3;
    const sender = new LiveSender(sendCh, [fileOf("big.bin", bytes(total))], {
      maxMessageSize: 256 * 1024,
    });
    const run = sender.run();

    // Let it fill the queue, then confirm it has parked rather than
    // reading the whole file into the channel.
    await new Promise((r) => setTimeout(r, 20));
    const parkedAt = sendCh.bufferedAmount;
    expect(parkedAt).toBeGreaterThanOrEqual(BUFFER_HIGH_WATER);
    expect(parkedAt).toBeLessThan(total);

    // Drain repeatedly until the transfer finishes.
    const pump = setInterval(() => sendCh.drain(), 5);
    await run;
    clearInterval(pump);

    expect(target.files.get("big.bin")!.byteLength).toBe(total);
  });

  it("sets the low-water threshold on the channel", () => {
    const [sendCh] = channelPair();
    new LiveSender(sendCh, [], {});
    expect(sendCh.bufferedAmountLowThreshold).toBeGreaterThan(0);
  });
});

describe("receiver validation", () => {
  it("refuses a manifest larger than the receiving browser can take", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();

    const tiny: ReceiveCapability = {
      saveMethod: "blob",
      maxFileBytes: 1000,
      maxTotalBytes: 1000,
      limitation: "capped",
    };
    autoAcceptReceiver(recvCh, target, tiny);

    const rejected = vi.fn();
    const sender = new LiveSender(sendCh, [fileOf("big.bin", bytes(5000))], {
      maxMessageSize: 65536,
      callbacks: { onRejected: rejected },
    });

    await expect(sender.run()).rejects.toThrow();
    expect(rejected).toHaveBeenCalledWith("FILE_TOO_LARGE", expect.any(String));
    // Nothing was written: the refusal happened before any bytes moved.
    expect(target.files.size).toBe(0);
  });

  it("rejects a chunk that would overrun the declared file size", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    const onError = vi.fn();

    const receiver = new LiveReceiver(recvCh, {
      maxMessageSize: 65536,
      capability: STREAM_CAP,
      callbacks: { onManifest: () => receiver.accept(target), onError },
    });

    // Hand-rolled sender: declares 10 bytes, sends 20.
    recvCh.peer.send(encodeControl({ t: "hello", role: "sender", maxMessageSize: 65536 }));
    recvCh.peer.send(
      encodeControl({
        t: "manifest",
        files: [{ id: "1", name: "lie.bin", size: 10, mimeType: "" }],
        totalBytes: 10,
      })
    );
    await new Promise((r) => setTimeout(r, 10));
    recvCh.peer.send(encodeControl({ t: "file-start", fileId: "1", index: 0, size: 10 }));
    await new Promise((r) => setTimeout(r, 10));

    const { encodeFrame } = await import("@/lib/live/protocol");
    recvCh.peer.send(encodeFrame(0, 0, bytes(20)));
    await new Promise((r) => setTimeout(r, 20));

    expect(onError).toHaveBeenCalledWith("FILE_OVERRUN", expect.any(String));
    expect(target.files.size).toBe(0);
  });

  it("rejects a frame whose sequence skips", async () => {
    const [, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    const onError = vi.fn();

    const receiver = new LiveReceiver(recvCh, {
      maxMessageSize: 65536,
      capability: STREAM_CAP,
      callbacks: { onManifest: () => receiver.accept(target), onError },
    });

    const { encodeFrame } = await import("@/lib/live/protocol");
    recvCh.peer.send(
      encodeControl({
        t: "manifest",
        files: [{ id: "1", name: "s.bin", size: 100, mimeType: "" }],
        totalBytes: 100,
      })
    );
    await new Promise((r) => setTimeout(r, 10));
    recvCh.peer.send(encodeControl({ t: "file-start", fileId: "1", index: 0, size: 100 }));
    await new Promise((r) => setTimeout(r, 10));
    recvCh.peer.send(encodeFrame(0, 5, bytes(10))); // expected sequence 0
    await new Promise((r) => setTimeout(r, 20));

    expect(onError).toHaveBeenCalledWith("FRAME_OUT_OF_ORDER", expect.any(String));
  });

  it("rejects a frame tagged with the wrong file index", async () => {
    const [, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    const onError = vi.fn();

    const receiver = new LiveReceiver(recvCh, {
      maxMessageSize: 65536,
      capability: STREAM_CAP,
      callbacks: { onManifest: () => receiver.accept(target), onError },
    });

    const { encodeFrame } = await import("@/lib/live/protocol");
    recvCh.peer.send(
      encodeControl({
        t: "manifest",
        files: [{ id: "1", name: "s.bin", size: 100, mimeType: "" }],
        totalBytes: 100,
      })
    );
    await new Promise((r) => setTimeout(r, 10));
    recvCh.peer.send(encodeControl({ t: "file-start", fileId: "1", index: 0, size: 100 }));
    await new Promise((r) => setTimeout(r, 10));
    recvCh.peer.send(encodeFrame(3, 0, bytes(10)));
    await new Promise((r) => setTimeout(r, 20));

    expect(onError).toHaveBeenCalledWith("FRAME_FILE_MISMATCH", expect.any(String));
  });

  it("rejects data that arrives before the file started", async () => {
    const [, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    const onError = vi.fn();

    const receiver = new LiveReceiver(recvCh, {
      maxMessageSize: 65536,
      capability: STREAM_CAP,
      callbacks: { onManifest: () => receiver.accept(target), onError },
    });

    const { encodeFrame } = await import("@/lib/live/protocol");
    recvCh.peer.send(
      encodeControl({
        t: "manifest",
        files: [{ id: "1", name: "s.bin", size: 100, mimeType: "" }],
        totalBytes: 100,
      })
    );
    await new Promise((r) => setTimeout(r, 10));
    recvCh.peer.send(encodeFrame(0, 0, bytes(10)));
    await new Promise((r) => setTimeout(r, 20));

    expect(onError).toHaveBeenCalledWith("UNEXPECTED_DATA", expect.any(String));
  });

  it("fails the file when the integrity check does not match", async () => {
    const [, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    const onError = vi.fn();

    const receiver = new LiveReceiver(recvCh, {
      maxMessageSize: 65536,
      capability: STREAM_CAP,
      callbacks: { onManifest: () => receiver.accept(target), onError },
    });

    const { encodeFrame } = await import("@/lib/live/protocol");
    const payload = bytes(50);
    recvCh.peer.send(
      encodeControl({
        t: "manifest",
        files: [{ id: "1", name: "c.bin", size: 50, mimeType: "" }],
        totalBytes: 50,
      })
    );
    await new Promise((r) => setTimeout(r, 10));
    recvCh.peer.send(encodeControl({ t: "file-start", fileId: "1", index: 0, size: 50 }));
    await new Promise((r) => setTimeout(r, 10));
    recvCh.peer.send(encodeFrame(0, 0, payload));
    await new Promise((r) => setTimeout(r, 10));
    // Correct byte count, wrong checksum.
    recvCh.peer.send(
      encodeControl({ t: "file-end", fileId: "1", index: 0, bytes: 50, crc32: 123 })
    );
    await new Promise((r) => setTimeout(r, 20));

    expect(onError).toHaveBeenCalledWith("INTEGRITY_MISMATCH", expect.any(String));
    expect(target.files.size).toBe(0);
  });

  it("refuses a file-start that is not in the accepted manifest", async () => {
    const [, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    const onError = vi.fn();

    const receiver = new LiveReceiver(recvCh, {
      maxMessageSize: 65536,
      capability: STREAM_CAP,
      callbacks: { onManifest: () => receiver.accept(target), onError },
    });

    recvCh.peer.send(
      encodeControl({
        t: "manifest",
        files: [{ id: "1", name: "a.bin", size: 10, mimeType: "" }],
        totalBytes: 10,
      })
    );
    await new Promise((r) => setTimeout(r, 10));
    // Different id and size than anything agreed.
    recvCh.peer.send(encodeControl({ t: "file-start", fileId: "99", index: 0, size: 10 }));
    await new Promise((r) => setTimeout(r, 20));

    expect(onError).toHaveBeenCalledWith("MANIFEST_MISMATCH", expect.any(String));
  });

  it("does not report completion when a file never arrived", async () => {
    const [, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    const onError = vi.fn();

    const receiver = new LiveReceiver(recvCh, {
      maxMessageSize: 65536,
      capability: STREAM_CAP,
      callbacks: { onManifest: () => receiver.accept(target), onError },
    });

    recvCh.peer.send(
      encodeControl({
        t: "manifest",
        files: [
          { id: "1", name: "a.bin", size: 1, mimeType: "" },
          { id: "2", name: "b.bin", size: 1, mimeType: "" },
        ],
        totalBytes: 2,
      })
    );
    await new Promise((r) => setTimeout(r, 10));
    recvCh.peer.send(encodeControl({ t: "all-sent" }));
    await new Promise((r) => setTimeout(r, 20));

    expect(onError).toHaveBeenCalledWith("INCOMPLETE", expect.any(String));
    expect(receiver.currentPhase()).toBe("failed");
  });
});

describe("cancellation and interruption", () => {
  it("lets the sender cancel and tells the receiver why", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    const cancelled = vi.fn();

    const receiver = new LiveReceiver(recvCh, {
      maxMessageSize: 65536,
      capability: STREAM_CAP,
      callbacks: {
        onManifest: () => receiver.accept(target),
        onCancelledByPeer: cancelled,
      },
    });

    sendCh.holdBuffer = true;
    const sender = new LiveSender(sendCh, [fileOf("big.bin", bytes(BUFFER_HIGH_WATER * 2))], {
      maxMessageSize: 65536,
    });
    const run = sender.run();

    await new Promise((r) => setTimeout(r, 20));
    sender.cancel("User pressed cancel");
    sendCh.drain();
    await run; // cancel resolves rather than rejecting

    await new Promise((r) => setTimeout(r, 10));
    expect(sender.currentPhase()).toBe("cancelled");
    expect(cancelled).toHaveBeenCalledWith("User pressed cancel");
  });

  it("surfaces a dropped connection as an interruption, not a success", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    autoAcceptReceiver(recvCh, target);

    sendCh.holdBuffer = true;
    const onError = vi.fn();
    const sender = new LiveSender(sendCh, [fileOf("big.bin", bytes(BUFFER_HIGH_WATER * 2))], {
      maxMessageSize: 65536,
      callbacks: { onError },
    });
    const run = sender.run();

    await new Promise((r) => setTimeout(r, 20));
    sendCh.breakLink();

    await expect(run).rejects.toThrow();
    expect(sender.currentPhase()).toBe("failed");
    expect(target.files.has("big.bin")).toBe(false);
  });

  it("tells the sender when the recipient declines", async () => {
    const [sendCh, recvCh] = channelPair();
    const onRejected = vi.fn();

    const receiver = new LiveReceiver(recvCh, {
      maxMessageSize: 65536,
      capability: STREAM_CAP,
      callbacks: { onManifest: () => receiver.reject("DECLINED", "No thanks") },
    });

    const sender = new LiveSender(sendCh, [fileOf("a.bin", bytes(10))], {
      maxMessageSize: 65536,
      callbacks: { onRejected },
    });

    await expect(sender.run()).rejects.toThrow();
    expect(onRejected).toHaveBeenCalledWith("DECLINED", "No thanks");
  });

  it("fails the transfer when the receiver cannot write to disk", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    target.failOnWrite = "a.bin";
    autoAcceptReceiver(recvCh, target);

    const sender = new LiveSender(sendCh, [fileOf("a.bin", bytes(5000))], {
      maxMessageSize: 65536,
    });

    await expect(sender.run()).rejects.toThrow();
    expect(target.files.size).toBe(0);
  });
});

describe("listener hygiene", () => {
  it("removes every sender listener once the run settles", async () => {
    const [sendCh, recvCh] = channelPair();
    const target = new MemorySaveTarget();
    autoAcceptReceiver(recvCh, target);

    const sender = new LiveSender(sendCh, [fileOf("a.bin", bytes(1000))], {
      maxMessageSize: 65536,
    });
    expect(sendCh.listenerCount("message")).toBe(1);

    await sender.run();

    for (const type of ["message", "bufferedamountlow", "close", "error"]) {
      expect(sendCh.listenerCount(type)).toBe(0);
    }
  });

  it("removes receiver listeners on detach", () => {
    const [, recvCh] = channelPair();
    const receiver = new LiveReceiver(recvCh, { maxMessageSize: 65536, capability: STREAM_CAP });
    expect(recvCh.listenerCount("message")).toBe(1);
    receiver.detach();
    expect(recvCh.listenerCount("message")).toBe(0);
  });
});
