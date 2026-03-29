/**
 * API Key Service
 * Handles API key generation, validation, and management.
 * Full implementation in Epic 8: Public API.
 */

import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/nanoid";
import { hashApiKey } from "@/lib/server-utils";
import type { ApiKey } from "@prisma/client";

/**
 * Create a new API key for a user.
 * Returns the full key (shown once) and the database record.
 */
export async function createApiKey(
  userId: string,
  name: string
): Promise<{ key: string; record: ApiKey }> {
  const { key, prefix } = await generateApiKey();
  const keyHash = hashApiKey(key);

  const record = await db.apiKey.create({
    data: {
      userId,
      keyHash,
      keyPrefix: prefix,
      name,
    },
  });

  return { key, record };
}

/**
 * Validate an API key and return the associated user.
 */
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  const keyHash = hashApiKey(key);

  const apiKey = await db.apiKey.findUnique({
    where: { keyHash },
  });

  if (!apiKey || !apiKey.isActive) return null;

  // Update last used timestamp
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return apiKey;
}

/**
 * List API keys for a user (prefix only, never the full key).
 */
export async function listUserApiKeys(userId: string): Promise<ApiKey[]> {
  return db.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Revoke an API key.
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const result = await db.apiKey.updateMany({
    where: { id: keyId, userId },
    data: { isActive: false },
  });

  return result.count > 0;
}
