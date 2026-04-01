import { getAuth } from "firebase-admin/auth";
import { db } from "./db";
import { ensureInitialized } from "./firebase-admin";
import type { NextRequest } from "next/server";
import type { User } from "@prisma/client";

/**
 * Verify Firebase ID token from Authorization header and return Prisma user.
 * Creates user in Prisma if they don't exist yet (bridges Firebase Auth → Prisma).
 */
export async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    ensureInitialized();
    const decoded = await getAuth().verifyIdToken(token);

    if (!decoded.email) return null;

    // Find or create user in Prisma by email
    const user = await db.user.upsert({
      where: { email: decoded.email },
      update: {},
      create: {
        email: decoded.email,
        name: decoded.name || decoded.email.split("@")[0],
        image: decoded.picture || null,
      },
    });

    return user;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}
