import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "WeTransfer Alternative in Nigeria | NaijaTransfer",
  description: "4 GB free (twice WeTransfer's cap), resumable uploads, Naira pricing through Paystack, WhatsApp sharing in one tap. No account needed.",
  keywords: ["wetransfer alternative", "wetransfer nigeria", "file transfer nigeria", "send large files nigeria", "naijatransfer"],
  alternates: { canonical: "https://naijatransfer.com/wetransfer-alternative-nigeria" },
};

export default function WeTransferAlternativePage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-h1 sm:text-display font-bold mb-4">A WeTransfer alternative for Nigeria</h1>
        <p className="text-body text-[var(--text-secondary)] mb-8">
          WeTransfer works fine when you have fibre and a dollar card. From Lagos at 9pm with a Naira card and 5 Mbps up, the picture changes. Uploads time out, the file can&apos;t resume, your card gets declined for FX, and the free cap is 2 GB. NaijaTransfer was built for that picture.
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
                    ["Resumable uploads", "Picks up at the chunk that failed", "Starts over from zero"],
                    ["Account required", "No", "No, but limited"],
                    ["Pricing", "Naira, ₦2,000/mo", "USD, $12/mo"],
                    ["Payment methods", "Card, bank transfer, USSD", "International card only"],
                    ["WhatsApp sharing", "One tap from the share screen", "Copy and paste manually"],
                    ["Password protection", "Free on every transfer", "Paid only"],
                    ["File quality", "Bytes you sent, unchanged", "Original"],
                    ["Upload speed from Nigeria", "Routed through Africa-region edge", "Round trip to EU or US"],
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
                { title: "Uploads that finish", desc: "WeTransfer dies at 87 percent and there's no resume. We pick the upload back up at the chunk that failed when your line comes back." },
                { title: "Twice the free cap", desc: "4 GB free, against WeTransfer's 2 GB. Enough for a Nollywood rough cut, a wedding photo set, or a board pack." },
                { title: "Pay in Naira", desc: "Pro from ₦2,000 a month via Paystack. No FX, no foreign card, USSD if you don't have a card at all." },
                { title: "WhatsApp on the share screen", desc: "Tap WhatsApp and the link is in the chat. No copy, paste, app switch." },
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
                { q: "Is the free tier free for good?", a: "Yes. 4 GB per transfer, no account, no card. Pro subscriptions pay for the free tier." },
                { q: "Is it safe?", a: "Transfers are encrypted in transit and at rest. You can password-protect any transfer for free. We delete files at expiry." },
                { q: "Will it handle a Nollywood post workflow?", a: "Yes. The resume behaviour is the reason large video uploads from Lagos finish at all when the line stutters." },
                { q: "Why is it faster from Nigeria than WeTransfer?", a: "Two things. The resume means a dropped connection doesn't reset progress. And the upload endpoint sits closer than Frankfurt or Virginia, so the round trip is shorter on every chunk." },
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
          <a href="/"><Button variant="primary" size="lg">Try NaijaTransfer free</Button></a>
        </div>
      </div>
    </PageLayout>
  );
}
