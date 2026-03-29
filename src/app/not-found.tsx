import Link from "next/link";

/**
 * 404 Not Found page.
 * Uses design tokens, 44px touch targets, semantic colors.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-[var(--bg-primary)]">
      {/* Search icon */}
      <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-charcoal-50 dark:bg-charcoal-600">
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--text-muted)]"
          aria-hidden="true"
        >
          <circle cx="16" cy="16" r="10" />
          <path d="M23 23l8 8" />
        </svg>
      </div>

      <h1 className="text-display text-[var(--text-muted)] mb-2">404</h1>
      <h2 className="text-h2 text-[var(--text-primary)] mb-2">
        Page not found
      </h2>
      <p className="text-body text-[var(--text-secondary)] mb-8 text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-[var(--radius-md)] bg-nigerian-green text-white font-semibold hover:bg-green-700 active:bg-green-900 transition-colors"
        >
          Go to Homepage
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] rounded-[var(--radius-md)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold hover:bg-charcoal-50 dark:hover:bg-charcoal-600/50 transition-colors"
        >
          Send Files
        </Link>
      </div>
    </main>
  );
}
