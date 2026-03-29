import { NextRequest, NextResponse } from "next/server";
import { collection } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, name, image } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing uid or email" }, { status: 400 });
    }

    const userRef = collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update existing user
      await userRef.update({
        ...(name && { name }),
        ...(image && { image }),
        updatedAt: new Date(),
      });
    } else {
      // Create new user
      await userRef.set({
        email,
        name: name || email.split("@")[0],
        image: image || null,
        tier: "FREE",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const user = (await userRef.get()).data();

    return NextResponse.json({
      data: {
        id: uid,
        email: user?.email,
        name: user?.name,
        tier: user?.tier || "FREE",
      },
    });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
