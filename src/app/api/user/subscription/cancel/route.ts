import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paystackRequest } from "@/lib/paystack";
import { getAuthUser } from "@/lib/auth-api";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    if (!user.paystackSubCode) {
      return NextResponse.json({ error: { code: "NO_SUBSCRIPTION", message: "No active subscription" } }, { status: 400 });
    }

    await paystackRequest({
      method: "POST",
      path: "/subscription/disable",
      body: {
        code: user.paystackSubCode,
        token: user.email ?? "",
      },
    });

    await db.user.update({
      where: { id: user.id },
      data: {
        tier: "FREE",
        paystackSubCode: null,
        planEndDate: new Date(),
      },
    });

    return NextResponse.json({ data: { cancelled: true } });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to cancel subscription" } }, { status: 500 });
  }
}
