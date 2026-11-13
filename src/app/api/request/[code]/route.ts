import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canCreateStoredTransfer } from "@/lib/tier-limits";
import { resolveEntitlementTier } from "@/lib/auth-api";
import { getFileRequestByCode, recordUpload } from "@/services/file-request.service";
import { getUser } from "@/services/user.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const fileRequest = await getFileRequestByCode(code);

    if (!fileRequest || fileRequest.status !== "OPEN") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "File request not found or closed" } }, { status: 404 });
    }

    const owner = await getUser(fileRequest.uid);

    return NextResponse.json({
      data: {
        title: fileRequest.title,
        message: fileRequest.message,
        requesterName: owner?.name ?? owner?.email ?? "Someone",
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

    const fileRequest = await getFileRequestByCode(code);
    if (!fileRequest || fileRequest.status !== "OPEN") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "File request not found or closed" } }, { status: 404 });
    }

    const owner = await getUser(fileRequest.uid);

    // The uploader here is an anonymous third party, so the plan that
    // has to cover the storage is the REQUEST OWNER's. Checked at
    // submit time, not just at creation time: an owner whose
    // subscription lapsed must not keep collecting stored uploads
    // through a portal they created while paying.
    const ownerTier = resolveEntitlementTier(owner?.email, owner?.tier);
    if (!canCreateStoredTransfer(ownerTier)) {
      return NextResponse.json(
        {
          error: {
            code: "REQUEST_OWNER_PLAN_INACTIVE",
            message:
              "This file request is no longer accepting uploads. Ask the person who sent it to get in touch.",
          },
        },
        { status: 403 }
      );
    }

    const uploadId = await recordUpload(fileRequest.id, {
      uploaderEmail: parsed.data.uploaderEmail ?? null,
      uploaderName: parsed.data.uploaderName ?? null,
      transferId: parsed.data.transferId,
    });

    return NextResponse.json({ data: { uploadId, received: true } }, { status: 201 });
  } catch (error) {
    console.error("Request upload error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to submit upload" } }, { status: 500 });
  }
}
