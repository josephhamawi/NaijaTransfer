import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import PricingCards from "@/components/shared/PricingCards";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/Accordion";

export const metadata: Metadata = {
  title: "Pricing | NaijaTransfer",
  description:
    "Naira pricing. Live Send is free and sends files browser to browser. Stored transfers from NGN 2,000 a month.",
  alternates: { canonical: "https://naijatransfer.com/pricing" },
};

const faqs = [
  {
    id: "free",
    q: "Is the free tier free for good?",
    a: "Yes. The free tier is Live Send: your files travel straight from your browser to the recipient's, so there is nothing for us to store or serve. No account, no card.",
  },
  {
    id: "live-vs-stored",
    q: "What is the difference between Live Send and a Stored Transfer?",
    a: "Live Send is a direct connection between two browsers. It starts instantly and costs nothing, but you both have to stay on the page until it finishes. A Stored Transfer uploads once to our storage, so the recipient can download whenever they like — that needs Pro or Business.",
  },
  {
    id: "live-requirements",
    q: "What does Live Send need to work?",
    a: "Both people on the page at the same time, and a network path between you. Chrome or Edge on desktop is best: those browsers save files to disk as they arrive, so size is limited only by patience. Firefox and Safari hold each file in the tab until it finishes, which caps a transfer at 1 GB. Some mobile and office networks block direct connections entirely — if that happens we say so rather than silently uploading.",
  },
  {
    id: "live-offline",
    q: "Can I use Live Send if the recipient is offline?",
    a: "No. That is what a Stored Transfer is for. If you need to send files and walk away, you need Pro or Business.",
  },
  { id: "pay", q: "How do I pay?", a: "Through Paystack: card, bank transfer, or USSD. Pricing is in Naira, so there is no FX." },
  { id: "cancel", q: "Can I cancel any time?", a: "Yes. Cancel from your dashboard. You keep access until the end of the billing period." },
  { id: "methods", q: "What payment methods do you accept?", a: "Visa, Mastercard, bank transfer, and USSD through Paystack." },
  { id: "compress", q: "Do you compress my files?", a: "No. We send the bytes you uploaded. WhatsApp re-encodes a video. We don't." },
  { id: "expire", q: "What happens when a transfer expires?", a: "We delete the files. There is no backup tier holding a copy." },
  { id: "annual", q: "Do you offer annual pricing?", a: "Annual plans at a discount are shipping soon. Drop your email on the homepage and we will tell you when." },
];

export default function PricingPage() {
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-h1 sm:text-display font-bold mb-3">Pricing in Naira.</h1>
          <p className="text-body text-[var(--text-secondary)] max-w-xl mx-auto">
            Live Send is free: files go straight from your browser to theirs. Upgrade when you
            need to upload once and let someone download later. Every plan is priced in
            Nigerian Naira.
          </p>
        </div>

        <PricingCards />

        <p className="text-center text-body-sm text-[var(--text-muted)] mt-6">
          Pay with card, bank transfer, or USSD via Paystack
        </p>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-h2 text-center mb-8">Common questions</h2>
          <Accordion>
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} id={faq.id}>
                <AccordionTrigger id={faq.id}>{faq.q}</AccordionTrigger>
                <AccordionContent id={faq.id}>
                  <p className="text-body-sm text-[var(--text-secondary)]">{faq.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </PageLayout>
  );
}
