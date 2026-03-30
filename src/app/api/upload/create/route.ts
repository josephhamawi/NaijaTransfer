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
  // Client sends Firebase UID if logged in
  uid: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } }, { status: 400 });
    }

    // Determine user tier from Firebase UID
    let userId: string | undefined;
    let tier: UserTier = "FREE";

    if (parsed.data.uid) {
      try {
        const { collection } = await import("@/lib/firebase-admin");
        const userDoc = await collection("users").doc(parsed.data.uid).get();
        if (userDoc.exists) {
          userId = parsed.data.uid;
          tier = (userDoc.data()?.tier as UserTier) || "FREE";
        }
      } catch {
        // If user lookup fails, continue as FREE
      }
    }

    const limits = getTierLimits(tier);

    // Enforce expiry limits
    const requestedExpiry = parsed.data.expiryDays ?? limits.defaultExpiryDays;
    if (requestedExpiry > limits.maxExpiryDays) {
      return NextResponse.json({
        error: { code: "TIER_LIMIT", message: `${tier === "FREE" ? "Free" : tier} plan allows max ${limits.maxExpiryDays} day expiry. Upgrade for longer.` }
      }, { status: 403 });
    }

    // Enforce download limits
    const requestedLimit = parsed.data.downloadLimit ?? limits.defaultDownloadLimit;
    if (limits.maxDownloadLimit && requestedLimit > limits.maxDownloadLimit) {
      return NextResponse.json({
        error: { code: "TIER_LIMIT", message: `${tier === "FREE" ? "Free" : tier} plan allows max ${limits.maxDownloadLimit} downloads. Upgrade for more.` }
      }, { status: 403 });
    }

    const transfer = await createTransfer({
      userId,
      tier,
      senderEmail: parsed.data.senderEmail,
      recipientEmails: parsed.data.recipientEmails,
      message: parsed.data.message,
      passwordPlain: parsed.data.password,
      expiryDays: parsed.data.expiryDays,
      downloadLimit: parsed.data.downloadLimit,
    });

    return NextResponse.json({
      data: {
        transferId: transfer.id,
        shortCode: transfer.shortCode,
        maxFileSize: limits.maxFileSizeBytes,
        expiresAt: transfer.expiresAt,
        tier,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DAILY_LIMIT_REACHED") {
      return NextResponse.json({ error: { code: "DAILY_LIMIT_REACHED", message: "You've reached your daily transfer limit. Upgrade for more." } }, { status: 429 });
    }
    console.error("Upload create error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create transfer" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
