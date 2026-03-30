export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: EmailRecipient;
}

/**
 * Send email via Resend API (HTTP, no SMTP ports needed) or Gmail SMTP fallback.
 * Email failure never throws — returns gracefully so transfers aren't blocked.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
  const { to, subject, htmlContent, replyTo } = options;

  try {
    // Method 1: Resend API (preferred — HTTP only, works on any server)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "NaijaTransfer <onboarding@resend.dev>",
          to: to.map((r) => r.email),
          subject,
          html: htmlContent,
          ...(replyTo && { reply_to: replyTo.email }),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(`Resend: ${JSON.stringify(err)}`);
      }

      const data = (await res.json()) as { id: string };
      console.log("Email sent via Resend:", data.id);
      return { messageId: data.id };
    }

    // Method 2: Gmail SMTP (may fail if port 465/587 blocked)
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    if (gmailUser && gmailPass) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass },
        connectionTimeout: 10000,
      });

      const info = await transporter.sendMail({
        from: `"NaijaTransfer" <${gmailUser}>`,
        to: to.map((r) => r.email).join(", "),
        subject,
        html: htmlContent,
        ...(replyTo && { replyTo: replyTo.email }),
      });

      console.log("Email sent via Gmail:", info.messageId);
      return { messageId: info.messageId };
    }

    console.warn("No email provider configured. Skipping:", subject);
    return { messageId: "not-configured" };
  } catch (error) {
    console.error("Email failed (non-blocking):", error);
    return { messageId: "failed" };
  }
}
