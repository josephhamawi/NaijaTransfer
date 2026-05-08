import Link from "next/link";
import type { LatestRate, Currency } from "@/services/fx.service";
import { CURRENCY_META, formatNgn, formatRelative, spreadPercent } from "./format";

interface RateBoardProps {
  rates: LatestRate[];
  /** When set, that currency's row is rendered as the hero card. */
  focus?: Currency;
}

const CURRENCY_TINT: Record<Currency, { bg: string; text: string; ring: string }> = {
  USD: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-200/60 dark:ring-blue-900/60",
  },
  EUR: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-200/60 dark:ring-amber-900/60",
  },
  GBP: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    ring: "ring-violet-200/60 dark:ring-violet-900/60",
  },
};

export default function RateBoard({ rates, focus }: RateBoardProps) {
  const focused = focus ? rates.find((r) => r.currency === focus) : null;
  const others = focus ? rates.filter((r) => r.currency !== focus) : rates;

  return (
    <div className="space-y-6">
      {focused && <HeroCard rate={focused} />}

      <div className={`grid gap-4 ${focus ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
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
  const sizing =
    size === "lg"
      ? "w-12 h-12 text-h2"
      : "w-10 h-10 text-h3";
  return (
    <div
      className={`shrink-0 inline-flex items-center justify-center rounded-xl ring-1 ${sizing} ${tint.bg} ${tint.text} ${tint.ring} font-semibold`}
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
    ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/60"
    : negative
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/60"
    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] ring-[var(--border-color)]";
  const sign = percent > 0 ? "+" : "";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 tabular-nums ${tone}`}
      title="Parallel-market premium over the official rate"
    >
      {positive && <Arrow direction="up" />}
      {negative && <Arrow direction="down" />}
      {sign}
      {percent.toFixed(2)}%
    </span>
  );
}

function Arrow({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === "up" ? (
        <path d="M5 8.5V1.5M5 1.5l3 3M5 1.5l-3 3" />
      ) : (
        <path d="M5 1.5V8.5M5 8.5l3-3M5 8.5l-3-3" />
      )}
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
          <div className="flex items-center gap-3 min-w-0">
            <CurrencyMonogram currency={rate.currency} size="lg" />
            <div className="min-w-0">
              <div className="text-h3 font-bold leading-tight">
                {meta.name} <span className="text-[var(--text-secondary)] font-normal">to Naira</span>
              </div>
              <div className="text-body-sm text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                <PulseDot />
                <span>Updated {formatRelative(parallel.fetchedAt)} · parallel market</span>
              </div>
            </div>
          </div>
          {spread !== null && <PremiumPill percent={spread} />}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <RateColumn label="Buy" sublabel={`What you pay per ${meta.symbol}1`} value={parallel.buy} />
          <RateColumn
            label="Sell"
            sublabel={`What you receive per ${meta.symbol}1`}
            value={parallel.sell}
            accent
          />
        </div>
      </div>

      {official && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/40 px-6 md:px-8 py-3 flex flex-wrap items-center justify-between gap-2 text-body-sm">
          <span className="text-[var(--text-secondary)]">
            Official NFEM rate
          </span>
          <span className="tabular-nums font-medium">
            {formatNgn(official.rate)}{" "}
            <span className="text-[var(--text-secondary)] font-normal">
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
      <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
        {label}
      </div>
      <div
        className={`mt-1 text-display font-bold tabular-nums tracking-tight leading-none ${
          accent ? "text-nigerian-green" : ""
        }`}
      >
        {formatNgn(value)}
      </div>
      <div className="mt-1.5 text-body-sm text-[var(--text-secondary)]">{sublabel}</div>
    </div>
  );
}

function RateRow({ rate, compact }: { rate: LatestRate; compact: boolean }) {
  const meta = CURRENCY_META[rate.currency];
  const parallel = rate.parallel;
  const official = rate.official;
  const spread = parallel && official ? spreadPercent(parallel.sell, official.rate) : null;

  const cardClass = `group rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 transition-all ${
    compact
      ? "hover:border-nigerian-green/60 hover:shadow-md hover:-translate-y-0.5"
      : ""
  }`;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <CurrencyMonogram currency={rate.currency} />
          <div className="min-w-0">
            <div className="text-body font-semibold leading-tight">
              {rate.currency}{" "}
              <span className="text-[var(--text-secondary)] font-normal">→ NGN</span>
            </div>
            <div className="text-body-sm text-[var(--text-secondary)] truncate">
              {meta.name} parallel rate
            </div>
          </div>
        </div>
        {spread !== null && <PremiumPill percent={spread} />}
      </div>

      {parallel ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-0.5">
                Buy
              </div>
              <div className="text-h2 font-bold tabular-nums tracking-tight">
                {formatNgn(parallel.buy)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-0.5">
                Sell
              </div>
              <div className="text-h2 font-bold tabular-nums tracking-tight text-nigerian-green">
                {formatNgn(parallel.sell)}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-body-sm">
            <span className="text-[var(--text-secondary)]">
              Official {official ? formatNgn(official.rate) : "—"}
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
        <div className="mt-3 text-body-sm font-medium text-nigerian-green flex items-center gap-1 group-hover:gap-1.5 transition-all">
          View details
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5" />
          </svg>
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
