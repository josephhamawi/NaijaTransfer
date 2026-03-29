import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateDownloadAccess } from "@/services/transfer.service";

const schema = z.object({ password: z.string().min(1) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Password is required" } }, { status: 400 });
    }

    const result = await validateDownloadAccess(code, parsed.data.password);
    if (!result.valid) {
      const status = result.error === "INVALID_PASSWORD" ? 403 : 404;
      return NextResponse.json({ error: { code: result.error, message: result.error === "INVALID_PASSWORD" ? "Incorrect password" : "Transfer not available" } }, { status });
    }

    return NextResponse.json({ data: { verified: true } });
  } catch (error) {
    console.error("Password verify error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Verification failed" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
