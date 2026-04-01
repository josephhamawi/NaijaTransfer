"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const plans = [
  {
    name: "Free",
    tier: null,
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
    tier: "PRO" as const,
    price: "₦2,000",
    period: "/month",
    badge: "Popular",
    features: [
      "10 GB per transfer",
      "30-day expiry",
      "250 downloads per transfer",
      "100 transfers per day",
      "No ads on download pages",
      "Priority upload speed",
      "File request portals",
      "Transfer management dashboard",
    ],
    limitations: [],
    cta: "Upgrade to Pro",
    ctaVariant: "primary" as const,
    href: null,
  },
  {
    name: "Business",
    tier: "BUSINESS" as const,
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
    href: null,
  },
];

export default function PricingCards() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpgrade(tier: "PRO" | "BUSINESS") {
    if (!user) {
      router.push(`/login?redirect=/pricing&plan=${tier.toLowerCase()}`);
      return;
    }

    setLoadingPlan(tier);
    setError("");

    try {
      const res = await authFetch("/api/user/subscription", {
        method: "POST",
        body: JSON.stringify({ plan: tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Something went wrong");
        return;
      }

      // Redirect to Paystack checkout
      window.location.href = data.data.checkoutUrl;
    } catch {
      setError("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <>
      {error && (
        <div className="max-w-md mx-auto mb-6 px-4 py-3 rounded-xl bg-[var(--error-bg)] text-error-red text-body-sm text-center">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            elevation={plan.badge ? "lg" : "md"}
            padding="lg"
            className={`relative flex flex-col ${plan.badge ? "ring-2 ring-nigerian-green md:scale-105 md:z-10" : ""}`}
          >
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

            <ul className="space-y-2 mb-6 flex-1">
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

            {plan.tier ? (
              <Button
                variant={plan.ctaVariant}
                size="lg"
                fullWidth
                loading={loadingPlan === plan.tier}
                disabled={authLoading || !!loadingPlan}
                onClick={() => handleUpgrade(plan.tier!)}
              >
                {plan.cta}
              </Button>
            ) : (
              <a href={plan.href!}>
                <Button variant={plan.ctaVariant} size="lg" fullWidth>
                  {plan.cta}
                </Button>
              </a>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
