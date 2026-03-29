import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About — NigeriaTransfer",
  description: "The first Nigerian-owned file transfer service. Built in Nigeria, for Nigeria.",
};

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-display font-bold mb-6">Built in Nigeria, for Nigeria.</h1>

        <div className="prose prose-lg text-[var(--text-secondary)] space-y-6">
          <p className="text-body">
            NigeriaTransfer is the first Nigerian-owned file transfer service. We exist because 109 million Nigerian internet users deserve a tool built for their reality — not adapted from a European product that doesn&apos;t understand our internet, our payment systems, or our communication patterns.
          </p>

          <h2 className="text-h2 text-[var(--text-primary)]">Why we built this</h2>
          <p className="text-body">
            Every day, millions of Nigerians hit the same wall: WhatsApp compresses their files. Google Drive demands an account. WeTransfer fails at 87% with no way to resume. The workaround? A USB drive passed hand-to-hand. In 2026.
          </p>
          <p className="text-body">
            We built NigeriaTransfer to fix this. Resumable uploads that survive flaky connections. WhatsApp sharing with one tap. Naira pricing via Paystack. USSD payments for users without bank cards. A lightweight mode that respects expensive data.
          </p>

          <h2 className="text-h2 text-[var(--text-primary)]">What we believe</h2>
          <ul className="text-body space-y-2 list-disc list-inside">
            <li><strong>Your files are yours.</strong> We auto-delete transfers on expiry. No copies. No mining your data.</li>
            <li><strong>Everyone deserves 4 GB free.</strong> No tricks, no bait-and-switch. Free means free.</li>
            <li><strong>Nigerian internet is not broken — tools are.</strong> Build for the connection you have, not the one you wish you had.</li>
            <li><strong>Naira is a real currency.</strong> We price in Naira, accept USSD, and don&apos;t require a dollar card.</li>
          </ul>

          <h2 className="text-h2 text-[var(--text-primary)]">For businesses and developers</h2>
          <p className="text-body">
            NigeriaTransfer isn&apos;t just a consumer app. Our public API lets Nigerian SaaS companies embed file transfer into their own products. Law firms collect documents. HR platforms handle CVs. Media agencies distribute assets. All through one API.
          </p>
        </div>

        <Card padding="lg" elevation="md" className="mt-12 text-center">
          <h2 className="text-h2 mb-2">Ready to try it?</h2>
          <p className="text-body text-[var(--text-secondary)] mb-4">Send your first file in 30 seconds. No account needed.</p>
          <a href="/"><Button variant="primary" size="lg">Send files now</Button></a>
        </Card>
      </div>
    </PageLayout>
  );
}
