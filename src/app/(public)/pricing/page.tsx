import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/Accordion";

export const metadata: Metadata = {
  title: "Pricing — NaijaTransfer",
  description: "Simple Naira pricing. 4GB free. Pro from NGN 2,000/month. Business from NGN 10,000/month.",
};

const plans = [
  {
    name: "Free",
    price: "₦0",
    period: "forever",
    badge: null,
    features: [
      "4 GB per transfer",
      "7-day expiry",
      "50 downloads per transfer",
      "10 transfers per day",
      "Password protection",
      "WhatsApp, SMS, QR sharing",
      "No account required",
    ],
    limitations: ["Ads on download pages"],
    cta: "Start Free",
    ctaVariant: "outline" as const,
    href: "/",
  },
  {
    name: "Pro",
    price: "₦2,000",
    period: "/month",
    badge: "Popular",
    features: [
      "10 GB per transfer",
      "30-day expiry",
      "250 downloads per transfer",
      "100 transfers per day",
      "Password protection",
      "No ads on download pages",
      "Priority upload speed",
      "File request portals",
      "Transfer management dashboard",
    ],
    limitations: [],
    cta: "Upgrade to Pro",
    ctaVariant: "primary" as const,
    href: "/register?plan=pro",
  },
  {
    name: "Business",
    price: "₦10,000",
    period: "/month",
    badge: null,
    features: [
      "50 GB per transfer",
      "60-day expiry",
      "Unlimited downloads",
      "500 transfers per day",
      "Custom branding on download pages",
      "Your logo and colors",
      "API access",
      "Priority support",
      "Everything in Pro",
    ],
    limitations: [],
    cta: "Go Business",
    ctaVariant: "gold" as const,
    href: "/register?plan=business",
  },
];

const faqs = [
  { q: "Is it really free?", a: "Yes. 4GB transfers, no account needed, no credit card. Free forever." },
  { q: "How do I pay?", a: "Via Paystack — card, bank transfer, or USSD. All in Naira. No foreign exchange needed." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your dashboard instantly. No lock-in, no penalties." },
  { q: "What payment methods do you accept?", a: "Debit/credit card, bank transfer, and USSD (no smartphone needed for USSD)." },
  { q: "Do you compress my files?", a: "Never. Your files transfer in original quality, always. Unlike WhatsApp." },
  { q: "What happens when my transfer expires?", a: "Files are permanently deleted. We don't keep copies. Your data stays yours." },
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

        {/* Pricing cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} elevation={plan.badge ? "lg" : "md"} padding="lg"
              className={plan.badge ? "ring-2 ring-nigerian-green relative md:scale-105 md:z-10" : ""}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="pro">{plan.badge}</Badge>
                </div>
              )}
              <div className="text-center mb-6">
                <h2 className="text-h3 font-bold mb-1">{plan.name}</h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-h1 sm:text-display font-bold">{plan.price}</span>
                  <span className="text-body-sm text-[var(--text-muted)]">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body-sm">
                    <svg className="w-5 h-5 text-nigerian-green shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
                {plan.limitations.map((l) => (
                  <li key={l} className="flex items-start gap-2 text-body-sm text-[var(--text-muted)]">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {l}
                  </li>
                ))}
              </ul>
              <a href={plan.href}>
                <Button variant={plan.ctaVariant} size="lg" fullWidth>{plan.cta}</Button>
              </a>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-h2 text-center mb-8">Frequently Asked Questions</h2>
          <Accordion>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} id={`faq-${i}`}>
                <AccordionTrigger id={`faq-${i}`}>{faq.q}</AccordionTrigger>
                <AccordionContent id={`faq-${i}`}>
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
