"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { LightweightToggle } from "./LightweightToggle";

export interface HeaderProps {
  /** Whether the user is authenticated */
  isAuthenticated?: boolean;
  /** User display name */
  userName?: string;
  className?: string;
}

/**
 * Header component with logo, navigation, theme/lightweight toggles, and auth state.
 *
 * Persistent across all pages. Frosted glass effect.
 * Mobile: hamburger menu. Desktop: inline nav links.
 * 44px touch targets for all interactive elements.
 */
export default function Header({
  isAuthenticated = false,
  userName,
  className,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "frosted-glass",
        "border-b border-[var(--border-color)]",
        className
      )}
    >
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-nigerian-green"
          aria-label="NigeriaTransfer home"
        >
          {/* Logo mark */}
          <svg
            width="28"
            height="28"
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
          <span className="hidden sm:inline">NigeriaTransfer</span>
          <span className="sm:hidden">NT</span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Main navigation"
        >
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/artists">Artists</NavLink>
          <NavLink href="/docs/api">API</NavLink>
          {isAuthenticated && (
            <NavLink href="/dashboard">Dashboard</NavLink>
          )}
        </nav>

        {/* Right side: toggles + auth */}
        <div className="flex items-center gap-1">
          <LightweightToggle />
          <ThemeToggle />

          {/* Auth button - desktop */}
          <div className="hidden md:flex items-center ml-2">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-2 px-3 py-2",
                  "rounded-[var(--radius-md)]",
                  "text-body-sm font-medium text-[var(--text-primary)]",
                  "hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50",
                  "transition-colors"
                )}
              >
                <span className="w-7 h-7 rounded-full bg-nigerian-green text-white flex items-center justify-center text-caption font-bold">
                  {userName?.[0]?.toUpperCase() || "U"}
                </span>
                <span className="hidden lg:inline">{userName || "Account"}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={cn(
                  "px-4 py-2 min-h-[44px]",
                  "inline-flex items-center justify-center",
                  "rounded-[var(--radius-md)]",
                  "bg-nigerian-green text-white font-semibold text-body-sm",
                  "hover:bg-green-700 active:bg-green-900",
                  "transition-colors"
                )}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={cn(
              "md:hidden flex items-center justify-center",
              "w-11 h-11 min-w-[44px] min-h-[44px]",
              "rounded-[var(--radius-md)]",
              "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              "hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50",
              "transition-colors"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav
          id="mobile-nav"
          className={cn(
            "md:hidden",
            "border-t border-[var(--border-color)]",
            "bg-[var(--bg-elevated)]",
            "px-4 py-4",
            "space-y-1"
          )}
          aria-label="Mobile navigation"
        >
          <MobileNavLink
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pricing
          </MobileNavLink>
          <MobileNavLink
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </MobileNavLink>
          <MobileNavLink
            href="/artists"
            onClick={() => setMobileMenuOpen(false)}
          >
            Artists
          </MobileNavLink>
          <MobileNavLink
            href="/docs/api"
            onClick={() => setMobileMenuOpen(false)}
          >
            API Docs
          </MobileNavLink>
          {isAuthenticated ? (
            <MobileNavLink
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </MobileNavLink>
          ) : (
            <MobileNavLink
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In / Register
            </MobileNavLink>
          )}
        </nav>
      )}
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 min-h-[44px]",
        "inline-flex items-center",
        "rounded-[var(--radius-md)]",
        "text-body-sm text-[var(--text-secondary)]",
        "hover:text-[var(--text-primary)] hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50",
        "transition-colors"
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-3 py-3 min-h-[44px]",
        "rounded-[var(--radius-md)]",
        "text-body text-[var(--text-primary)]",
        "hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50",
        "transition-colors"
      )}
    >
      {children}
    </Link>
  );
}
