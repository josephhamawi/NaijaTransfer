/**
 * Auth layout for login/register pages.
 * Minimal layout without full navigation.
 */

import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 text-2xl font-bold text-nigerian-green">
        NigeriaTransfer
      </Link>
      <main id="main-content" className="w-full max-w-md">
        {children}
      </main>
    </div>
  );
}
