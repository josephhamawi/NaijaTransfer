import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About NaijaTransfer",
  description: "The first Nigerian-owned file transfer service. Built in Nigeria, for Nigeria.",
};

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-h1 sm:text-display font-bold mb-6">Built in Nigeria, for Nigeria.</h1>

        <div className="prose prose-lg text-[var(--text-secondary)] space-y-6">
          <p className="text-body">
            NaijaTransfer is the first Nigerian-owned file transfer service. 109 million Nigerians use the internet every month. They deserve a tool that knows what their internet, their bank cards, and their messaging habits look like, instead of one ported from Amsterdam.
          </p>

          <h2 className="text-h2 text-[var(--text-primary)]">Why we built it</h2>
          <p className="text-body">
            The same wall comes up every week. WhatsApp compresses your file into something the client rejects. Google Drive wants an account. WeTransfer dies at 87 percent and can&apos;t resume. The fallback that still gets used in 2026 is a USB drive passed hand to hand in traffic.
          </p>
          <p className="text-body">
            So we built one. Uploads pick up at the chunk that failed, not at zero. WhatsApp share is one tap. Pricing is in Naira through Paystack, with USSD for people who don&apos;t carry a bank card. There&apos;s a lightweight mode for when data is expensive.
          </p>

          <h2 className="text-h2 text-[var(--text-primary)]">What we believe</h2>
          <ul className="text-body space-y-2 list-disc list-inside">
            <li><strong>Your files are yours.</strong> We delete transfers at expiry. No copies. We don&apos;t mine your data.</li>
            <li><strong>4 GB free is not a trial.</strong> No surprise paywalls. Free is free.</li>
            <li><strong>The internet here works. Most tools don&apos;t.</strong> Design for the line you actually have.</li>
            <li><strong>Naira is a real currency.</strong> We price in Naira, accept USSD, and don&apos;t require a dollar card.</li>
          </ul>

          <h2 className="text-h2 text-[var(--text-primary)]">For businesses and developers</h2>
          <p className="text-body">
            NaijaTransfer is also an API. Nigerian SaaS teams plug it into their own product. Law firms use it to collect documents from clients. HR platforms use it for CVs and onboarding files. Media agencies use it to ship campaign assets. One integration, the same upload that handles 50 GB.
          </p>
        </div>

        <Card padding="lg" elevation="md" className="mt-12 text-center">
          <h2 className="text-h2 mb-2">Send a file</h2>
          <p className="text-body text-[var(--text-secondary)] mb-4">Around 30 seconds. No account, no card.</p>
          <a href="/"><Button variant="primary" size="lg">Send a file</Button></a>
        </Card>
      </div>
    </PageLayout>
  );
}
