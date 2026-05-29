import { NextRequest, NextResponse } from "next/server";
import { collection } from "@/lib/firebase-admin";
import { crmIdentify, crmTrack } from "@/lib/crm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, name, image } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing uid or email" }, { status: 400 });
    }

    const userRef = collection("users").doc(uid);
    const userDoc = await userRef.get();
    const isNewUser = !userDoc.exists;

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

    // CRM tracking — fire-and-forget; silent no-op if CRM env is unset.
    // Identify on every sync (keeps traits fresh); "signup" only for a new user.
    crmIdentify(uid, { email, displayName: name });
    if (isNewUser) crmTrack(uid, "signup", { method: "firebase" });

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
