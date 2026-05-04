import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Send Large Files in Nigeria, Free | NaijaTransfer",
  description: "Send files up to 4 GB free, no account. Uploads resume after dropped connections. WhatsApp share, Naira pricing through Paystack.",
};

export default function SEOLandingPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-h1 sm:text-display font-bold mb-4">Send large files in Nigeria, free</h1>
        <p className="text-body text-[var(--text-secondary)] mb-8">
          NaijaTransfer sends files up to 4 GB at no cost, with no account. Your upload picks back up at the chunk that failed when the connection drops, and a WhatsApp share is one tap from the share screen.
        </p>

        <a href="/"><Button variant="primary" size="lg">Send a file free</Button></a>

        <div className="mt-12 space-y-8">
          <section>
            <h2 className="text-h2 font-bold mb-3">Why NaijaTransfer?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "4 GB free", desc: "Twice WeTransfer's 2 GB cap." },
                { title: "Resumable uploads", desc: "Connection drops at 73 percent, your upload picks up at 73 percent. Not at zero." },
                { title: "No account needed", desc: "Drop the file, get the link, share it. Around 30 seconds end to end." },
                { title: "WhatsApp sharing", desc: "Tap WhatsApp on the share screen and the link is in the chat." },
                { title: "Files arrive uncompressed", desc: "We send the bytes you uploaded. WhatsApp will mangle a video. We won't." },
                { title: "Naira pricing", desc: "Pro starts at ₦2,000 a month. Card, bank transfer, or USSD via Paystack." },
              ].map((item) => (
                <Card key={item.title} padding="md" elevation="sm">
                  <h3 className="text-body font-semibold mb-1">{item.title}</h3>
                  <p className="text-body-sm text-[var(--text-secondary)]">{item.desc}</p>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-h2 font-bold mb-3">How to send large files in Nigeria</h2>
            <ol className="list-decimal list-inside space-y-2 text-body text-[var(--text-secondary)]">
              <li>Open <a href="/" className="text-nigerian-green hover:underline">nigeriatransfer.com</a></li>
              <li>Drag your files in, or tap to pick on mobile</li>
              <li>Add a password, expiry, or download limit if you want one</li>
              <li>Hit Transfer. The share link appears in seconds</li>
              <li>Send it via WhatsApp, SMS, email, or as a QR code</li>
            </ol>
          </section>

          <section>
            <h2 className="text-h2 font-bold mb-3">NaijaTransfer vs alternatives</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-2 pr-4 whitespace-nowrap">Feature</th>
                    <th className="text-left py-2 px-4 whitespace-nowrap">NaijaTransfer</th>
                    <th className="text-left py-2 px-4 whitespace-nowrap">WeTransfer</th>
                    <th className="text-left py-2 px-4 whitespace-nowrap">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-secondary)]">
                  {[
                    ["Free limit", "4 GB", "2 GB", "2 GB"],
                    ["Resumable upload", "Yes", "No", "No"],
                    ["Account required", "No", "No", "Yes"],
                    ["WhatsApp sharing", "One tap", "Manual", "Built-in"],
                    ["File quality", "Original", "Original", "Compressed"],
                    ["Naira pricing", "Yes", "USD only", "N/A"],
                    ["Password protection", "Free", "Paid only", "No"],
                  ].map(([feature, nt, wt, wa]) => (
                    <tr key={feature} className="border-b border-[var(--border-color)]">
                      <td className="py-2 pr-4 font-medium text-[var(--text-primary)]">{feature}</td>
                      <td className="py-2 px-4 text-nigerian-green font-medium">{nt}</td>
                      <td className="py-2 px-4">{wt}</td>
                      <td className="py-2 px-4">{wa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <a href="/"><Button variant="primary" size="lg">Send your first file</Button></a>
        </div>
      </div>
    </PageLayout>
  );
}
