/**
 * Public layout - just passes children through.
 * Header and Footer are handled by PageLayout in each page.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
