import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import PricingCards from "@/components/shared/PricingCards";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/Accordion";

export const metadata: Metadata = {
  title: "Pricing — NaijaTransfer",
  description: "Simple Naira pricing. 4GB free. Pro from NGN 2,000/month. Business from NGN 10,000/month.",
};

const faqs = [
  { id: "free", q: "Is it really free?", a: "Yes. 4GB transfers, no account needed, no credit card. Free forever." },
  { id: "pay", q: "How do I pay?", a: "Via Paystack — card, bank transfer, or USSD. All in Naira. No foreign exchange needed." },
  { id: "cancel", q: "Can I cancel anytime?", a: "Yes. Cancel from your dashboard instantly. No lock-in, no penalties." },
  { id: "methods", q: "What payment methods do you accept?", a: "Visa, Mastercard, bank transfer, and USSD via Paystack." },
  { id: "compress", q: "Do you compress my files?", a: "Never. Your files transfer in original quality, always. Unlike WhatsApp." },
  { id: "expire", q: "What happens when my transfer expires?", a: "Files are permanently deleted. We don't keep copies. Your data stays yours." },
  { id: "annual", q: "Do you offer annual pricing?", a: "Annual pricing with a discount is coming soon." },
];

export default function PricingPage() {
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-h1 sm:text-display font-bold mb-3">Simple pricing. Naira only.</h1>
          <p className="text-body text-[var(--text-secondary)] max-w-xl mx-auto">
            Start free. Upgrade when you need more. All prices in Nigerian Naira.
          </p>
        </div>

        <PricingCards />

        <p className="text-center text-body-sm text-[var(--text-muted)] mt-6">
          Pay with card, bank transfer, or USSD via Paystack
        </p>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-h2 text-center mb-8">Frequently Asked Questions</h2>
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
