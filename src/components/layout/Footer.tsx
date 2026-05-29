"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FooterProps {
  hideBranding?: boolean;
  className?: string;
}

const FOOTER_LINKS = [
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Support", href: "/contact" },
];

const CONTACT_EMAIL = "hello@kodefoundry.com";

export default function Footer({ hideBranding = false, className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn("relative z-10 bg-charcoal-800 text-white/70 mt-8", className)}
      role="contentinfo"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 pb-8">
        {/* Row 1 — brand + tagline | links */}
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Link href="/" className="inline-flex items-center gap-2" aria-label="NaijaTransfer home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-40.png" alt="" width={24} height={24} className="w-6 h-6 rounded-md" />
              <span className="text-base font-extrabold text-white">
                Naija<span className="text-nigerian-green">Transfer</span>
              </span>
            </Link>
            <p className="mt-1.5 text-[13px] text-white/50">
              Send large files. No account. No wahala.
              {!hideBranding && (
                <>
                  {" "}Made by{" "}
                  <a
                    href="https://kodefoundry.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-nigerian-green hover:underline"
                  >
                    KodeFoundry
                  </a>
                  .
                </>
              )}
            </p>
          </div>

          <nav className="flex flex-wrap gap-[18px] text-sm font-medium" aria-label="Footer">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-white/60 hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Row 2 — copyright | contact */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[13px] text-white/40">
          <p>&copy; {year} NaijaTransfer. All rights reserved.</p>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-white/50 hover:text-white transition-colors">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
