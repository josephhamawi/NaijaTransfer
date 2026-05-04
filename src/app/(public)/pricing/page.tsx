import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import PricingCards from "@/components/shared/PricingCards";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/Accordion";

export const metadata: Metadata = {
  title: "Pricing | NaijaTransfer",
  description: "Naira pricing. 4 GB free. Pro from NGN 2,000 a month. Business from NGN 10,000 a month.",
};

const faqs = [
  { id: "free", q: "Is the free tier free for good?", a: "Yes. 4 GB per transfer, no account, no card. Pro subscriptions pay for the free tier." },
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
            Start on the free tier. Upgrade the day you need a bigger transfer. Every plan is priced in Nigerian Naira.
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
