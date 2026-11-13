/**
 * POST /api/upload/create — open a cloud-stored transfer.
 *
 * Paid plans only. Free sending is Live Send (direct browser-to-browser
 * WebRTC), which never reaches this endpoint because no bytes and no
 * transfer record are involved.
 *
 * Two things changed here when the free tier moved to Live Send, and
 * both matter for the gate to be real rather than cosmetic:
 *
 *   1. Identity now comes from a verified Firebase ID token, not from a
 *      `uid` in the request body. The old version read the tier of
 *      whatever uid the caller typed, so anyone could have claimed an
 *      OWNER uid and uploaded on someone else's entitlement. With the
 *      tier now deciding whether storage is allowed at all, that would
 *      have been a free-storage hole.
 *
 *   2. Anonymous callers are refused outright. Stored transfers belong
 *      to an account that pays for them.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTransfer } from "@/services/transfer.service";
import {
  canCreateStoredTransfer,
  getTierLimits,
  STORED_TRANSFER_UPGRADE_MESSAGE,
} from "@/lib/tier-limits";
import { getAuthUid } from "@/lib/auth-api";
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
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    // Identity from the token only. A request without one cannot own a
    // stored transfer, and cannot borrow anyone else's plan.
    const uid = await getAuthUid(request);
    if (!uid) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Sign in to create a stored transfer, or use Live Send to send for free.",
          },
        },
        { status: 401 }
      );
    }

    const { collection } = await import("@/lib/firebase-admin");
    const userDoc = await collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        {
          error: {
            code: "STORED_TRANSFER_REQUIRES_PLAN",
            message: STORED_TRANSFER_UPGRADE_MESSAGE,
          },
        },
        { status: 403 }
      );
    }

    const tier = ((userDoc.data()?.tier as UserTier) || "FREE") satisfies UserTier;

    if (!canCreateStoredTransfer(tier)) {
      return NextResponse.json(
        {
          error: {
            code: "STORED_TRANSFER_REQUIRES_PLAN",
            message: STORED_TRANSFER_UPGRADE_MESSAGE,
            upgradeUrl: "/pricing",
          },
        },
        { status: 403 }
      );
    }

    const limits = getTierLimits(tier);

    // Enforce expiry limits
    const requestedExpiry = parsed.data.expiryDays ?? limits.defaultExpiryDays;
    if (requestedExpiry > limits.maxExpiryDays) {
      return NextResponse.json(
        {
          error: {
            code: "TIER_LIMIT",
            message: `${tier} plan allows max ${limits.maxExpiryDays} day expiry. Upgrade for longer.`,
          },
        },
        { status: 403 }
      );
    }

    // Enforce download limits
    const requestedLimit = parsed.data.downloadLimit ?? limits.defaultDownloadLimit;
    if (limits.maxDownloadLimit && requestedLimit > limits.maxDownloadLimit) {
      return NextResponse.json(
        {
          error: {
            code: "TIER_LIMIT",
            message: `${tier} plan allows max ${limits.maxDownloadLimit} downloads. Upgrade for more.`,
          },
        },
        { status: 403 }
      );
    }

    const transfer = await createTransfer({
      userId: uid,
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
        maxTransferSize: limits.maxTransferSizeBytes,
        maxFilesPerTransfer: limits.maxFilesPerTransfer,
        expiresAt: transfer.expiresAt,
        tier,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DAILY_LIMIT_REACHED") {
      return NextResponse.json(
        {
          error: {
            code: "DAILY_LIMIT_REACHED",
            message: "You've reached your daily transfer limit. Upgrade for more.",
          },
        },
        { status: 429 }
      );
    }
    console.error("Upload create error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create transfer" } },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
