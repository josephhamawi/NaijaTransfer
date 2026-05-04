import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "NaijaTransfer for Business: 50 GB transfers, branding, API",
  description: "File transfer for Nigerian businesses. Custom branding, 50 GB transfers, API access, file request portals, priority support. From ₦10,000 a month.",
};

const features = [
  {
    icon: "🎨",
    title: "Custom branding",
    description: "Your logo, your colours, your wallpaper on the download page. Recipients see your brand.",
  },
  {
    icon: "📦",
    title: "50 GB transfers",
    description: "Send a Nollywood dailies bundle, an architectural plan set, or a legal archive in one transfer.",
  },
  {
    icon: "🔌",
    title: "API access",
    description: "Drop file transfer into your own product. Embeddable upload widget, webhooks, REST API.",
  },
  {
    icon: "📥",
    title: "File request portals",
    description: "Send a link that says \"submit your documents here.\" Useful for HR, legal, media handoffs.",
  },
  {
    icon: "🔒",
    title: "Password protection",
    description: "Lock any transfer behind a password. You decide who downloads it.",
  },
  {
    icon: "📊",
    title: "Transfer analytics",
    description: "Who downloaded, when, and how many times. Full audit trail for compliance reviews.",
  },
  {
    icon: "⚡",
    title: "Bigger ceilings",
    description: "500 transfers a day. 60-day expiry. Unlimited downloads. No ads on the share or download page.",
  },
  {
    icon: "🤝",
    title: "Dedicated support",
    description: "Email us and a person replies within a working day. We help you with setup if you need it.",
  },
];

const useCases = [
  {
    industry: "Law firms",
    description: "Send contracts, court filings, and compliance packs to clients. Password the transfer, keep the audit trail.",
  },
  {
    industry: "Media and Nollywood",
    description: "Ship 50 GB video bundles to directors, editors, and distributors. Uploads pick back up after a connection drop.",
  },
  {
    industry: "HR departments",
    description: "Use a file request portal to collect CVs, certificates, and onboarding docs. No IT ticket required.",
  },
  {
    industry: "Real estate",
    description: "Share property documents, survey plans, and Certificates of Occupancy with buyers and lawyers.",
  },
  {
    industry: "Advertising agencies",
    description: "Distribute campaign assets to clients and media houses: videos, print files, audio spots, all in one transfer.",
  },
  {
    industry: "Schools and universities",
    description: "Collect student submissions, share course materials, send out exam results behind a password.",
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
            50 GB per transfer. Branded download pages. An API your engineers can drop in. A file request portal so clients can send you documents without an account. Priority support that replies the same day.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/pricing">
              <Button variant="primary" size="lg">Start Business at ₦10,000/mo</Button>
            </a>
            <a href="/contact">
              <Button variant="outline" size="lg">Talk to sales</Button>
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="text-h2 font-bold text-center mb-8">What you get</h2>
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
            <h2 className="text-h2 font-bold mb-2">One price</h2>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-display font-bold">₦10,000</span>
              <span className="text-body text-[var(--text-muted)]">/month</span>
            </div>
            <p className="text-body-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              Flat. Not per seat. Cancel from your dashboard the day you want to.
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
          <h2 className="text-h2 font-bold text-center mb-8">Where teams use it</h2>
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
              <h2 className="text-h2 font-bold mb-2">Need a white-label setup?</h2>
              <p className="text-body-sm text-white/60 mb-6 max-w-lg mx-auto">
                If your team needs a custom domain, dedicated infrastructure, an SLA, and deeper API integration, we run white-label deployments from ₦50,000 a month.
              </p>
              <a href="/contact">
                <Button variant="gold" size="lg">Talk to us</Button>
              </a>
            </div>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-h2 font-bold mb-2">Send your first transfer first.</h2>
          <p className="text-body-sm text-[var(--text-secondary)] mb-6">
            No card. No account. Upgrade once you&apos;ve seen it work on your line.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/"><Button variant="primary" size="lg">Send a free transfer</Button></a>
            <a href="/pricing"><Button variant="outline" size="lg">See all plans</Button></a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
