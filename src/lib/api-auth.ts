import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/services/api-key.service";
import { hashApiKey } from "@/lib/server-utils";
import type { ApiKey } from "@prisma/client";

export async function extractAndValidateApiKey(
  request: NextRequest
): Promise<{ valid: boolean; apiKey?: ApiKey; error?: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ntk_")) {
    return { valid: false, error: "Missing or invalid API key. Use: Authorization: Bearer ntk_..." };
  }

  const key = authHeader.slice(7); // Remove "Bearer "
  const apiKey = await validateApiKey(key);

  if (!apiKey) {
    return { valid: false, error: "Invalid or revoked API key" };
  }

  return { valid: true, apiKey };
}

export function apiUnauthorized(message: string): NextResponse {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message } },
    { status: 401 }
  );
}
