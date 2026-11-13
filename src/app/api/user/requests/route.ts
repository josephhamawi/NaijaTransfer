import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-api";
import { generateShortCode } from "@/lib/nanoid";
import { canCreateStoredTransfer } from "@/lib/tier-limits";
import { resolveEntitlementTier } from "@/lib/auth-api";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const requests = await db.fileRequest.findMany({
      where: { userId },
      include: { _count: { select: { uploads: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: requests.map((r) => ({
        id: r.id,
        shortCode: r.shortCode,
        title: r.title,
        message: r.message,
        status: r.status,
        uploadCount: r._count.uploads,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("List requests error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch requests" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    // A file request is inherently asynchronous storage: someone
    // uploads now, the owner collects later. There is no way to serve
    // that with a live peer-to-peer connection, so it belongs to the
    // paid plans rather than silently uploading on a free account.
    const tier = resolveEntitlementTier(authUser?.email, authUser?.tier);
    if (!canCreateStoredTransfer(tier)) {
      return NextResponse.json(
        {
          error: {
            code: "STORED_TRANSFER_REQUIRES_PLAN",
            message:
              "File requests collect uploads while you are away, which needs cloud storage. That is part of Pro and Business.",
            upgradeUrl: "/pricing",
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } }, { status: 400 });
    }

    const fileRequest = await db.fileRequest.create({
      data: {
        userId,
        shortCode: await generateShortCode(),
        title: parsed.data.title,
        message: parsed.data.message ?? null,
        status: "OPEN",
      },
    });

    return NextResponse.json({
      data: {
        id: fileRequest.id,
        shortCode: fileRequest.shortCode,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/request/${fileRequest.shortCode}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create request" } }, { status: 500 });
  }
}
