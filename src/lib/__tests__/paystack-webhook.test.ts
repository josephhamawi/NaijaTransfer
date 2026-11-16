import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyPaystackWebhook } from "@/lib/paystack";

/**
 * Webhook signature verification.
 *
 * This is the code path that turns money into entitlement: a charge
 * that fails verification is a customer who paid Paystack and never
 * received their plan. It failed silently in production because it
 * read a `PAYSTACK_WEBHOOK_SECRET` env var — a concept Paystack does
 * not have. Paystack signs with your SECRET KEY. The phantom variable
 * had been filled with a webhook URL, so every signature mismatched
 * and every payment event was rejected with 401.
 *
 * These tests pin the signing key, so reintroducing a separate secret
 * breaks here rather than in production.
 */

const SECRET = "sk_test_abc123def456";
const PAYLOAD = JSON.stringify({
  event: "charge.success",
  data: { reference: "ref_1", metadata: { userId: "uid-1", tier: "PRO" } },
});

function sign(payload: string, key: string): string {
  return crypto.createHmac("sha512", key).update(payload).digest("hex");
}

let original: string | undefined;

beforeEach(() => {
  original = process.env.PAYSTACK_SECRET_KEY;
  process.env.PAYSTACK_SECRET_KEY = SECRET;
});

afterEach(() => {
  if (original === undefined) delete process.env.PAYSTACK_SECRET_KEY;
  else process.env.PAYSTACK_SECRET_KEY = original;
});

describe("verifyPaystackWebhook", () => {
  it("accepts a signature made with the secret key", () => {
    expect(verifyPaystackWebhook(PAYLOAD, sign(PAYLOAD, SECRET))).toBe(true);
  });

  it("rejects a signature made with any other key", () => {
    // This is the regression that mattered: the old code signed with a
    // different value entirely, so nothing Paystack sent ever matched.
    expect(verifyPaystackWebhook(PAYLOAD, sign(PAYLOAD, "https://naijatransfer.com/api/webhooks/paystack"))).toBe(false);
    expect(verifyPaystackWebhook(PAYLOAD, sign(PAYLOAD, "whsec_something"))).toBe(false);
  });

  it("rejects a tampered payload", () => {
    const signature = sign(PAYLOAD, SECRET);
    const tampered = PAYLOAD.replace('"PRO"', '"BUSINESS"');
    expect(verifyPaystackWebhook(tampered, signature)).toBe(false);
  });

  it("rejects an empty or malformed signature", () => {
    expect(verifyPaystackWebhook(PAYLOAD, "")).toBe(false);
    expect(verifyPaystackWebhook(PAYLOAD, "not-a-signature")).toBe(false);
    expect(verifyPaystackWebhook(PAYLOAD, sign(PAYLOAD, SECRET).slice(0, -2))).toBe(false);
  });

  it("rejects everything when no secret key is configured", () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    // Fail closed: an unconfigured server must not accept unsigned
    // events as genuine.
    expect(verifyPaystackWebhook(PAYLOAD, sign(PAYLOAD, SECRET))).toBe(false);
  });

  it("is not confused by a signature of the right length but wrong content", () => {
    const wrong = "a".repeat(sign(PAYLOAD, SECRET).length);
    expect(verifyPaystackWebhook(PAYLOAD, wrong)).toBe(false);
  });
});
