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
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) return false;

  const hash = crypto.createHmac("sha512", secret).update(payload).digest("hex");

  return hash === signature;
}

/**
 * Plan codes for tier subscriptions.
 */
export function getPlanCode(tier: "PRO" | "BUSINESS"): string {
  return tier === "PRO"
    ? (process.env.PAYSTACK_PRO_PLAN_CODE ?? "")
    : (process.env.PAYSTACK_BUSINESS_PLAN_CODE ?? "");
}
