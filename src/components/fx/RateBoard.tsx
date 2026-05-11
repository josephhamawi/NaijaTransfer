import Link from "next/link";
import {
  PRIMARY_CURRENCIES,
  type LatestRate,
  type Currency,
} from "@/services/fx.service";
import { CURRENCY_META, formatNgn, formatRelative, spreadPercent } from "./format";

interface RateBoardProps {
  rates: LatestRate[];
  /** When set, that currency's row is rendered as the hero card. */
  focus?: Currency;
}

// Solid, saturated backgrounds with white symbols — the previous
// light-tint-on-tint scheme had poor contrast and the symbol blended in.
export const CURRENCY_TINT: Record<Currency, { bg: string; text: string; ring: string }> = {
  USD: {
    bg: "bg-blue-600 dark:bg-blue-500",
    text: "text-white",
    ring: "ring-blue-700/30 dark:ring-blue-400/30",
  },
  EUR: {
    bg: "bg-amber-500 dark:bg-amber-500",
    text: "text-white",
    ring: "ring-amber-600/30 dark:ring-amber-400/30",
  },
  GBP: {
    bg: "bg-violet-600 dark:bg-violet-500",
    text: "text-white",
    ring: "ring-violet-700/30 dark:ring-violet-400/30",
  },
  CNY: {
    bg: "bg-rose-600 dark:bg-rose-500",
    text: "text-white",
    ring: "ring-rose-700/30 dark:ring-rose-400/30",
  },
  JPY: {
    bg: "bg-red-600 dark:bg-red-500",
    text: "text-white",
    ring: "ring-red-700/30 dark:ring-red-400/30",
  },
  AUD: {
    bg: "bg-sky-600 dark:bg-sky-500",
    text: "text-white",
    ring: "ring-sky-700/30 dark:ring-sky-400/30",
  },
  CAD: {
    bg: "bg-orange-600 dark:bg-orange-500",
    text: "text-white",
    ring: "ring-orange-700/30 dark:ring-orange-400/30",
  },
  INR: {
    bg: "bg-emerald-600 dark:bg-emerald-500",
    text: "text-white",
    ring: "ring-emerald-700/30 dark:ring-emerald-400/30",
  },
  PKR: {
    bg: "bg-teal-600 dark:bg-teal-500",
    text: "text-white",
    ring: "ring-teal-700/30 dark:ring-teal-400/30",
  },
};

export default function RateBoard({ rates, focus }: RateBoardProps) {
  const primary = rates.filter((r) => PRIMARY_CURRENCIES.includes(r.currency));
  const focused = focus ? primary.find((r) => r.currency === focus) : null;
  const others = focus ? primary.filter((r) => r.currency !== focus) : primary;

  return (
    <div className="space-y-6">
      {focused && <HeroCard rate={focused} />}

      <div className={`grid gap-4 ${focus ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {others.map((r) => (
          <RateRow key={r.currency} rate={r} compact={!!focus} />
        ))}
      </div>
    </div>
  );
}

function CurrencyMonogram({ currency, size = "md" }: { currency: Currency; size?: "md" | "lg" }) {
  const tint = CURRENCY_TINT[currency];
  const meta = CURRENCY_META[currency];
  const sizing = size === "lg" ? "w-14 h-14 text-3xl" : "w-11 h-11 text-xl";
  return (
    <div
      className={`shrink-0 inline-flex items-center justify-center rounded-2xl ring-1 font-bold ${sizing} ${tint.bg} ${tint.text} ${tint.ring}`}
      aria-hidden="true"
    >
      {meta.symbol}
    </div>
  );
}

function PremiumPill({ percent }: { percent: number }) {
  const positive = percent > 0.05;
  const negative = percent < -0.05;
  const tone = positive
    ? "bg-amber-100 text-amber-800 ring-amber-200/80 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800/60"
    : negative
    ? "bg-emerald-100 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800/60"
    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] ring-[var(--border-color)]";
  const sign = percent > 0 ? "+" : "";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 tabular-nums leading-none whitespace-nowrap ${tone}`}
      title="Parallel-market premium over the official rate"
    >
      {positive && <TriangleArrow direction="up" />}
      {negative && <TriangleArrow direction="down" />}
      <span>
        {sign}
        {percent.toFixed(2)}%
      </span>
    </span>
  );
}

function TriangleArrow({ direction }: { direction: "up" | "down" }) {
  return (
    <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor" aria-hidden="true">
      {direction === "up" ? <path d="M4 0L8 7H0L4 0Z" /> : <path d="M4 9L0 2H8L4 9Z" />}
    </svg>
  );
}

function PulseDot() {
  return (
    <span className="relative inline-flex h-2 w-2" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

function HeroCard({ rate }: { rate: LatestRate }) {
  const meta = CURRENCY_META[rate.currency];
  const parallel = rate.parallel;
  const official = rate.official;

  if (!parallel) {
    return (
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6">
        <div className="flex items-center gap-3 mb-2">
          <CurrencyMonogram currency={rate.currency} size="lg" />
          <h2 className="text-h2 font-bold">
            {meta.name} ({rate.currency}) to Naira
          </h2>
        </div>
        <p className="text-body text-[var(--text-secondary)]">
          Parallel-market rate is currently updating. Check back shortly.
        </p>
      </div>
    );
  }

  const spread = official ? spreadPercent(parallel.sell, official.rate) : null;

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <CurrencyMonogram currency={rate.currency} size="lg" />
            <div className="min-w-0">
              <div className="text-2xl font-bold leading-tight tracking-tight">
                {rate.currency}
                <span className="text-[var(--text-secondary)] font-normal"> / NGN</span>
              </div>
              <div className="text-body-sm text-[var(--text-secondary)] flex items-center gap-2 mt-1">
                <PulseDot />
                <span>Updated {formatRelative(parallel.fetchedAt)}</span>
              </div>
            </div>
          </div>
          {spread !== null && <PremiumPill percent={spread} />}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <RateColumn label="Buy" sublabel={`per ${meta.symbol}1`} value={parallel.buy} />
          <RateColumn
            label="Sell"
            sublabel={`per ${meta.symbol}1`}
            value={parallel.sell}
            accent
          />
        </div>
      </div>

      {official && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/40 px-6 md:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-body-sm">
          <span className="text-[var(--text-secondary)]">Official NFEM rate</span>
          <span className="tabular-nums font-semibold">
            {formatNgn(official.rate)}
            <span className="text-[var(--text-secondary)] font-normal ml-2">
              · updated {formatRelative(official.fetchedAt)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function RateColumn({
  label,
  sublabel,
  value,
  accent,
}: {
  label: string;
  sublabel: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)] font-bold">
        {label}
      </div>
      <div
        className={`mt-1.5 text-4xl md:text-5xl font-extrabold tabular-nums tracking-tight leading-none ${
          accent ? "text-nigerian-green" : ""
        }`}
      >
        {formatNgn(value)}
      </div>
      <div className="mt-2 text-body-sm text-[var(--text-secondary)]">{sublabel}</div>
    </div>
  );
}

function RateRow({ rate, compact }: { rate: LatestRate; compact: boolean }) {
  const meta = CURRENCY_META[rate.currency];
  const parallel = rate.parallel;
  const official = rate.official;
  const spread = parallel && official ? spreadPercent(parallel.sell, official.rate) : null;

  const cardClass = `group flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 transition-all ${
    compact ? "hover:border-nigerian-green/60 hover:shadow-md hover:-translate-y-0.5" : ""
  }`;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <CurrencyMonogram currency={rate.currency} />
          <div className="min-w-0">
            <div className="text-xl font-bold leading-none tracking-tight">
              {rate.currency}
            </div>
            <div className="text-body-sm text-[var(--text-secondary)] mt-1 leading-none">
              to NGN
            </div>
          </div>
        </div>
        {spread !== null && <PremiumPill percent={spread} />}
      </div>

      {parallel ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)] font-bold mb-1">
                Buy
              </div>
              <div className="text-3xl font-extrabold tabular-nums tracking-tight leading-none">
                {formatNgn(parallel.buy)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)] font-bold mb-1">
                Sell
              </div>
              <div className="text-3xl font-extrabold tabular-nums tracking-tight leading-none text-nigerian-green">
                {formatNgn(parallel.sell)}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-body-sm">
            <span className="text-[var(--text-secondary)]">
              Official <span className="text-[var(--text-primary)] tabular-nums font-medium">{official ? formatNgn(official.rate) : "—"}</span>
            </span>
            <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
              <PulseDot />
              <span>{formatRelative(parallel.fetchedAt)}</span>
            </span>
          </div>
        </>
      ) : (
        <p className="text-body-sm text-[var(--text-secondary)]">Rate updating…</p>
      )}

      {compact && (
        <div className="mt-4 text-body-sm font-semibold text-nigerian-green flex items-center gap-1 group-hover:gap-2 transition-all">
          View details
          <ChevronRight />
        </div>
      )}
    </>
  );

  return compact ? (
    <Link href={`/${meta.slug}`} className={cardClass}>
      {inner}
    </Link>
  ) : (
    <div className={cardClass}>{inner}</div>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3l4 4-4 4" />
    </svg>
  );
}
