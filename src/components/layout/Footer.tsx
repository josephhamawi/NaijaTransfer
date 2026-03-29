"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FooterProps {
  /** Current background artist credit (if wallpaper is showing) */
  artistName?: string;
  artistUrl?: string;
  /** Hide "Powered by NigeriaTransfer" for Business tier */
  hideBranding?: boolean;
  className?: string;
}

/**
 * Footer component with navigation links, artist credit, and copyright.
 *
 * Displayed on all pages except when upload widget is in focus state.
 * Responsive: stacked on mobile, grid on tablet/desktop.
 */
export default function Footer({
  artistName,
  artistUrl,
  hideBranding = false,
  className,
}: FooterProps) {
  return (
    <footer
      className={cn(
        "relative z-10",
        "border-t border-[var(--border-color)]",
        "bg-[var(--bg-secondary)]",
        className
      )}
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand column */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-bold text-nigerian-green mb-3"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 28 28"
                fill="none"
                aria-hidden="true"
              >
                <rect width="28" height="28" rx="6" fill="currentColor" />
                <path
                  d="M8 20V8l6 12L20 8v12"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              NigeriaTransfer
            </Link>
            <p className="text-body-sm text-[var(--text-secondary)] max-w-xs">
              Send large files. No account. No wahala. Built in Nigeria, for
              Nigeria.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-label-style text-[var(--text-primary)] mb-3">
              Product
            </h4>
            <ul className="space-y-2" role="list">
              <FooterLink href="/pricing">Pricing</FooterLink>
              <FooterLink href="/docs/api">API Docs</FooterLink>
              <FooterLink href="/artists">Featured Artists</FooterLink>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-label-style text-[var(--text-primary)] mb-3">
              Company
            </h4>
            <ul className="space-y-2" role="list">
              <FooterLink href="/about">About</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-label-style text-[var(--text-primary)] mb-3">
              Legal
            </h4>
            <ul className="space-y-2" role="list">
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms of Service</FooterLink>
            </ul>
          </div>
        </div>

        {/* Artist credit */}
        {artistName && (
          <div className="mt-8 pt-4 border-t border-[var(--border-color)] text-caption-style text-[var(--text-muted)]">
            Background artwork by{" "}
            {artistUrl ? (
              <a
                href={artistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-nigerian-green hover:underline"
              >
                {artistName}
              </a>
            ) : (
              <span className="font-medium">{artistName}</span>
            )}
          </div>
        )}

        {/* Copyright */}
        <div
          className={cn(
            "mt-8 pt-4 border-t border-[var(--border-color)]",
            "flex flex-col sm:flex-row items-center justify-between gap-2",
            "text-caption-style text-[var(--text-muted)]"
          )}
        >
          <span>
            &copy; {new Date().getFullYear()} NigeriaTransfer. All rights
            reserved.
          </span>
          <span>Built with <a href="https://kodefoundry.com" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">KodeFoundry</a></span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "text-body-sm text-[var(--text-secondary)]",
          "hover:text-[var(--text-primary)]",
          "transition-colors"
        )}
      >
        {children}
      </Link>
    </li>
  );
}
