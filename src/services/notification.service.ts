import { sendEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nigeriatransfer.com";
const BRAND_COLOR = "#4EA8DE";

function emailWrapper(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f4">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff">
<tr><td style="background:${BRAND_COLOR};padding:24px 32px;text-align:center">
<span style="color:#fff;font-size:24px;font-weight:700;text-decoration:none">NaijaTransfer</span>
</td></tr>
<tr><td style="padding:32px">${content}</td></tr>
<tr><td style="padding:16px 32px;background:#f9f9f9;text-align:center;font-size:12px;color:#888">
<p>NaijaTransfer — Send large files. No account. No wahala.</p>
<p><a href="${BASE_URL}/privacy" style="color:#888">Privacy</a> · <a href="${BASE_URL}/terms" style="color:#888">Terms</a></p>
</td></tr></table></body></html>`;
}

function ctaButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px auto"><tr>
<td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 32px">
<a href="${url}" style="color:#fff;text-decoration:none;font-weight:600;font-size:16px">${text}</a>
</td></tr></table>`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export async function sendTransferNotification(params: {
  recipientEmails: string[];
  senderName?: string;
  senderEmail?: string;
  transferCode: string;
  message?: string;
  fileCount: number;
  totalSize: number;
  expiresAt: Date;
}): Promise<void> {
  const downloadUrl = `${BASE_URL}/d/${params.transferCode}`;
  const sender = params.senderName || params.senderEmail || "Someone";
  const expiryDate = params.expiresAt.toLocaleDateString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const content = `
    <h2 style="margin:0 0 16px;color:#1a1a2e">${sender} sent you files</h2>
    <p style="color:#555;margin:0 0 8px">${params.fileCount} file${params.fileCount > 1 ? "s" : ""} · ${formatSize(params.totalSize)}</p>
    ${params.message ? `<div style="background:#f0faf5;border-left:3px solid ${BRAND_COLOR};padding:12px 16px;margin:16px 0;color:#333">${params.message}</div>` : ""}
    ${ctaButton("Download Your Files", downloadUrl)}
    <p style="color:#999;font-size:13px;text-align:center">This link expires on ${expiryDate}</p>
  `;

  for (const email of params.recipientEmails) {
    await sendEmail({
      to: [{ email }],
      subject: `${sender} sent you files via NaijaTransfer`,
      htmlContent: emailWrapper(content),
    });
  }
}

export async function sendDownloadNotification(params: {
  senderEmail: string;
  transferCode: string;
  downloadedAt: Date;
}): Promise<void> {
  const transferUrl = `${BASE_URL}/d/${params.transferCode}`;
  const time = params.downloadedAt.toLocaleString("en-NG");

  const content = `
    <h2 style="margin:0 0 16px;color:#1a1a2e">Your files were downloaded</h2>
    <p style="color:#555">Someone downloaded your files at ${time}.</p>
    ${ctaButton("View Transfer", transferUrl)}
  `;

  await sendEmail({
    to: [{ email: params.senderEmail }],
    subject: "Your NaijaTransfer files were downloaded",
    htmlContent: emailWrapper(content),
  });
}

export async function sendExpiryWarnings(): Promise<number> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const expiringTransfers = await (await import("@/lib/db")).db.transfer.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gte: tomorrow, lt: dayAfter },
      senderEmail: { not: null },
    },
  });

  let sent = 0;
  for (const transfer of expiringTransfers) {
    if (!transfer.senderEmail) continue;

    const content = `
      <h2 style="margin:0 0 16px;color:#1a1a2e">Your transfer expires tomorrow</h2>
      <p style="color:#555">Your transfer with ${transfer.totalSizeBytes ? formatSize(Number(transfer.totalSizeBytes)) : "files"} will expire in 24 hours and the files will be permanently deleted.</p>
      ${ctaButton("View Transfer", `${BASE_URL}/d/${transfer.shortCode}`)}
    `;

    await sendEmail({
      to: [{ email: transfer.senderEmail }],
      subject: "Your NaijaTransfer expires tomorrow",
      htmlContent: emailWrapper(content),
    });
    sent++;
  }

  return sent;
}
