import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Best WeTransfer Alternative in Nigeria — NaijaTransfer",
  description: "NaijaTransfer is the best WeTransfer alternative for Nigerians. 4GB free (2x WeTransfer), resumable uploads, Naira pricing, WhatsApp sharing. No account needed.",
  keywords: ["wetransfer alternative", "wetransfer nigeria", "file transfer nigeria", "send large files nigeria", "naijatransfer"],
  alternates: { canonical: "https://naijatransfer.com/wetransfer-alternative-nigeria" },
};

export default function WeTransferAlternativePage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-h1 sm:text-display font-bold mb-4">Best WeTransfer Alternative in Nigeria</h1>
        <p className="text-body text-[var(--text-secondary)] mb-8">
          WeTransfer is great — but it wasn&apos;t built for Nigeria. Slow uploads from Lagos, no resume when your connection drops, USD pricing your Naira card might reject, and only 2GB free. NaijaTransfer fixes all of that.
        </p>

        <a href="/"><Button variant="primary" size="lg">Try NaijaTransfer free</Button></a>

        <div className="mt-12 space-y-8">
          {/* Comparison Table */}
          <section>
            <h2 className="text-h2 font-bold mb-4">NaijaTransfer vs WeTransfer</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 pr-4 whitespace-nowrap">Feature</th>
                    <th className="text-left py-3 px-4 text-nigerian-green font-bold whitespace-nowrap">NaijaTransfer</th>
                    <th className="text-left py-3 px-4 whitespace-nowrap">WeTransfer</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-secondary)]">
                  {[
                    ["Free transfer limit", "4 GB", "2 GB"],
                    ["Resumable uploads", "Yes — picks up where it left off", "No — starts over if interrupted"],
                    ["Account required", "No", "No (but limited)"],
                    ["Pricing", "Naira (₦2,000/mo)", "USD ($12/mo)"],
                    ["Payment methods", "Card, bank transfer, USSD", "International card only"],
                    ["WhatsApp sharing", "One-tap deep link", "Copy & paste manually"],
                    ["Password protection", "Free for everyone", "Paid only"],
                    ["File quality", "Original — never compressed", "Original"],
                    ["Upload speed from Nigeria", "Fast — optimized routing", "Slow — EU/US servers"],
                    ["Built for", "Nigeria", "Europe"],
                  ].map(([feature, nt, wt]) => (
                    <tr key={feature} className="border-b border-[var(--border-color)]">
                      <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{feature}</td>
                      <td className="py-3 px-4 text-nigerian-green font-medium">{nt}</td>
                      <td className="py-3 px-4">{wt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Why Switch */}
          <section>
            <h2 className="text-h2 font-bold mb-4">Why Nigerians are switching from WeTransfer</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Uploads that actually finish", desc: "WeTransfer fails at 87% with no way to resume. NaijaTransfer picks up exactly where it left off when your connection drops." },
                { title: "2x the free limit", desc: "4GB free vs WeTransfer's 2GB. That's enough for most Nollywood rough cuts, photo shoots, and business documents." },
                { title: "Pay in Naira, not dollars", desc: "Pro from ₦2,000/month via Paystack. No FX charges, no card declines, USSD payment for everyone." },
                { title: "WhatsApp-native sharing", desc: "One tap to share your download link via WhatsApp. Not copy-paste-switch-app. One tap." },
              ].map((item) => (
                <Card key={item.title} padding="md" elevation="sm">
                  <h3 className="text-body font-semibold mb-1">{item.title}</h3>
                  <p className="text-body-sm text-[var(--text-secondary)]">{item.desc}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-h2 font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "Is NaijaTransfer really free?", a: "Yes. 4GB transfers, no account needed. Free forever. We make money from Pro subscriptions, not tricks." },
                { q: "Is it safe?", a: "Files are encrypted in transit and at rest. Password protection is free. Files auto-delete on expiry." },
                { q: "Can I use it for Nollywood post-production?", a: "Absolutely. Built for exactly this — large video files that survive Nigerian internet connections." },
                { q: "How is it faster than WeTransfer?", a: "Resumable uploads mean a dropped connection doesn't restart your upload. Plus Cloudflare CDN for static assets." },
              ].map((item) => (
                <div key={item.q} className="border-b border-[var(--border-color)] pb-4">
                  <h3 className="text-body font-semibold mb-1">{item.q}</h3>
                  <p className="text-body-sm text-[var(--text-secondary)]">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-12 text-center">
          <a href="/"><Button variant="primary" size="lg">Switch to NaijaTransfer — free</Button></a>
        </div>
      </div>
    </PageLayout>
  );
}
