import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, name, image } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing uid or email" }, { status: 400 });
    }

    // Upsert user — create if new, update if exists
    const user = await db.user.upsert({
      where: { email },
      update: {
        name: name || undefined,
        image: image || undefined,
      },
      create: {
        id: uid,
        email,
        name: name || email.split("@")[0],
        image: image || null,
        tier: "FREE",
      },
    });

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
    });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
