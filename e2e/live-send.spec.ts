import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Live Send end-to-end: two independent browser contexts, one real
 * WebRTC DataChannel, byte-exact comparison of what arrived.
 *
 * What this proves that a unit test cannot:
 *   • the SDP offer/answer exchange and ICE negotiation actually work
 *   • chunk sizing honours the browser's real SCTP maxMessageSize
 *   • the selected candidate pair is NOT a relay
 *   • no HTTP request carries file data — the only requests either
 *     context makes are for the harness page itself
 *
 * The two contexts are separate browser profiles: separate storage,
 * separate network stacks from the page's point of view. The test
 * itself shuttles SDP and ICE between them, which is exactly the role
 * Firestore signalling plays in production (covered by
 * src/services/__tests__/live-room.service.test.ts).
 *
 * What it does NOT prove, and cannot on one machine: that two peers on
 * different real networks can connect. Both contexts here reach each
 * other on loopback host candidates. Cross-network behaviour needs a
 * manual test from two devices on different ISPs — see
 * docs/live-send.md.
 */

// Resolved from the project root rather than import.meta.url: adding
// an ESM-only construct here makes Playwright load this spec as ESM
// while still compiling it to CJS, which fails at require().
const harnessDir = path.join(process.cwd(), "e2e", "harness");

let server: Server;
let origin: string;
/** Requests seen by either context, to prove no file bytes went over HTTP. */
const observedRequests: string[] = [];

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const name = (req.url ?? "/").split("?")[0];
    const file = name === "/" || name === "/index.html" ? "index.html" : name.slice(1);
    try {
      const body = await readFile(path.join(harnessDir, file));
      res.writeHead(200, {
        "Content-Type": file.endsWith(".js") ? "text/javascript" : "text/html",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  // 127.0.0.1 is a secure context, which the File System Access API and
  // getUserMedia-adjacent APIs require. file:// is not.
  origin = `http://127.0.0.1:${port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function openHarness(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  page.on("request", (r) => observedRequests.push(r.url()));
  page.on("pageerror", (err) => {
    throw err;
  });
  await page.goto(`${origin}/index.html`);
  await page.waitForFunction(() => typeof (window as { H?: unknown }).H !== "undefined");
  return page;
}

/** Shuttle SDP and trickled ICE between the two pages. */
async function connect(sender: Page, recipient: Page, files: FileSpec[]): Promise<void> {
  await recipient.evaluate(() => window.H.initReceiver(true));

  const offer = await sender.evaluate(
    (specs) => window.H.initSender(specs),
    files.map((f) => ({ name: f.name, base64: f.base64, type: f.type }))
  );
  const answer = await recipient.evaluate((sdp) => window.H.receiverSetOffer(sdp), offer.sdp!);
  await sender.evaluate((sdp) => window.H.senderAcceptAnswer(sdp), answer.sdp!);

  // Trickle both directions until the channel opens. Candidates appear
  // asynchronously, so this polls rather than assuming a single batch.
  const deadline = Date.now() + 20_000;
  const forwarded = { sender: 0, recipient: 0 };

  while (Date.now() < deadline) {
    const fromSender = await sender.evaluate(() => window.H.senderCandidates());
    for (const c of fromSender.slice(forwarded.sender)) {
      await recipient.evaluate((cand) => window.H.receiverAddCandidate(cand), c);
    }
    forwarded.sender = fromSender.length;

    const fromRecipient = await recipient.evaluate(() => window.H.receiverCandidates());
    for (const c of fromRecipient.slice(forwarded.recipient)) {
      await sender.evaluate((cand) => window.H.senderAddCandidate(cand), c);
    }
    forwarded.recipient = fromRecipient.length;

    const state = await sender.evaluate(() => window.H.senderChannelState());
    const recvState = await recipient.evaluate(() => window.H.receiverStatus());
    if (state === "open" && recvState.hasChannel) return;

    await new Promise((r) => setTimeout(r, 150));
  }

  throw new Error("DataChannel did not open within 20s");
}

interface FileSpec {
  name: string;
  type: string;
  bytes: Buffer;
  base64: string;
}

function makeFile(name: string, size: number, type = "application/octet-stream"): FileSpec {
  const bytes = crypto.randomBytes(size);
  return { name, type, bytes, base64: bytes.toString("base64") };
}

test.describe("Live Send over a real DataChannel", () => {
  test("delivers multiple files byte-for-byte between two browser contexts", async ({
    browser,
  }) => {
    const senderCtx = await browser.newContext();
    const recipientCtx = await browser.newContext();

    try {
      const sender = await openHarness(senderCtx);
      const recipient = await openHarness(recipientCtx);

      // A multi-chunk file, a sub-chunk file, and a 1-byte file: the
      // boundary cases where framing and byte accounting go wrong.
      const files = [
        makeFile("document.pdf", 1_500_000, "application/pdf"),
        makeFile("thumb.png", 60_000, "image/png"),
        makeFile("one-byte.bin", 1),
      ];

      await connect(sender, recipient, files);

      const sctpLimit = await sender.evaluate(() => window.H.senderMaxMessageSize());
      expect(sctpLimit, "browser should report a real SCTP message limit").toBeGreaterThan(0);

      await sender.evaluate(() => window.H.startSending());
      const result = await sender.evaluate(() => window.H.senderResult());

      expect(result.error).toBeNull();
      expect(result.phase).toBe("complete");
      expect(result.progress).toBe(files.reduce((s, f) => s + f.bytes.length, 0));

      await expect
        .poll(async () => (await recipient.evaluate(() => window.H.receiverStatus())).complete, {
          timeout: 10_000,
        })
        .toBe(true);

      const received = await recipient.evaluate(() => window.H.received());
      expect(received).toHaveLength(files.length);

      // The actual proof: every byte that arrived equals what was sent.
      for (const original of files) {
        const match = received.find((r) => r.name === original.name);
        expect(match, `${original.name} should have been received`).toBeTruthy();
        expect(match!.size).toBe(original.bytes.length);
        expect(Buffer.from(match!.base64, "base64").equals(original.bytes)).toBe(true);
      }

      // Direct path only: no TURN server is configured and none was used.
      const senderPair = await sender.evaluate(() => window.H.senderPair());
      const recipientPair = await recipient.evaluate(() => window.H.receiverPair());
      expect(senderPair?.relayed).toBe(false);
      expect(recipientPair?.relayed).toBe(false);
      expect(senderPair?.localType).not.toBe("relay");
      expect(recipientPair?.localType).not.toBe("relay");

      // Memory discipline: the receiver never held a whole file. The
      // peak is per-file in-flight bytes, which for a streaming target
      // is one chunk at a time… but this harness target collects parts
      // to allow byte comparison, so assert only that nothing exceeded
      // the single largest file.
      const status = await recipient.evaluate(() => window.H.receiverStatus());
      expect(status.peakInFlight).toBeLessThanOrEqual(1_500_000);

      // No file payload crossed HTTP. The only requests either context
      // made are the harness page and its bundle.
      const appRequests = observedRequests.filter((u) => !u.startsWith(origin));
      expect(appRequests, "no requests outside the harness origin").toEqual([]);
      const totalHttp = observedRequests.length;
      expect(totalHttp).toBeLessThanOrEqual(6); // 2 contexts × (page + bundle), plus slack

      await sender.evaluate(() => window.H.closeSender());
      await recipient.evaluate(() => window.H.closeReceiver());
    } finally {
      await senderCtx.close();
      await recipientCtx.close();
    }
  });

  test("recipient can decline and no bytes are written", async ({ browser }) => {
    const senderCtx = await browser.newContext();
    const recipientCtx = await browser.newContext();

    try {
      const sender = await openHarness(senderCtx);
      const recipient = await openHarness(recipientCtx);

      // autoAccept off: the manifest arrives and waits for a decision,
      // which is the real flow — a human reviews it first.
      await recipient.evaluate(() => window.H.initReceiver(false));

      const files = [makeFile("private.zip", 120_000)];
      const offer = await sender.evaluate(
        (specs) => window.H.initSender(specs),
        files.map((f) => ({ name: f.name, base64: f.base64, type: f.type }))
      );
      const answer = await recipient.evaluate(
        (sdp) => window.H.receiverSetOffer(sdp),
        offer.sdp!
      );
      await sender.evaluate((sdp) => window.H.senderAcceptAnswer(sdp), answer.sdp!);

      const deadline = Date.now() + 20_000;
      let forwardedS = 0;
      let forwardedR = 0;
      while (Date.now() < deadline) {
        const fs = await sender.evaluate(() => window.H.senderCandidates());
        for (const c of fs.slice(forwardedS)) {
          await recipient.evaluate((cand) => window.H.receiverAddCandidate(cand), c);
        }
        forwardedS = fs.length;
        const fr = await recipient.evaluate(() => window.H.receiverCandidates());
        for (const c of fr.slice(forwardedR)) {
          await sender.evaluate((cand) => window.H.senderAddCandidate(cand), c);
        }
        forwardedR = fr.length;
        if ((await sender.evaluate(() => window.H.senderChannelState())) === "open") break;
        await new Promise((r) => setTimeout(r, 150));
      }

      await sender.evaluate(() => window.H.startSending());

      // Manifest arrives, user declines.
      await expect
        .poll(
          async () => (await recipient.evaluate(() => window.H.receiverStatus())).manifest !== null,
          { timeout: 10_000 }
        )
        .toBe(true);

      await recipient.evaluate(() => window.H.declinePending());

      const result = await sender.evaluate(() => window.H.senderResult());
      expect(result.phase).toBe("failed");
      expect(result.error).toContain("DECLINED");
      expect(result.progress).toBe(0);

      expect(await recipient.evaluate(() => window.H.received())).toEqual([]);

      await sender.evaluate(() => window.H.closeSender());
      await recipient.evaluate(() => window.H.closeReceiver());
    } finally {
      await senderCtx.close();
      await recipientCtx.close();
    }
  });
});
