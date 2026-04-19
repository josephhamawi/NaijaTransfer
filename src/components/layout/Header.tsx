"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

export interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const userName = user?.displayName;

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 p-3", className)}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-nigerian-green focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <div
        className={cn(
          "mx-auto max-w-5xl",
          "flex h-14 items-center justify-between",
          "px-5 rounded-2xl",
          "bg-charcoal-800/70 backdrop-blur-xl",
          "border border-white/10",
          "shadow-lg shadow-black/20"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="NaijaTransfer home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-40.png" alt="NaijaTransfer" width={32} height={32} className="w-8 h-8" />
          <span className="text-white font-bold text-lg hidden sm:inline">
            Naija<span className="text-nigerian-green">Transfer</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/blog">Blog</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/docs/api">API</NavLink>
          {isAuthenticated && <NavLink href="/dashboard">Dashboard</NavLink>}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          {/* Sign In — desktop */}
          <div className="hidden md:block">
            {isAuthenticated ? (
              <div className="flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-nigerian-green text-white flex items-center justify-center text-xs font-bold">
                    {userName?.[0]?.toUpperCase() || "U"}
                  </span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white/80 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={cn(
                  "px-5 py-2 whitespace-nowrap",
                  "inline-flex items-center justify-center",
                  "rounded-xl",
                  "bg-nigerian-green text-white text-sm font-semibold",
                  "hover:bg-nigerian-green/90 active:bg-nigerian-green/80",
                  "transition-colors"
                )}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <nav
          id="mobile-nav"
          className={cn(
            "md:hidden mt-2 mx-auto max-w-5xl",
            "rounded-2xl overflow-hidden",
            "bg-charcoal-800/90 backdrop-blur-xl",
            "border border-white/10",
            "shadow-lg shadow-black/20",
            "p-2"
          )}
          aria-label="Mobile navigation"
        >
          <MobileNavLink href="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</MobileNavLink>
          <MobileNavLink href="/blog" onClick={() => setMobileMenuOpen(false)}>Blog</MobileNavLink>
          <MobileNavLink href="/about" onClick={() => setMobileMenuOpen(false)}>About</MobileNavLink>
          <MobileNavLink href="/docs/api" onClick={() => setMobileMenuOpen(false)}>API Docs</MobileNavLink>
          {isAuthenticated ? (
            <MobileNavLink href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</MobileNavLink>
          ) : (
            <MobileNavLink href="/login" onClick={() => setMobileMenuOpen(false)} highlight>Sign In</MobileNavLink>
          )}
        </nav>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
  highlight,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-4 py-3 min-h-[44px] rounded-xl text-sm transition-colors",
        highlight
          ? "bg-nigerian-green text-white font-semibold"
          : "text-white/80 hover:text-white hover:bg-white/10"
      )}
    >
      {children}
    </Link>
  );
}
