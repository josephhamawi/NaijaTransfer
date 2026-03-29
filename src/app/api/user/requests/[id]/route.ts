import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const fileRequest = await db.fileRequest.findFirst({
      where: { id, userId },
      include: { uploads: true },
    });

    if (!fileRequest) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Request not found" } }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: fileRequest.id,
        shortCode: fileRequest.shortCode,
        title: fileRequest.title,
        message: fileRequest.message,
        status: fileRequest.status,
        uploads: fileRequest.uploads.map((u) => ({
          id: u.id,
          uploaderEmail: u.uploaderEmail,
          uploaderName: u.uploaderName,
          transferId: u.transferId,
          uploadedAt: u.uploadedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Get request error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch request" } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const updated = await db.fileRequest.updateMany({
      where: { id, userId },
      data: { status: "CLOSED" },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Request not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: { closed: true } });
  } catch (error) {
    console.error("Close request error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to close request" } }, { status: 500 });
  }
}
