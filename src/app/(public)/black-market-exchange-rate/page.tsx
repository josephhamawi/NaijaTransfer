import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import RateBoard from "@/components/fx/RateBoard";
import Converter from "@/components/fx/Converter";
import Disclaimer from "@/components/fx/Disclaimer";
import AmountTable from "@/components/fx/AmountTable";
import {
  CURRENCY_META,
  formatNgn,
  formatRelative,
  formatWat,
  todayWat,
} from "@/components/fx/format";
import { getLatestRates, type Currency } from "@/services/fx.service";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  const date = todayWat();
  return {
    title: `Black Market Exchange Rate Today, ${date} — Dollar, Euro, Pound to Naira | NaijaTransfer`,
    description: `Today's parallel-market rates for USD, EUR, and GBP to naira (${date}), refreshed hourly from Nigerian BDC quotes. Compare with the official CBN rate and convert any amount.`,
    alternates: { canonical: "https://naijatransfer.com/black-market-exchange-rate" },
    openGraph: {
      title: `Black Market Exchange Rate Today, ${date}`,
      description: "Hourly-updated USD/EUR/GBP→NGN parallel-market rates with CBN comparison.",
      type: "article",
    },
  };
}

const FAQ = [
  {
    q: "What is the black market exchange rate in Nigeria?",
    a: "The black market — more accurately the parallel market — is where Bureau de Change operators and individuals exchange foreign currency at a market-clearing rate that runs alongside the official Nigerian Foreign Exchange Market (NFEM). The parallel rate moves throughout the day based on demand for dollars, euros, and pounds.",
  },
  {
    q: "Why does Nigeria have two exchange rates?",
    a: "Even after the June 2023 naira float, dollar supply has not always met demand at the official rate, so a parallel market continues to clear excess demand from importers, travellers, and individuals. The gap has narrowed substantially since unification but rarely closes completely.",
  },
  {
    q: "How often are these rates updated?",
    a: "Parallel-market quotes on this page refresh roughly every hour from public BDC data sources. The official rate updates daily from international FX feeds. Rates shown are indicative and may not match what a specific dealer offers.",
  },
  {
    q: "Is using the parallel market legal in Nigeria?",
    a: "Buying foreign currency from a licensed Bureau de Change is legal. Trading with unlicensed street dealers is not. This page is informational only and does not facilitate transactions — always confirm rates with a registered BDC or your bank before transacting.",
  },
];

export default async function HubPage() {
  const rates = await getLatestRates();
  const parallelMap: Partial<Record<Currency, { buy: number; sell: number }>> = {};
  for (const r of rates) {
    if (r.parallel) parallelMap[r.currency] = { buy: r.parallel.buy, sell: r.parallel.sell };
  }

  const lastUpdate = rates
    .map((r) => r.parallel?.fetchedAt)
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const schema: Record<string, unknown>[] = [
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
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
  if (lastUpdate) {
    schema.push({
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Nigerian parallel-market exchange rates (USD, EUR, GBP)",
      description:
        "Hourly-updated indicative parallel-market exchange rates from Nigerian Bureau de Change quotes for USD, EUR, and GBP against the naira (NGN).",
      url: "https://naijatransfer.com/black-market-exchange-rate",
      license: "https://creativecommons.org/licenses/by/4.0/",
      creator: { "@type": "Organization", name: "NaijaTransfer" },
      isAccessibleForFree: true,
      keywords: [
        "dollar to naira black market today",
        "euro to naira black market today",
        "pound to naira black market today",
        "Nigerian parallel market exchange rate",
        "Nigerian Bureau de Change rates",
      ],
      datePublished: lastUpdate,
      dateModified: lastUpdate,
      variableMeasured: ["USD/NGN", "EUR/NGN", "GBP/NGN"],
    });
  }

  return (
    <PageLayout>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-h1 sm:text-display font-bold mb-2">
          Black market exchange rate Nigeria today
        </h1>
        {lastUpdate && (
          <p className="text-body-sm text-[var(--text-secondary)] mb-3">
            As of {formatWat(lastUpdate)}.
            {parallelMap.USD && (
              <>
                {" "}
                $1 ={" "}
                <strong className="text-[var(--text-primary)]">
                  {formatNgn(parallelMap.USD.sell)}
                </strong>
                .
              </>
            )}
            {parallelMap.EUR && <> €1 = <strong>{formatNgn(parallelMap.EUR.sell)}</strong>.</>}
            {parallelMap.GBP && <> £1 = <strong>{formatNgn(parallelMap.GBP.sell)}</strong>.</>}
          </p>
        )}
        <p className="text-body text-[var(--text-secondary)] mb-6">
          Today&apos;s parallel-market rates for the dollar, euro, and pound, refreshed hourly from publicly reported Nigerian Bureau de Change quotes. Compare with the official CBN rate and convert any amount.
        </p>

        <div className="space-y-6">
          <RateBoard rates={rates} />
          <Converter rates={parallelMap} defaultCurrency="USD" />
          {parallelMap.USD && (
            <div>
              <h2 className="text-h2 font-bold mb-3">
                Dollar to Naira conversion at today&apos;s parallel rate
              </h2>
              <AmountTable currency="USD" rate={parallelMap.USD.sell} />
            </div>
          )}
          <Disclaimer />
        </div>

        <section className="mt-12">
          <h2 className="text-h2 font-bold mb-4">Drill into a specific currency</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(CURRENCY_META) as Currency[]).map((c) => (
              <Link
                key={c}
                href={`/${CURRENCY_META[c].slug}`}
                className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 hover:border-nigerian-green transition-colors"
              >
                <div className="text-h3 font-bold">{CURRENCY_META[c].name} → Naira</div>
                <div className="text-body-sm text-[var(--text-secondary)] mt-1">
                  Rate, history, FAQ
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-h2 font-bold mb-4">How the Nigerian parallel market works</h2>
          <div className="space-y-4 text-body text-[var(--text-secondary)]">
            <p>
              Nigeria has two exchange-rate markets that operate side by side. The official Nigerian Foreign Exchange Market (NFEM) is where banks and the Central Bank settle large transactions at a published rate. The parallel market — informally called the &ldquo;black market&rdquo; — is where Bureau de Change operators, traders, and individuals transact at a market-clearing rate that responds quickly to supply and demand.
            </p>
            <p>
              Before the June 2023 naira float, the gap between the two markets sometimes exceeded 60 percent. Since President Tinubu&apos;s administration unified the rates under a &ldquo;willing buyer, willing seller&rdquo; framework in October 2023, the spread has narrowed sharply but rarely closes completely. A small parallel premium persists because of cash-handling costs and timing differences in how the two markets clear.
            </p>
            <p>
              Most retail Nigerians transact at the parallel rate when buying foreign currency for travel, school fees, online subscriptions, or remittances. The official rate matters more for corporate trade settlement and government accounting.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-h2 font-bold mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="text-body font-semibold mb-1">{item.q}</h3>
                <p className="text-body text-[var(--text-secondary)]">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
