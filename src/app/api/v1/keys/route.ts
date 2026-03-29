import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiKey, listUserApiKeys } from "@/services/api-key.service";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Name is required" } }, { status: 400 });
    }

    const { key, record } = await createApiKey(userId, parsed.data.name);

    return NextResponse.json({
      data: {
        id: record.id,
        key, // Only shown once!
        name: record.name,
        prefix: record.keyPrefix,
        createdAt: record.createdAt.toISOString(),
        warning: "This key will only be shown once. Store it securely.",
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create API key" } }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const keys = await listUserApiKeys(userId);

    return NextResponse.json({
      data: keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.keyPrefix,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("List API keys error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to list API keys" } }, { status: 500 });
  }
}
