import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import {
  getLatestRates,
  PRIMARY_CURRENCIES,
  type Currency,
} from "@/services/fx.service";
import Converter, { type ConverterRate } from "./Converter";
import Disclaimer from "./Disclaimer";
import AmountTable from "./AmountTable";
import RateHistory, { type HistorySearchParams } from "./RateHistory";
import { CURRENCY_TINT } from "./RateBoard";
import { CURRENCY_META, formatNgn, formatRelative, formatWat } from "./format";

interface SecondaryCurrencyPageProps {
  currency: Currency;
  searchParams?: HistorySearchParams;
}

/**
 * Thinner sibling of CurrencyPage for currencies that lack a Nigerian
 * parallel-market quote (CNY/JPY/AUD/CAD/INR/PKR). Shows only the official rate
 * with a converter, amount table, history, and minimal FAQ.
 */
export default async function SecondaryCurrencyPage({
  currency,
  searchParams,
}: SecondaryCurrencyPageProps) {
  const rates = await getLatestRates();
  const meta = CURRENCY_META[currency];
  const tint = CURRENCY_TINT[currency];
  const own = rates.find((r) => r.currency === currency);
  const official = own?.official;

  const convertMap: Partial<Record<Currency, ConverterRate>> = {};
  for (const r of rates) {
    if (r.parallel) {
      convertMap[r.currency] = {
        buy: r.parallel.buy,
        sell: r.parallel.sell,
        market: "parallel",
      };
    } else if (r.official) {
      convertMap[r.currency] = {
        buy: r.official.rate,
        sell: r.official.rate,
        market: "official",
      };
    }
  }

  const schemaParts: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://naijatransfer.com" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Black Market Exchange Rate",
          item: "https://naijatransfer.com/black-market-exchange-rate",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${meta.name} to Naira`,
          item: `https://naijatransfer.com/${meta.slug}`,
        },
      ],
    },
  ];
  if (official) {
    schemaParts.push({
      "@context": "https://schema.org",
      "@type": "ExchangeRateSpecification",
      currency: "NGN",
      currentExchangeRate: {
        "@type": "UnitPriceSpecification",
        price: official.rate,
        priceCurrency: "NGN",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: currency },
      },
      validFrom: official.fetchedAt,
    });
  }

  return (
    <PageLayout>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaParts) }}
      />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <nav className="text-body-sm text-[var(--text-secondary)] mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          {" / "}
          <Link href="/black-market-exchange-rate" className="hover:underline">
            Exchange rates
          </Link>
          {" / "}
          <span>{meta.name} to Naira</span>
        </nav>

        <h1 className="text-h1 sm:text-display font-bold mb-2">
          {meta.name} to Naira exchange rate today
        </h1>
        {official && (
          <p className="text-body-sm text-[var(--text-secondary)] mb-3">
            As of {formatWat(official.fetchedAt)} — {meta.symbol}1 ={" "}
            <strong className="text-[var(--text-primary)]">{formatNgn(official.rate)}</strong>{" "}
            (official rate).
          </p>
        )}
        <p className="text-body text-[var(--text-secondary)] mb-6">
          Live {currency} → NGN rate from international FX feeds. The {meta.nameLower} does not
          have an active Nigerian parallel-market quote — Bureau de Change operators in Nigeria
          almost exclusively trade USD, EUR, and GBP. Bank wires and remittance services use the
          official rate shown below.
        </p>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 md:p-8">
            <div className="flex items-center gap-4 mb-5">
              <div
                className={`shrink-0 inline-flex items-center justify-center rounded-2xl ring-1 font-bold w-14 h-14 text-3xl ${tint.bg} ${tint.text} ${tint.ring}`}
                aria-hidden="true"
              >
                {meta.symbol}
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold leading-tight tracking-tight">
                  {currency}
                  <span className="text-[var(--text-secondary)] font-normal"> / NGN</span>
                </div>
                {official && (
                  <div className="text-body-sm text-[var(--text-secondary)] mt-1">
                    Updated {formatRelative(official.fetchedAt)} · {official.source}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)] font-bold">
                Official rate
              </div>
              <div className="mt-1.5 text-4xl md:text-5xl font-extrabold tabular-nums tracking-tight leading-none">
                {official ? formatNgn(official.rate) : "—"}
              </div>
              <div className="mt-2 text-body-sm text-[var(--text-secondary)]">
                per {meta.symbol}1
              </div>
            </div>
          </div>

          <Converter rates={convertMap} defaultCurrency={currency} />

          {official && (
            <div>
              <h2 className="text-h2 font-bold mb-3">
                {meta.name} to Naira conversion table
              </h2>
              <AmountTable currency={currency} rate={official.rate} />
            </div>
          )}

          <Disclaimer />
        </div>

        <section className="mt-12">
          <h2 className="text-h2 font-bold mb-4">About the {meta.nameLower} in Nigeria</h2>
          <div className="space-y-4 text-body text-[var(--text-secondary)]">
            <p>
              The {meta.nameLower} ({currency}) trades against the naira through bank wires and
              international remittance services at the official rate published by international
              FX feeds. Nigerian Bureau de Change operators do not actively quote a parallel
              rate for {currency} — demand is concentrated in US dollars, with smaller secondary
              markets in euros and pounds sterling. If you need to convert {currency} to naira,
              your options are: a bank wire from your home account, a licensed remittance
              service (Wise, WorldRemit, Sendwave, etc.), or a foreign-currency account with a
              Nigerian bank.
            </p>
            <p>
              For comparison, the active Nigerian parallel-market currencies — dollar, euro,
              and pound — are tracked on the{" "}
              <Link href="/black-market-exchange-rate" className="underline">
                main exchange rate page
              </Link>
              .
            </p>
          </div>
        </section>

        <RateHistory
          currency={currency}
          searchParams={searchParams}
          basePath={`/${meta.slug}`}
        />

        <section className="mt-10">
          <h2 className="text-h2 font-bold mb-4">Other currencies</h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
            {PRIMARY_CURRENCIES.map((c) => (
              <Link
                key={c}
                href={`/${CURRENCY_META[c].slug}`}
                className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 hover:border-nigerian-green transition-colors"
              >
                <div className="text-body font-semibold">{CURRENCY_META[c].name}</div>
                <div className="text-caption text-[var(--text-secondary)] mt-1">
                  Parallel market · {c} → NGN
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-h3 font-bold mb-2">Sending money internationally?</h2>
          <p className="text-body text-[var(--text-secondary)] mb-4">
            NaijaTransfer sends files up to 4 GB free, no account needed. Useful for sending
            invoices, contracts, or receipts overseas alongside a wire transfer.
          </p>
          <Link href="/">
            <Button variant="primary">Send a file free</Button>
          </Link>
        </section>
      </div>
    </PageLayout>
  );
}
