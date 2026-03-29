import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteTransfer, updateTransferSettings } from "@/services/transfer.service";

const updateSchema = z.object({
  expiryDays: z.number().int().min(1).max(60).optional(),
  downloadLimit: z.number().int().min(1).max(10000).optional(),
  password: z.string().max(100).nullable().optional(),
});

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const deleted = await deleteTransfer(id, userId);
    if (!deleted) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Transfer not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Delete transfer error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete transfer" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } }, { status: 400 });
    }

    const updated = await updateTransferSettings(id, userId, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Transfer not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: { updated: true, expiresAt: updated.expiresAt, downloadLimit: updated.downloadLimit } });
  } catch (error) {
    console.error("Update transfer error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update transfer" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
