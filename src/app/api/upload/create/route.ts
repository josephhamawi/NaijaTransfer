import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTransfer } from "@/services/transfer.service";
import { getTierLimits } from "@/lib/tier-limits";
import type { UserTier } from "@/types/enums";

const schema = z.object({
  senderEmail: z.string().email().optional(),
  recipientEmails: z.array(z.string().email()).max(10).optional(),
  message: z.string().max(500).optional(),
  password: z.string().min(1).max(100).optional(),
  expiryDays: z.number().int().min(1).max(60).optional(),
  downloadLimit: z.number().int().min(1).max(10000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } }, { status: 400 });
    }

    let userId: string | undefined;
    let tier: UserTier = "FREE";

    const transfer = await createTransfer({
      userId, tier,
      senderEmail: parsed.data.senderEmail,
      recipientEmails: parsed.data.recipientEmails,
      message: parsed.data.message,
      passwordPlain: parsed.data.password,
      expiryDays: parsed.data.expiryDays,
      downloadLimit: parsed.data.downloadLimit,
    });

    const limits = getTierLimits(tier);
    return NextResponse.json({
      data: {
        transferId: transfer.id,
        shortCode: transfer.shortCode,
        tusEndpoint: "/api/upload/tus",
        maxFileSize: limits.maxFileSizeBytes,
        expiresAt: transfer.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: { code: "DAILY_LIMIT_REACHED", message: "Daily transfer limit reached" } }, { status: 429 });
    }
    console.error("Upload create error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create transfer" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
