import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paystackRequest } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.paystackSubCode) {
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
      where: { id: userId },
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
