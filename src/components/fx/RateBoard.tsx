import Link from "next/link";
import type { LatestRate, Currency } from "@/services/fx.service";
import { CURRENCY_META, formatNgn, formatRelative, spreadPercent } from "./format";

interface RateBoardProps {
  rates: LatestRate[];
  /** When set, that currency's row is rendered as the hero card. */
  focus?: Currency;
}

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

function HeroCard({ rate }: { rate: LatestRate }) {
  const meta = CURRENCY_META[rate.currency];
  const parallel = rate.parallel;
  const official = rate.official;

  if (!parallel) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6">
        <h2 className="text-h2 font-bold mb-2">
          {meta.name} ({rate.currency}) to Naira
        </h2>
        <p className="text-body text-[var(--text-secondary)]">
          Parallel-market rate is currently updating. Check back shortly.
        </p>
      </div>
    );
  }

  const spread = official ? spreadPercent(parallel.sell, official.rate) : null;

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <h2 className="text-h2 font-bold">
          {meta.name} to Naira <span className="text-[var(--text-secondary)]">— parallel market</span>
        </h2>
        <span className="text-body-sm text-[var(--text-secondary)]">
          Updated {formatRelative(parallel.fetchedAt)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <div className="text-body-sm text-[var(--text-secondary)] uppercase tracking-wide">Buy</div>
          <div className="text-display font-bold tabular-nums">{formatNgn(parallel.buy)}</div>
          <div className="text-body-sm text-[var(--text-secondary)]">
            BDC sell — what they charge you for {meta.symbol}1
          </div>
        </div>
        <div>
          <div className="text-body-sm text-[var(--text-secondary)] uppercase tracking-wide">Sell</div>
          <div className="text-display font-bold tabular-nums text-nigerian-green">
            {formatNgn(parallel.sell)}
          </div>
          <div className="text-body-sm text-[var(--text-secondary)]">
            BDC buy — what you get for {meta.symbol}1
          </div>
        </div>
      </div>

      {official && (
        <div className="mt-6 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-body-sm text-[var(--text-secondary)]">
              Official market (NFEM)
            </span>
            <span className="text-body-sm text-[var(--text-secondary)]">
              Updated {formatRelative(official.fetchedAt)}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mt-1">
            <span className="text-h3 font-bold tabular-nums">{formatNgn(official.rate)}</span>
            {spread !== null && (
              <span
                className={`text-body-sm font-semibold ${
                  spread > 0 ? "text-amber-600 dark:text-amber-400" : "text-[var(--text-secondary)]"
                }`}
              >
                Parallel premium: {spread > 0 ? "+" : ""}
                {spread.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RateRow({ rate, compact }: { rate: LatestRate; compact: boolean }) {
  const meta = CURRENCY_META[rate.currency];
  const parallel = rate.parallel;
  const official = rate.official;

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    compact ? (
      <Link
        href={`/${meta.slug}`}
        className="block rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 hover:border-nigerian-green transition-colors"
      >
        {children}
      </Link>
    ) : (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5">
        {children}
      </div>
    );

  return (
    <Wrapper>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-h3 font-bold">
          {rate.currency} → NGN
        </h3>
        {!compact && (
          <Link
            href={`/${meta.slug}`}
            className="text-body-sm text-nigerian-green hover:underline"
          >
            Details →
          </Link>
        )}
      </div>

      {parallel ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-body-sm text-[var(--text-secondary)]">Buy</div>
              <div className="text-h3 font-bold tabular-nums">{formatNgn(parallel.buy)}</div>
            </div>
            <div>
              <div className="text-body-sm text-[var(--text-secondary)]">Sell</div>
              <div className="text-h3 font-bold tabular-nums text-nigerian-green">
                {formatNgn(parallel.sell)}
              </div>
            </div>
          </div>
          <div className="mt-3 text-body-sm text-[var(--text-secondary)]">
            Official: {official ? formatNgn(official.rate) : "—"} · Updated{" "}
            {formatRelative(parallel.fetchedAt)}
          </div>
        </>
      ) : (
        <p className="text-body-sm text-[var(--text-secondary)]">Rate updating…</p>
      )}
    </Wrapper>
  );
}
