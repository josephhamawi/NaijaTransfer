"use client";

/**
 * Dashboard sidebar navigation.
 * Desktop: fixed sidebar. Mobile: bottom tabs.
 * Full implementation in Epic 5.
 */

import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/transfers", label: "Transfers", icon: "upload" },
  { href: "/dashboard/requests", label: "File Requests", icon: "inbox" },
  { href: "/dashboard/subscription", label: "Subscription", icon: "credit-card" },
  { href: "/dashboard/api-keys", label: "API Keys", icon: "key" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "chart" },
];

export default function DashboardSidebar() {
  return (
    <aside className="hidden w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] md:block">
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
