import type { Metadata } from "next";

/**
 * Auth layout for login/register pages.
 * Login page uses PageLayout directly, so this is a passthrough.
 *
 * Auth pages are noindex: they have no SEO value (the content is a form),
 * and indexing them only wastes crawl budget on a site fighting for it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
