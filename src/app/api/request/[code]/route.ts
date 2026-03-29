import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const fileRequest = await db.fileRequest.findUnique({
      where: { shortCode: code },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!fileRequest || fileRequest.status !== "OPEN") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "File request not found or closed" } }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        title: fileRequest.title,
        message: fileRequest.message,
        requesterName: fileRequest.user?.name ?? fileRequest.user?.email ?? "Someone",
        status: fileRequest.status,
      },
    });
  } catch (error) {
    console.error("Get request error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch request" } }, { status: 500 });
  }
}

const uploadSchema = z.object({
  uploaderEmail: z.string().email().optional(),
  uploaderName: z.string().max(100).optional(),
  transferId: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } }, { status: 400 });
    }

    const fileRequest = await db.fileRequest.findUnique({ where: { shortCode: code } });
    if (!fileRequest || fileRequest.status !== "OPEN") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "File request not found or closed" } }, { status: 404 });
    }

    const upload = await db.fileRequestUpload.create({
      data: {
        requestId: fileRequest.id,
        uploaderEmail: parsed.data.uploaderEmail ?? null,
        uploaderName: parsed.data.uploaderName ?? null,
        transferId: parsed.data.transferId,
      },
    });

    return NextResponse.json({ data: { uploadId: upload.id, received: true } }, { status: 201 });
  } catch (error) {
    console.error("Request upload error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to submit upload" } }, { status: 500 });
  }
}
