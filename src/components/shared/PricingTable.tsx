"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";

interface TierData {
  name: string;
  price: string;
  period: string;
  badge?: string;
  highlighted: boolean;
  features: string[];
  cta: string;
  ctaHref: string;
}

const tiers: TierData[] = [
  {
    name: "Free",
    price: "NGN 0",
    period: "",
    highlighted: false,
    features: [
      "4 GB per transfer",
      "7-day expiry",
      "50 downloads per transfer",
      "Password protection",
      "Ads on download pages",
      "No account required",
    ],
    cta: "Start Free",
    ctaHref: "/",
  },
  {
    name: "Pro",
    price: "NGN 2,000",
    period: "/month",
    badge: "Popular",
    highlighted: true,
    features: [
      "10 GB per transfer",
      "Up to 30-day expiry",
      "250 downloads per transfer",
      "Password protection",
      "No ads",
      "Dashboard + transfer history",
      "File request portals",
      "Email support",
    ],
    cta: "Upgrade to Pro",
    ctaHref: "/register",
  },
  {
    name: "Business",
    price: "NGN 10,000",
    period: "/month",
    highlighted: false,
    features: [
      "50 GB per transfer",
      "Up to 60-day expiry",
      "Unlimited downloads",
      "Password protection",
      "No ads",
      "Dashboard + analytics",
      "File request portals",
      "Custom branding",
      "API access",
      "Priority support",
    ],
    cta: "Contact Sales",
    ctaHref: "/contact",
  },
];

const faqItems = [
  {
    id: "free",
    question: "Is it really free?",
    answer:
      "Yes! Send files up to 4 GB per transfer with no account needed. Free forever, no credit card required.",
  },
  {
    id: "pay",
    question: "How do I pay?",
    answer:
      "We accept card, bank transfer, and USSD payments via Paystack. All prices are in Nigerian Naira (NGN).",
  },
  {
    id: "cancel",
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel from your dashboard anytime. You keep access until the end of your billing period.",
  },
  {
    id: "methods",
    question: "What payment methods do you accept?",
    answer: "Visa, Mastercard, bank transfer, and USSD via Paystack.",
  },
  {
    id: "annual",
    question: "Do you offer annual pricing?",
    answer: "Annual pricing with a discount is coming soon.",
  },
  {
    id: "files-cancel",
    question: "What happens to my files if I cancel?",
    answer:
      "Active transfers remain available until their expiry date, even after cancellation.",
  },
];

export interface PricingTableProps {
  className?: string;
}

/**
 * PricingTable: 3-tier comparison with Naira pricing (FR81).
 *
 * Pro tier highlighted with "Popular" badge and green border.
 * Includes feature comparison and FAQ accordion.
 * Responsive: stacks vertically on mobile, 3-column grid on tablet/desktop.
 */
export default function PricingTable({ className }: PricingTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Tier cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            padding="lg"
            elevation={tier.highlighted ? "lg" : "md"}
            className={cn(
              "relative flex flex-col",
              tier.highlighted &&
                "border-2 border-nigerian-green ring-1 ring-nigerian-green/20"
            )}
          >
            {/* Badge */}
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="pro" size="md">
                  {tier.badge}
                </Badge>
              </div>
            )}

            {/* Tier name */}
            <h3 className="text-h3 text-[var(--text-primary)]">{tier.name}</h3>

            {/* Price */}
            <div className="mt-3 mb-6">
              <span className="text-h1 sm:text-display text-[var(--text-primary)]">
                {tier.price}
              </span>
              {tier.period && (
                <span className="text-body-sm text-[var(--text-secondary)]">
                  {tier.period}
                </span>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-1" role="list">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 mt-0.5 text-nigerian-green"
                    aria-hidden="true"
                  >
                    <path d="M3.5 8.5L6 11l6.5-6.5" />
                  </svg>
                  <span className="text-body-sm text-[var(--text-secondary)]">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button
              variant={tier.highlighted ? "primary" : "secondary"}
              size="lg"
              fullWidth
            >
              <a href={tier.ctaHref}>{tier.cta}</a>
            </Button>
          </Card>
        ))}
      </div>

      {/* Payment methods note */}
      <p className="text-center text-body-sm text-[var(--text-muted)] mt-6">
        Pay with card, bank transfer, or USSD via Paystack
      </p>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-16">
        <h2 className="text-h1 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <Accordion multiple>
          {faqItems.map((item) => (
            <AccordionItem key={item.id} id={item.id}>
              <AccordionTrigger id={item.id}>
                {item.question}
              </AccordionTrigger>
              <AccordionContent id={item.id}>
                <p className="text-body-sm text-[var(--text-secondary)]">
                  {item.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
