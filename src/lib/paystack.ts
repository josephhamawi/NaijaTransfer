/**
 * Paystack API client for payment processing.
 * Handles subscription management, webhook verification, and payment initialization.
 * Full implementation in Epic 6: Subscriptions & Payments.
 */

import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface PaystackRequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
}

/**
 * Make an authenticated request to the Paystack API.
 */
export async function paystackRequest<T>(options: PaystackRequestOptions): Promise<T> {
  const { method, path, body } = options;

  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Paystack API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Verify a Paystack webhook signature using HMAC-SHA512.
 */
export function verifyPaystackWebhook(payload: string, signature: string): boolean {
  // Paystack signs webhooks with your SECRET KEY. It does not issue a
  // separate "webhook secret" — that concept does not exist in their
  // API, and the env var that used to be read here invited exactly the
  // mistake it received: someone pasted the webhook URL into it.
  //
  // The consequence was silent and expensive. Every signature check
  // failed, the route returned 401, and no charge.success ever reached
  // the handler — so customers could be billed by Paystack and never
  // receive the plan they paid for.
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac("sha512", secret).update(payload).digest("hex");

  // Constant-time: a plain === leaks how much of the signature matched
  // through timing, which is enough to forge one byte at a time.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

/**
 * Plan codes for tier subscriptions.
 */
export function getPlanCode(tier: "PRO" | "BUSINESS"): string {
  return tier === "PRO"
    ? (process.env.PAYSTACK_PRO_PLAN_CODE ?? "")
    : (process.env.PAYSTACK_BUSINESS_PLAN_CODE ?? "");
}
