import Link from "next/link";
import {
  SECONDARY_CURRENCIES,
  type LatestRate,
  type Currency,
} from "@/services/fx.service";
import { CURRENCY_META, formatNgn, formatRelative } from "./format";
import { CURRENCY_TINT } from "./RateBoard";

interface SecondaryRateStripProps {
  rates: LatestRate[];
}

/**
 * Compact strip of small cards for currencies that trade at the official rate
 * only (no Nigerian parallel-market depth). Rendered below the main USD/EUR/GBP
 * board so the hero currencies stay dominant.
 */
export default function SecondaryRateStrip({ rates }: SecondaryRateStripProps) {
  const secondary = SECONDARY_CURRENCIES.map((c) => rates.find((r) => r.currency === c)).filter(
    (r): r is LatestRate => !!r,
  );
  if (secondary.length === 0) return null;

  return (
    <section className="mt-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-h3 font-semibold">Other currencies (official rate)</h2>
        <span className="text-caption text-[var(--text-secondary)]">
          No active Nigerian parallel market
        </span>
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        {secondary.map((r) => (
          <SecondaryCard key={r.currency} rate={r} />
        ))}
      </div>
    </section>
  );
}

function SecondaryCard({ rate }: { rate: LatestRate }) {
  const meta = CURRENCY_META[rate.currency];
  const tint = CURRENCY_TINT[rate.currency];
  const official = rate.official;
  const href = `/${meta.slug}`;

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 transition-colors hover:border-nigerian-green/60"
    >
      <div
        className={`shrink-0 inline-flex items-center justify-center rounded-lg ring-1 font-bold w-9 h-9 text-base ${tint.bg} ${tint.text} ${tint.ring}`}
        aria-hidden="true"
      >
        {meta.symbol}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-body-sm font-semibold leading-none">
            {rate.currency}
            <span className="text-[var(--text-secondary)] font-normal"> / NGN</span>
          </span>
          <span className="text-caption text-[var(--text-secondary)] truncate">
            {official ? formatRelative(official.fetchedAt) : "—"}
          </span>
        </div>
        <div className="text-lg font-bold tabular-nums tracking-tight mt-1 leading-none">
          {official ? formatNgn(official.rate) : "—"}
        </div>
      </div>
    </Link>
  );
}
