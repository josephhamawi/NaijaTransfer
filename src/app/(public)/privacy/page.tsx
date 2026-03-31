import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — NigeriaTransfer",
  description: "NigeriaTransfer privacy policy. NDPA compliant.",
};

export default function PrivacyPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16 prose-styles">
        <h1 className="text-h1 sm:text-display font-bold mb-6">Privacy Policy</h1>
        <p className="text-caption-style text-[var(--text-muted)] mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-body text-[var(--text-secondary)]">
          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">What we collect</h2>
            <p>When you upload files, we collect: file metadata (name, size, type), sender email (if provided), recipient emails (if provided), IP address hash (we never store your raw IP), and browser user-agent. If you create an account, we store your email, phone number, and name.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">How we use your data</h2>
            <p>We use your data solely to: deliver file transfers, send notifications, process payments, prevent abuse, and improve the service. We do not sell, rent, or share your data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">File storage and deletion</h2>
            <p>Uploaded files are stored on Cloudflare R2 with encryption at rest (AES-256). Files are automatically and permanently deleted when they expire (7-60 days depending on your plan). We do not keep copies of deleted files. Download logs are retained for 90 days, then automatically purged.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Cross-border data transfer</h2>
            <p>Our servers are hosted outside Nigeria. By using NigeriaTransfer, you consent to your data being processed in the server region. We maintain Standard Contractual Clauses with our infrastructure providers (Oracle Cloud, Cloudflare) to ensure adequate protection under the Nigeria Data Protection Act 2023 (NDPA).</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Your rights</h2>
            <p>Under the NDPA, you have the right to: access your data, correct inaccurate data, request deletion of your data, and object to processing. To exercise these rights, contact us at privacy@nigeriatransfer.com. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Data breach notification</h2>
            <p>In the event of a data breach, we will notify the Nigeria Data Protection Commission (NDPC) within 72 hours and affected users without undue delay, as required by the NDPA.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Cookies and analytics</h2>
            <p>We use Umami, a privacy-friendly analytics tool that does not use cookies and does not track personal data. We use localStorage for theme preference and lightweight mode settings only.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--text-primary)] mb-3">Contact</h2>
            <p>For privacy inquiries: privacy@nigeriatransfer.com</p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
