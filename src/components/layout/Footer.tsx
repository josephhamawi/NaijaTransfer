"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FooterProps {
  hideBranding?: boolean;
  className?: string;
}

export default function Footer({ hideBranding = false, className }: FooterProps) {
  return (
    <footer
      className={cn(
        "relative z-10",
        "bg-charcoal-800 text-white/70",
        className
      )}
      role="contentinfo"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {/* Top: 4-column grid */}
        <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-40.png" alt="" width={24} height={24} className="w-6 h-6" />
              <span className="text-sm font-bold text-white">
                Naija<span className="text-nigerian-green">Transfer</span>
              </span>
            </Link>
            <p className="text-xs text-white/40 max-w-[180px] leading-relaxed">
              Send large files. No account. No wahala.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              <FooterLink href="/pricing">Pricing</FooterLink>
              <FooterLink href="/docs/api">API Docs</FooterLink>
              <li className="list-none">
                <a
                  href="mailto:hello@kodefoundry.com?subject=Artist%20submission%20for%20NaijaTransfer&body=Hi%2C%20I%27d%20like%20to%20submit%20my%20work%20to%20be%20featured%20as%20a%20NaijaTransfer%20wallpaper.%20Here%20are%20my%20samples%2Fportfolio%3A%0A%0A"
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
                  Submit your art
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2">
              <FooterLink href="/about">About</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2">
              <FooterLink href="/privacy">Privacy</FooterLink>
              <FooterLink href="/terms">Terms</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>&copy; {new Date().getFullYear()} NaijaTransfer</span>
          {!hideBranding && (
            <span>
              Built with{" "}
              <a href="https://kodefoundry.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white underline">
                KodeFoundry
              </a>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li className="list-none">
      <Link href={href} className="text-xs text-white/50 hover:text-white transition-colors">
        {children}
      </Link>
    </li>
  );
}
