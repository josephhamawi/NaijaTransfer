import { NextRequest, NextResponse } from "next/server";
import { crmIdentify, crmTrack } from "@/lib/crm";
import { isOwnerEmail } from "@/lib/tier-limits";
import { upsertUserFromAuth } from "@/services/user.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, name, image } = body;

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing uid or email" }, { status: 400 });
    }

    // One place owns the user document's shape. Notably it will not
    // downgrade a paid tier on sign-in — the Paystack webhook owns
    // `tier`, and a sync that reset it would un-subscribe a customer.
    const { user, created: isNewUser } = await upsertUserFromAuth(uid, {
      email,
      name,
      image,
      tier: isOwnerEmail(email) ? "OWNER" : "FREE",
    });

    // CRM tracking — fire-and-forget; silent no-op if CRM env is unset.
    // Identify on every sync (keeps traits fresh); "signup" only for a new user.
    crmIdentify(uid, { email, displayName: name });
    if (isNewUser) crmTrack(uid, "signup", { method: "firebase" });

    return NextResponse.json({
      data: {
        id: uid,
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

export const dynamic = "force-dynamic";
