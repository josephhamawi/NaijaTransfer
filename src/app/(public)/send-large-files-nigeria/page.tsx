import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Send Large Files in Nigeria — Free | NigeriaTransfer",
  description: "Send large files up to 4GB for free in Nigeria. No account required. Resumable uploads built for Nigerian internet. WhatsApp sharing. Naira pricing.",
};

export default function SEOLandingPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-h1 sm:text-display font-bold mb-4">Send Large Files in Nigeria — Free</h1>
        <p className="text-body text-[var(--text-secondary)] mb-8">
          NigeriaTransfer lets you send files up to 4 GB for free, with no account required. Built specifically for Nigerian internet — uploads resume when your connection drops, and you can share via WhatsApp with one tap.
        </p>

        <a href="/"><Button variant="primary" size="lg">Send files now — free</Button></a>

        <div className="mt-12 space-y-8">
          <section>
            <h2 className="text-h2 font-bold mb-3">Why NigeriaTransfer?</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "4 GB free", desc: "Double WeTransfer's 2 GB limit. No tricks." },
                { title: "Resumable uploads", desc: "Connection drops at 73%? It picks up at 73%. Built for Nigerian internet." },
                { title: "No account needed", desc: "Upload, get a link, share. 30 seconds. Zero sign-up." },
                { title: "WhatsApp sharing", desc: "One tap to share your download link via WhatsApp." },
                { title: "Original quality", desc: "We never compress or modify your files. Unlike WhatsApp." },
                { title: "Naira pricing", desc: "Pro from ₦2,000/month. Pay via card, bank transfer, or USSD." },
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
              <li>Go to <a href="/" className="text-nigerian-green hover:underline">nigeriatransfer.com</a></li>
              <li>Drag and drop your files (or tap to select on mobile)</li>
              <li>Optionally set a password, expiry, or download limit</li>
              <li>Click Transfer — get a link in seconds</li>
              <li>Share via WhatsApp, SMS, email, or QR code</li>
            </ol>
          </section>

          <section>
            <h2 className="text-h2 font-bold mb-3">NigeriaTransfer vs alternatives</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-2 pr-4 whitespace-nowrap">Feature</th>
                    <th className="text-left py-2 px-4 whitespace-nowrap">NigeriaTransfer</th>
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
          <a href="/"><Button variant="primary" size="lg">Start sending files — free</Button></a>
        </div>
      </div>
    </PageLayout>
  );
}
