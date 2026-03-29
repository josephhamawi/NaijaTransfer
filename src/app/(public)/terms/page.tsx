import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";

export const metadata: Metadata = {
  title: "Terms of Service — NigeriaTransfer",
  description: "NigeriaTransfer terms of service.",
};

export default function TermsPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-display font-bold mb-6">Terms of Service</h1>
        <p className="text-caption-style text-[var(--text-muted)] mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-body text-[var(--text-secondary)]">
          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Acceptance</h2>
            <p>By using NigeriaTransfer, you agree to these terms. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Service description</h2>
            <p>NigeriaTransfer provides temporary file transfer services. Files are stored for a limited period (7-60 days) and automatically deleted upon expiry. We do not guarantee permanent storage.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Acceptable use</h2>
            <p>You may not use NigeriaTransfer to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Upload, share, or distribute malware, viruses, or malicious code</li>
              <li>Share copyrighted content without authorization</li>
              <li>Distribute illegal content under Nigerian law</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Circumvent transfer limits through multiple accounts</li>
              <li>Use the service for spam or unsolicited communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Content moderation</h2>
            <p>We reserve the right to disable or delete any transfer reported for abuse. If you believe content violates these terms, use the &quot;Report Abuse&quot; link on the download page. We aim to process reports within 24 hours.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Subscriptions and payments</h2>
            <p>Paid plans are billed monthly via Paystack in Nigerian Naira. You may cancel at any time from your dashboard. Cancellation takes effect at the end of the current billing period. No refunds for partial months.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Limitation of liability</h2>
            <p>NigeriaTransfer is provided &quot;as is&quot; without warranty. We are not liable for data loss, transfer failures, or service interruptions. Our maximum liability is limited to the amount you paid in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Governing law</h2>
            <p>These terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be resolved in the courts of Lagos State.</p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
