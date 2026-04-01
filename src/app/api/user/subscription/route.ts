import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { paystackRequest, getPlanCode } from "@/lib/paystack";
import { PRICING } from "@/lib/tier-limits";
import { getAuthUser } from "@/lib/auth-api";

const createSchema = z.object({
  plan: z.enum(["PRO", "BUSINESS"]),
  callbackUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    return NextResponse.json({
      data: {
        tier: user.tier,
        planStart: user.planStartDate?.toISOString() ?? null,
        planEnd: user.planEndDate?.toISOString() ?? null,
        paystackSubCode: user.paystackSubCode ?? null,
        pricing: {
          PRO: PRICING.PRO.amountDisplay,
          BUSINESS: PRICING.BUSINESS.amountDisplay,
        },
      },
    });
  } catch (error) {
    console.error("Subscription get error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch subscription" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json({ error: { code: "NO_EMAIL", message: "Email required for subscription" } }, { status: 400 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid plan" } }, { status: 400 });
    }

    const planCode = getPlanCode(parsed.data.plan);
    const callbackUrl = parsed.data.callbackUrl ?? `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/dashboard/subscription?subscribed=true`;

    const result = await paystackRequest<{
      data: { authorization_url: string; reference: string };
    }>({
      method: "POST",
      path: "/transaction/initialize",
      body: {
        email: user.email,
        plan: planCode,
        callback_url: callbackUrl,
        metadata: { userId: user.id, tier: parsed.data.plan },
      },
    });

    await db.payment.create({
      data: {
        userId: user.id,
        type: "SUBSCRIPTION",
        amount: parsed.data.plan === "PRO" ? PRICING.PRO.amountKobo : PRICING.BUSINESS.amountKobo,
        currency: "NGN",
        paystackRef: result.data.reference,
        status: "PENDING",
      },
    });

    return NextResponse.json({ data: { checkoutUrl: result.data.authorization_url, reference: result.data.reference } });
  } catch (error) {
    console.error("Subscription create error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create subscription" } }, { status: 500 });
  }
}
