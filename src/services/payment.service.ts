/**
 * Payment Service
 * Handles Paystack subscription management and payment processing.
 * Full implementation in Epic 6: Subscriptions & Payments.
 */

import { db } from "@/lib/db";
import { paystackRequest, getPlanCode } from "@/lib/paystack";
import type { Payment, User } from "@prisma/client";

/**
 * Get user's payment history.
 */
export async function getUserPayments(userId: string): Promise<Payment[]> {
  return db.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Initialize a subscription checkout via Paystack.
 */
export async function initializeSubscription(
  user: User,
  tier: "PRO" | "BUSINESS"
): Promise<{ authorization_url: string; reference: string }> {
  const planCode = getPlanCode(tier);

  const result = await paystackRequest<{
    data: { authorization_url: string; reference: string };
  }>({
    method: "POST",
    path: "/transaction/initialize",
    body: {
      email: user.email,
      plan: planCode,
      metadata: {
        userId: user.id,
        tier,
      },
    },
  });

  return result.data;
}
