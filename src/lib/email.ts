import nodemailer from "nodemailer";

interface EmailRecipient {
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

// Gmail SMTP transporter (singleton)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

/**
 * Send an email via Gmail SMTP.
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
  const { to, subject, htmlContent, textContent, replyTo } = options;

  const senderName = process.env.EMAIL_SENDER_NAME || "NaijaTransfer";
  const senderEmail = process.env.GMAIL_USER || "noreply@naijatransfer.com";

  const info = await getTransporter().sendMail({
    from: `"${senderName}" <${senderEmail}>`,
    to: to.map((r) => (r.name ? `"${r.name}" <${r.email}>` : r.email)).join(", "),
    subject,
    html: htmlContent,
    text: textContent,
    ...(replyTo && { replyTo: replyTo.email }),
  });

  return { messageId: info.messageId };
}
