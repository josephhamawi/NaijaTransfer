import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackWebhook } from "@/lib/paystack";
import { getDb } from "@/lib/firebase-admin";
import { crmIdentify, crmTrack } from "@/lib/crm";
import {
  getUserByAnyId,
  getUsersBySubCode,
  updateSubscription,
} from "@/services/user.service";
import { markPaymentStatus } from "@/services/payment.service";
import type { UserTier } from "@/types/enums";

/**
 * Paystack webhook.
 *
 * This endpoint is what turns money into entitlement, so two things
 * matter more than anything else here:
 *
 *   1. **Signature first.** Nothing is read from the body until the
 *      HMAC verifies — the payload is attacker-controlled until then.
 *
 *   2. **Old ids still resolve.** Subscriptions created before the
 *      Firestore migration carry a Prisma cuid in `metadata.userId`,
 *      and Paystack will keep sending that cuid on every renewal for
 *      the life of the subscription. `getUserByAnyId` accepts either
 *      that or a Firebase uid, so a pre-migration subscriber does not
 *      silently stop being upgraded.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature") ?? "";

    if (!verifyPaystackWebhook(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event as string;
    const data = event.data;

    // Audit log. Payload is stored as a string: it is opaque to us and
    // keeping it unparsed avoids Firestore rejecting an unexpected
    // nested shape.
    await getDb()
      .collection("webhookEvents")
      .add({
        provider: "PAYSTACK",
        eventType,
        payload: body.slice(0, 100_000),
        processed: true,
        createdAt: new Date(),
      });

    switch (eventType) {
      case "charge.success": {
        const metadata = data.metadata;
        if (metadata?.userId && metadata?.tier) {
          const user = await getUserByAnyId(String(metadata.userId));
          if (!user) {
            // Log loudly: a payment we cannot attribute is a customer
            // who paid and did not get their plan.
            console.error(
              `Paystack charge.success for unknown user id ${metadata.userId}`
            );
            break;
          }

          await updateSubscription(user.id, {
            tier: metadata.tier as UserTier,
            planStartDate: new Date(),
            planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paystackCustomerId: data.customer?.customer_code ?? null,
          });

          if (data.reference) {
            await markPaymentStatus(user.id, String(data.reference), "SUCCESS");
          }

          // Mirror the paid conversion to the CRM (no-op if CRM unset).
          crmIdentify(user.id, { email: data.customer?.email });
          crmTrack(user.id, "payment_completed", {
            amount: typeof data.amount === "number" ? data.amount / 100 : data.amount,
            currency: data.currency ?? "NGN",
            tier: metadata.tier,
            reference: data.reference,
          });
        }
        break;
      }

      case "subscription.create": {
        const metadata = data.metadata ?? {};
        if (metadata.userId) {
          const user = await getUserByAnyId(String(metadata.userId));
          if (user) {
            await updateSubscription(user.id, {
              paystackSubCode: data.subscription_code ?? null,
            });
          }
        }
        break;
      }

      case "subscription.not_renew":
      case "subscription.disable": {
        const sub = data.subscription_code ?? data.code;
        if (sub) {
          // Read before clearing: once the code is gone there is no way
          // back to the affected accounts for the churn event.
          const churned = await getUsersBySubCode(String(sub));

          for (const user of churned) {
            await updateSubscription(user.id, {
              tier: "FREE",
              paystackSubCode: null,
              planEndDate: new Date(),
            });
            crmTrack(user.id, "subscription_cancelled", {
              subscriptionCode: sub,
              reason: eventType,
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
