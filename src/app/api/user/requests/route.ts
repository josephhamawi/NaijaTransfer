import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateShortCode } from "@/lib/nanoid";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
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
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
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
