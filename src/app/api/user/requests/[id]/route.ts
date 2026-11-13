import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-api";
import {
  closeFileRequest,
  getOwnedFileRequest,
  listUploads,
} from "@/services/file-request.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const fileRequest = await getOwnedFileRequest(id, userId);

    if (!fileRequest) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Request not found" } }, { status: 404 });
    }

    const uploads = await listUploads(fileRequest.id);

    return NextResponse.json({
      data: {
        id: fileRequest.id,
        shortCode: fileRequest.shortCode,
        title: fileRequest.title,
        message: fileRequest.message,
        status: fileRequest.status,
        uploads: uploads.map((u) => ({
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
    const authUser = await getAuthUser(request);
    const userId = authUser?.id;
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const closed = await closeFileRequest(id, userId);

    if (!closed) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Request not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: { closed: true } });
  } catch (error) {
    console.error("Close request error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to close request" } }, { status: 500 });
  }
}
