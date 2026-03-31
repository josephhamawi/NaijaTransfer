import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "NaijaTransfer for Business — Custom Branding, 50GB, API Access",
  description: "Enterprise file transfer for Nigerian businesses. Custom branding, 50GB transfers, API access, file request portals, and priority support. From ₦10,000/month.",
};

const features = [
  {
    icon: "🎨",
    title: "Custom Branding",
    description: "Your logo, your colors, your background on every download page. Recipients see your brand, not ours.",
  },
  {
    icon: "📦",
    title: "50 GB Transfers",
    description: "Send massive files — Nollywood dailies, architectural plans, legal archives. Up to 50 GB per transfer.",
  },
  {
    icon: "🔌",
    title: "API Access",
    description: "Integrate file transfer into your own apps. Embeddable upload widget, webhooks, and full REST API.",
  },
  {
    icon: "📥",
    title: "File Request Portals",
    description: "Create upload links for clients: \"Submit your documents here.\" Perfect for HR, legal, media.",
  },
  {
    icon: "🔒",
    title: "Password Protection",
    description: "Every transfer can be password-protected. Control exactly who downloads your files.",
  },
  {
    icon: "📊",
    title: "Transfer Analytics",
    description: "See who downloaded, when, and how many times. Full audit trail for compliance.",
  },
  {
    icon: "⚡",
    title: "Priority Speed",
    description: "500 transfers per day. 60-day expiry. Unlimited downloads. No ads on any page.",
  },
  {
    icon: "🤝",
    title: "Dedicated Support",
    description: "Direct email support with priority response. We help you get set up and running.",
  },
];

const useCases = [
  {
    industry: "Law Firms",
    description: "Share contracts, court filings, and compliance documents securely with clients. Password protection + audit trail.",
  },
  {
    industry: "Media & Nollywood",
    description: "Send 50GB video files to directors, editors, and distributors. Resumable uploads survive any connection.",
  },
  {
    industry: "HR Departments",
    description: "Collect CVs, certificates, and onboarding documents via File Request Portals. No IT setup needed.",
  },
  {
    industry: "Real Estate",
    description: "Share property documents, survey plans, and certificates of occupancy with buyers and lawyers.",
  },
  {
    industry: "Advertising Agencies",
    description: "Distribute campaign assets — videos, print files, audio spots — to clients and media houses.",
  },
  {
    industry: "Schools & Universities",
    description: "Collect student submissions, share course materials, and distribute exam results securely.",
  },
];

export default function BusinessPage() {
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-nigerian-green/10 text-nigerian-green text-xs font-semibold mb-4">
            FOR BUSINESSES
          </div>
          <h1 className="text-display font-bold mb-4">
            File transfer built for<br />Nigerian businesses
          </h1>
          <p className="text-body text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            Custom branding, 50 GB transfers, API access, file request portals, and priority support.
            Everything your team needs to share files professionally.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/pricing">
              <Button variant="primary" size="lg">Start with Business — ₦10,000/mo</Button>
            </a>
            <a href="/contact">
              <Button variant="outline" size="lg">Contact Sales</Button>
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="text-h2 font-bold text-center mb-8">Everything you need</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} padding="md" elevation="sm">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="text-body font-semibold mb-1">{f.title}</h3>
                <p className="text-caption-style text-[var(--text-secondary)]">{f.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-16">
          <Card padding="lg" elevation="md" className="text-center">
            <h2 className="text-h2 font-bold mb-2">Simple pricing</h2>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-display font-bold">₦10,000</span>
              <span className="text-body text-[var(--text-muted)]">/month</span>
            </div>
            <p className="text-body-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              Everything included. No per-seat pricing. No hidden fees. Cancel anytime.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 max-w-md mx-auto text-left mb-6">
              {[
                "50 GB per transfer",
                "60-day expiry",
                "Unlimited downloads",
                "500 transfers/day",
                "Custom branding",
                "API access",
                "File request portals",
                "No ads anywhere",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-body-sm">
                  <svg className="w-4 h-4 text-nigerian-green shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
            <a href="/pricing">
              <Button variant="primary" size="lg">Get started</Button>
            </a>
          </Card>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-h2 font-bold text-center mb-8">Built for every industry</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc) => (
              <Card key={uc.industry} padding="md" elevation="sm">
                <h3 className="text-body font-semibold mb-1">{uc.industry}</h3>
                <p className="text-caption-style text-[var(--text-secondary)]">{uc.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* White Label / Enterprise */}
        <section className="mb-16">
          <Card padding="lg" elevation="md" className="bg-charcoal-800 text-white">
            <div className="text-center">
              <h2 className="text-h2 font-bold mb-2">Need a white-label solution?</h2>
              <p className="text-body-sm text-white/60 mb-6 max-w-lg mx-auto">
                For enterprises that need custom domains, dedicated infrastructure, SLA guarantees, and full API integration — we offer white-label partnerships from ₦50,000/month.
              </p>
              <a href="/contact">
                <Button variant="gold" size="lg">Talk to us</Button>
              </a>
            </div>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-h2 font-bold mb-2">Ready to upgrade your file sharing?</h2>
          <p className="text-body-sm text-[var(--text-secondary)] mb-6">
            Start with a free transfer. No credit card needed. Upgrade when you&apos;re ready.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/"><Button variant="primary" size="lg">Try free first</Button></a>
            <a href="/pricing"><Button variant="outline" size="lg">See all plans</Button></a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
