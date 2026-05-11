import type { Currency } from "@/services/fx.service";

export const CURRENCY_META: Record<
  Currency,
  { name: string; symbol: string; slug: string; nameLower: string }
> = {
  USD: { name: "Dollar", symbol: "$", slug: "dollar-to-naira-black-market", nameLower: "dollar" },
  EUR: { name: "Euro", symbol: "€", slug: "euro-to-naira-black-market", nameLower: "euro" },
  GBP: { name: "Pound", symbol: "£", slug: "pound-to-naira-black-market", nameLower: "pound" },
  CNY: { name: "Yuan", symbol: "¥", slug: "yuan-to-naira", nameLower: "yuan" },
  JPY: { name: "Yen", symbol: "¥", slug: "yen-to-naira", nameLower: "yen" },
  AUD: { name: "Australian Dollar", symbol: "A$", slug: "australian-dollar-to-naira", nameLower: "Australian dollar" },
  CAD: { name: "Canadian Dollar", symbol: "C$", slug: "canadian-dollar-to-naira", nameLower: "Canadian dollar" },
  INR: { name: "Indian Rupee", symbol: "₹", slug: "indian-rupee-to-naira", nameLower: "Indian rupee" },
  PKR: { name: "Pakistani Rupee", symbol: "₨", slug: "pakistani-rupee-to-naira", nameLower: "Pakistani rupee" },
};

export function formatNgn(amount: number, opts: { decimals?: number } = {}): string {
  const decimals = opts.decimals ?? (amount < 1 ? 4 : amount < 100 ? 2 : 0);
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function spreadPercent(parallel: number, official: number): number {
  if (!official) return 0;
  return ((parallel - official) / official) * 100;
}

/**
 * Format an absolute date in WAT (Africa/Lagos), e.g. "Friday, 8 May 2026, 14:32 WAT".
 * Used for AI-Overview-friendly "as of" stamps near the rate.
 */
export function formatWat(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dateStr = d.toLocaleDateString("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("en-NG", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateStr}, ${timeStr} WAT`;
}

/**
 * Today's date in WAT formatted for SEO titles, e.g. "Friday, 8 May 2026".
 */
export function todayWat(): string {
  return new Date().toLocaleDateString("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
