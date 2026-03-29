import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractAndValidateApiKey, apiUnauthorized } from "@/lib/api-auth";
import { createTransfer, getUserTransfers } from "@/services/transfer.service";

const createSchema = z.object({
  senderEmail: z.string().email().optional(),
  recipientEmails: z.array(z.string().email()).max(10).optional(),
  message: z.string().max(500).optional(),
  password: z.string().max(100).optional(),
  expiryDays: z.number().int().min(1).max(60).optional(),
  downloadLimit: z.number().int().min(1).max(10000).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await extractAndValidateApiKey(request);
  if (!auth.valid || !auth.apiKey) return apiUnauthorized(auth.error!);

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } }, { status: 400 });
    }

    const transfer = await createTransfer({
      userId: auth.apiKey.userId,
      tier: "PRO", // API users get Pro-level limits
      senderEmail: parsed.data.senderEmail,
      recipientEmails: parsed.data.recipientEmails,
      message: parsed.data.message,
      passwordPlain: parsed.data.password,
      expiryDays: parsed.data.expiryDays,
      downloadLimit: parsed.data.downloadLimit,
    });

    return NextResponse.json({
      data: {
        id: transfer.id,
        shortCode: transfer.shortCode,
        tusEndpoint: "/api/upload/tus",
        downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/d/${transfer.shortCode}`,
        expiresAt: transfer.expiresAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("API create transfer error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create transfer" } }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await extractAndValidateApiKey(request);
  if (!auth.valid || !auth.apiKey) return apiUnauthorized(auth.error!);

  try {
    const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10), 100);

    const result = await getUserTransfers(auth.apiKey.userId, page, limit);

    return NextResponse.json({
      data: {
        transfers: result.transfers.map((t) => ({
          id: t.id,
          shortCode: t.shortCode,
          status: t.status,
          downloadCount: t.downloadCount,
          totalSizeBytes: Number(t.totalSizeBytes),
          fileCount: (t.files ?? []).length,
          expiresAt: t.expiresAt.toISOString(),
          createdAt: t.createdAt.toISOString(),
        })),
        total: result.total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("API list transfers error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to list transfers" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
