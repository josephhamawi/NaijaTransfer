/**
 * Brevo (Sendinblue) email client for transactional emails.
 * Handles: magic link auth, download notifications, expiry warnings,
 * transfer receipt, file request notifications.
 * Full implementation in Epic 4: Sharing & Distribution.
 */

const BREVO_API_URL = "https://api.brevo.com/v3";

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: EmailRecipient;
}

/**
 * Send a transactional email via Brevo.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
  const { to, subject, htmlContent, textContent, replyTo } = options;

  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL || "noreply@nigeriatransfer.com",
        name: process.env.BREVO_SENDER_NAME || "NigeriaTransfer",
      },
      to,
      subject,
      htmlContent,
      textContent,
      ...(replyTo && { replyTo }),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Brevo email error: ${response.status} - ${JSON.stringify(error)}`);
  }

  const data = (await response.json()) as { messageId: string };
  return { messageId: data.messageId };
}
