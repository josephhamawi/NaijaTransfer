import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import UploadWidget from "@/components/upload/UploadWidget";
import ProWaitlistForm from "@/components/marketing/ProWaitlistForm";

// Force dynamic rendering. Without this Next.js generates the page
// at build time and emits Cache-Control: s-maxage=31536000, which
// pins the HTML (and its script-chunk references) in the browser
// cache for a year — so users keep loading stale JS after deploys.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Send big files in Nigeria | NaijaTransfer",
  description:
    "Send up to 4 GB free. Built for Nigerian internet. Pays in Naira, resumes after dropped connections, never compresses your files.",
};

/**
 * Homepage. Server-rendered marketing chrome wrapping a single
 * client island (UploadWidget) so first paint doesn't wait for the
 * upload bundle.
 */
export default function HomePage() {
  return (
    <PageLayout showWallpaper>
      {/* Above-the-fold: upload widget + hero copy on the wallpaper */}
      <div
        className={cn(
          "min-h-screen px-4 pt-24 pb-12",
          "lg:pl-[6%] lg:pr-[6%]"
        )}
      >
        <div className="grid lg:grid-cols-[480px_1fr] lg:gap-12 items-start">
          {/* Upload widget — only client component on this page */}
          <div className="flex justify-center lg:justify-start">
            <UploadWidget />
          </div>

          {/* Hero copy — SSR, communicates value prop in <2s */}
          <div className="hidden lg:block max-w-xl mt-6 text-white">
            <h1 className="text-display font-bold leading-tight drop-shadow">
              Send big files in Nigeria.
              <br />
              <span className="text-nigerian-green">Free up to 4 GB.</span>
            </h1>
            <p className="mt-5 text-body-lg text-white/85 drop-shadow">
              Your upload picks back up when the connection drops. You pay
              in Naira through Paystack, no foreign card required. Files
              arrive uncompressed.
            </p>
            <ul className="mt-6 space-y-2 text-body text-white/90">
              <HeroCheck>No account needed</HeroCheck>
              <HeroCheck>Pay in Naira via Paystack</HeroCheck>
              <HeroCheck>2× WeTransfer&apos;s free limit</HeroCheck>
              <HeroCheck>Password protection on free and paid</HeroCheck>
            </ul>
          </div>

          {/* Mobile hero — compact, sits below the upload card */}
          <div className="lg:hidden mt-6 text-white text-center">
            <h1 className="text-h1 font-bold drop-shadow">
              Send big files in Nigeria.{" "}
              <span className="text-nigerian-green">Free up to 4 GB.</span>
            </h1>
            <p className="mt-3 text-body-sm text-white/80 drop-shadow">
              Your upload survives dropped connections. You pay in Naira.
              Files arrive uncompressed.
            </p>
          </div>
        </div>
      </div>

      {/* Below-fold marketing — fully SSR */}
      <div className="relative z-10 bg-charcoal-800 text-white border-t border-white/10">
        {/* How it works */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-h2 sm:text-h1 text-center mb-10 text-white">How it works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <HowItWorksStep
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nigerian-green" aria-hidden="true">
                  <path d="M16 4v16M8 12l8-8 8 8" />
                  <path d="M4 24h24" />
                </svg>
              }
              title="Add your files"
              description="Drag and drop or tap to select. Up to 4 GB free."
            />
            <HowItWorksStep
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nigerian-green" aria-hidden="true">
                  <path d="M10 16h12" />
                  <circle cx="16" cy="16" r="12" />
                </svg>
              }
              title="Get a link"
              description="Instant shareable link and QR code for your transfer."
            />
            <HowItWorksStep
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nigerian-green" aria-hidden="true">
                  <path d="M22 2L26 6 22 10" />
                  <path d="M4 14V10a4 4 0 014-4h18" />
                  <path d="M10 30L6 26 10 22" />
                  <path d="M28 18v4a4 4 0 01-4 4H6" />
                </svg>
              }
              title="Share anywhere"
              description="WhatsApp, SMS, email, or just copy the link."
            />
          </div>
        </section>

        {/* Why NaijaTransfer */}
        <section className="bg-charcoal-600/50 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-h2 sm:text-h1 text-center mb-10 text-white">
              Why NaijaTransfer?
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <TrustSignal
                title="4 GB free"
                description="Twice WeTransfer's free cap."
              />
              <TrustSignal
                title="No account needed"
                description="Drop a file, get a link, share it. Under 30 seconds."
              />
              <TrustSignal
                title="Resumes when the connection drops"
                description="Your upload picks back up at the chunk that failed, not at zero."
              />
              <TrustSignal
                title="Files arrive uncompressed"
                description="WhatsApp will mangle a video. We send the bytes you uploaded, unchanged."
              />
              <TrustSignal
                title="Nigerian-owned. Naira pricing."
                description="No FX, no foreign card, no $12/month conversion math."
              />
              <TrustSignal
                title="Password protection"
                description="Free on every transfer, including the unpaid ones."
              />
            </div>
          </div>
        </section>

        {/* Pro waitlist — captures intent from visitors not ready to upload */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 backdrop-blur-sm p-6 md:p-10 shadow-lg">
            <div className="text-center mb-6">
              <p className="text-caption-style uppercase tracking-wide text-nigerian-green mb-3">
                Coming soon
              </p>
              <h2 className="text-h2 mb-2 text-white">
                Pro is shipping in Naira.
              </h2>
              <p className="text-body text-white/70">
                Bigger transfers. Longer expiry. Custom branding. Cheaper
                annual plans. Drop your email and we&apos;ll tell you when
                it goes live.
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <ProWaitlistForm />
            </div>
          </div>
        </section>

        {/* For Business CTA */}
        <section className="max-w-4xl mx-auto px-4 pb-16 text-center">
          <div className="max-w-lg mx-auto p-6 md:p-8 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg">
            <h2 className="text-h2 mb-2 text-white">For Businesses</h2>
            <p className="text-body-sm text-white/60 mb-6">
              50 GB per transfer. Custom branding on every download
              page. API access. Priority support. From NGN 10,000 a month.
            </p>
            <a href="/business">
              <Button variant="gold" size="lg">See the Business plan</Button>
            </a>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

function HeroCheck({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-nigerian-green mt-0.5 shrink-0"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.2" />
        <path
          d="M6.5 10.5L8.5 12.5L13.5 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </li>
  );
}

function HowItWorksStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-nigerian-green/15 mb-4">
        {icon}
      </div>
      <h3 className="text-h3 mb-2 text-white">{title}</h3>
      <p className="text-body-sm text-white/60">{description}</p>
    </div>
  );
}

function TrustSignal({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-1">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-nigerian-green"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
          <path
            d="M6.5 10.5L8.5 12.5L13.5 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <h3 className="text-body font-semibold text-white">
          {title}
        </h3>
        <p className="text-body-sm text-white/60">
          {description}
        </p>
      </div>
    </div>
  );
}
