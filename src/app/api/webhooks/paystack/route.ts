import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackWebhook } from "@/lib/paystack";
import { db } from "@/lib/db";

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

    // Log webhook event
    await db.webhookEvent.create({
      data: {
        provider: "PAYSTACK",
        eventType,
        payload: event,
        processed: true,
      },
    });

    switch (eventType) {
      case "charge.success": {
        const metadata = data.metadata;
        if (metadata?.userId && metadata?.tier) {
          await db.user.update({
            where: { id: metadata.userId },
            data: {
              tier: metadata.tier,
              planStartDate: new Date(),
              planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              paystackCustomerId: data.customer?.customer_code ?? null,
            },
          });

          await db.payment.updateMany({
            where: { paystackRef: data.reference },
            data: { status: "SUCCESS" },
          });
        }
        break;
      }

      case "subscription.create": {
        const metadata = data.metadata ?? {};
        if (metadata.userId) {
          await db.user.update({
            where: { id: metadata.userId },
            data: { paystackSubCode: data.subscription_code },
          });
        }
        break;
      }

      case "subscription.not_renew":
      case "subscription.disable": {
        const sub = data.subscription_code ?? data.code;
        if (sub) {
          await db.user.updateMany({
            where: { paystackSubCode: sub },
            data: {
              tier: "FREE",
              paystackSubCode: null,
              planEndDate: new Date(),
            },
          });
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
