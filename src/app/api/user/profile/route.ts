import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-api";
import { crmIdentify } from "@/lib/crm";
import { generateUniqueUsername } from "@/lib/username";

const updateSchema = z.object({
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  hearAboutUs: z.string().trim().max(100).nullable().optional(),
});

function serialize(u: {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  hearAboutUs: string | null;
  username: string | null;
  name: string | null;
  email: string | null;
}) {
  return {
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    hearAboutUs: u.hearAboutUs,
    username: u.username,
    name: u.name,
    email: u.email,
  };
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  return NextResponse.json({ data: serialize(user) });
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid profile data" } }, { status: 400 });
    }
    const { firstName, lastName, phone, hearAboutUs } = parsed.data;

    // Effective names after this update (fall back to stored values).
    const effFirst = firstName ?? user.firstName ?? "";
    const effLast = lastName ?? user.lastName ?? "";

    // Generate the username once, the first time we have a name to build from.
    let username = user.username;
    if (!username && (effFirst || effLast)) {
      username = await generateUniqueUsername(effFirst, effLast);
    }

    // Keep `name` (used for the avatar/display) in sync with first + last.
    const fullName = [effFirst, effLast].filter(Boolean).join(" ").trim();

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(firstName !== undefined ? { firstName: firstName || null } : {}),
        ...(lastName !== undefined ? { lastName: lastName || null } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(hearAboutUs !== undefined ? { hearAboutUs: hearAboutUs || null } : {}),
        ...(username ? { username } : {}),
        ...(fullName ? { name: fullName } : {}),
      },
    });

    // Push fresh traits to the CRM (fire-and-forget; no-op if unconfigured).
    crmIdentify(user.id, {
      email: updated.email,
      displayName: updated.name,
      phone: updated.phone,
    });

    return NextResponse.json({ data: serialize(updated) });
  } catch (error) {
    // Unique violation (e.g. phone already used by another account).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const field = (error.meta?.target as string[] | undefined)?.join(", ") || "value";
      const message = field.includes("phone")
        ? "That phone number is already linked to another account."
        : "That value is already in use.";
      return NextResponse.json({ error: { code: "CONFLICT", message } }, { status: 409 });
    }
    console.error("Profile update error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update profile" } }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
