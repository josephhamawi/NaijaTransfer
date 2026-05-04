import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email().max(254),
  source: z.string().max(64).optional(),
});

const LEADS_INBOX = "hello@kodefoundry.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { email, source } = parsed.data;
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    const referer = request.headers.get("referer") ?? "unknown";
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for") ??
      "unknown";

    // Belt-and-suspenders: log every lead with a grep-friendly prefix
    // so we can recover them from PM2 logs if Resend silently drops mail.
    // sendEmail() never throws — it returns { messageId: "failed" } on
    // delivery error, which would otherwise look identical to success.
    console.log(
      `[LEAD] ${new Date().toISOString()} email=${email} source=${source ?? "unknown"} ip=${ip} referer=${referer}`
    );

    // Email-only persistence: ship the lead to the founder inbox.
    // Avoids a Prisma migration for a feature that may see <10 leads/month;
    // swap in a Lead model once volume justifies a real datastore.
    await sendEmail({
      to: [{ email: LEADS_INBOX }],
      subject: `New NaijaTransfer lead: ${email}`,
      htmlContent: `
        <h2>New lead</h2>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Source:</strong> ${escapeHtml(source ?? "unknown")}</p>
        <p><strong>Referer:</strong> ${escapeHtml(referer)}</p>
        <p><strong>IP:</strong> ${escapeHtml(ip)}</p>
        <p><strong>User-Agent:</strong> ${escapeHtml(userAgent)}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `,
      textContent: `New lead\nEmail: ${email}\nSource: ${source ?? "unknown"}\nReferer: ${referer}\nIP: ${ip}\nUser-Agent: ${userAgent}\nTime: ${new Date().toISOString()}`,
    });

    return NextResponse.json({ data: { saved: true } });
  } catch (error) {
    console.error("Lead capture error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not save your email. Please try again." } },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const dynamic = "force-dynamic";
