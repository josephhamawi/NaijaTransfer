import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTransferByCode } from "@/services/transfer.service";
import { sendTransferNotification } from "@/services/notification.service";

const schema = z.object({
  recipientEmails: z.array(z.string().email()).min(1).max(10),
  senderName: z.string().max(100).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } }, { status: 400 });
    }

    const transfer = await getTransferByCode(code);
    if (!transfer) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Transfer not found" } }, { status: 404 });
    }

    await sendTransferNotification({
      recipientEmails: parsed.data.recipientEmails,
      senderName: parsed.data.senderName,
      senderEmail: transfer.senderEmail ?? undefined,
      transferCode: transfer.shortCode,
      message: transfer.message ?? undefined,
      fileCount: transfer.files.length,
      totalSize: Number(transfer.totalSizeBytes),
      expiresAt: transfer.expiresAt,
    });

    return NextResponse.json({ data: { sent: true, count: parsed.data.recipientEmails.length } });
  } catch (error) {
    console.error("Notify error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to send notifications" } }, { status: 500 });
  }
}
