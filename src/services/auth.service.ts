/**
 * Auth Service
 * Handles user authentication and management.
 * Full implementation in Epic 5: Authentication & User System.
 */

import { db } from "@/lib/db";
import type { User } from "@prisma/client";

/**
 * Get a user by ID.
 */
export async function getUserById(userId: string): Promise<User | null> {
  return db.user.findUnique({ where: { id: userId } });
}

/**
 * Get a user by email.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return db.user.findUnique({ where: { email } });
}

/**
 * Get a user by phone number.
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  return db.user.findUnique({ where: { phone } });
}
