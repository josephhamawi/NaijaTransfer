import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { getLatestRates, type Currency } from "@/services/fx.service";
import RateBoard from "./RateBoard";
import Converter from "./Converter";
import Disclaimer from "./Disclaimer";
import AmountTable from "./AmountTable";
import {
  CURRENCY_META,
  formatNgn,
  formatRelative,
  formatWat,
  spreadPercent,
} from "./format";

interface CurrencyPageProps {
  currency: Currency;
}

const FAQ: Record<Currency, { q: string; a: string }[]> = {
  USD: [
    {
      q: "What is the dollar to naira black market rate today?",
      a: "The parallel-market dollar rate is the price at which Bureau de Change operators and street traders exchange US dollars for naira outside the official Nigerian Foreign Exchange Market (NFEM). The rate updates throughout the day based on supply and demand.",
    },
    {
      q: "Why is the black market rate different from the CBN rate?",
      a: "Even after the June 2023 naira float, the parallel market often trades at a small premium to the official NFEM rate because of dollar scarcity, demand from importers and travellers, and the cost of moving cash. The gap has narrowed since unification but rarely closes completely.",
    },
    {
      q: "Where do BDCs in Nigeria sell dollars?",
      a: "Licensed Bureau de Change operators are concentrated in Lagos (Allen, Wuse, Apongbon), Abuja (Wuse Zone 4), Kano, and Port Harcourt. The Association of Bureaux De Change Operators of Nigeria (ABCON) publishes a list of registered members.",
    },
    {
      q: "Is buying dollars on the black market legal in Nigeria?",
      a: "Buying foreign currency from a CBN-licensed BDC is legal. Trading with unlicensed street operators is not, and the CBN periodically warns against it. This page is informational and does not facilitate any transaction.",
    },
  ],
  EUR: [
    {
      q: "What is the euro to naira black market rate today?",
      a: "The parallel-market euro rate is the rate at which BDC operators in Nigeria exchange euros for naira outside the official market. Euros tend to trade at a slightly higher naira rate than dollars because they are less liquid in Nigeria.",
    },
    {
      q: "Why is the euro rate higher than the dollar rate?",
      a: "EUR/USD trades around 1.05–1.15 globally, so 1 euro is worth more dollars — and therefore more naira — than 1 dollar. The naira rate per euro broadly tracks the global EUR/USD rate multiplied by the USD/NGN parallel rate.",
    },
    {
      q: "Where can I sell euros in Nigeria?",
      a: "Licensed Bureau de Change operators in Lagos, Abuja, Kano, and Port Harcourt buy euros. Banks also accept euro deposits, though usually at the official rate. Always confirm the BDC is registered with ABCON before transacting.",
    },
    {
      q: "Is the euro accepted in Nigeria?",
      a: "Euros are not legal tender in Nigeria — only the naira is. But euros are freely exchanged for naira through banks and licensed BDCs.",
    },
  ],
  GBP: [
    {
      q: "What is the pound to naira black market rate today?",
      a: "The parallel-market pound rate is the rate at which Nigerian BDC operators buy and sell pounds sterling against the naira outside the official market. Pounds typically command the highest naira rate among the major currencies traded in Nigeria.",
    },
    {
      q: "Why is the pound stronger than the dollar?",
      a: "GBP/USD has historically traded around 1.20–1.40, meaning 1 pound is worth more dollars — and therefore more naira — than 1 dollar. The naira rate per pound broadly tracks the global GBP/USD rate multiplied by the USD/NGN parallel rate.",
    },
    {
      q: "Where can I exchange pounds for naira in Nigeria?",
      a: "Licensed BDCs in Lagos, Abuja, and Port Harcourt buy pounds. Many Nigerians receiving remittances from the UK use bank wires or transfer services for amounts above £500, and BDCs for smaller cash exchanges.",
    },
    {
      q: "Is it cheaper to bring cash pounds or wire from the UK?",
      a: "Wire transfers via licensed remittance services usually offer rates close to the parallel market with lower risk than carrying cash. Cash from BDCs is faster but rates can vary by dealer and city.",
    },
  ],
};

export default async function CurrencyPage({ currency }: CurrencyPageProps) {
  const rates = await getLatestRates();
  const meta = CURRENCY_META[currency];
  const own = rates.find((r) => r.currency === currency);
  const parallelMap: Partial<Record<Currency, { buy: number; sell: number }>> = {};
  for (const r of rates) {
    if (r.parallel) parallelMap[r.currency] = { buy: r.parallel.buy, sell: r.parallel.sell };
  }

  const faq = FAQ[currency];
  const parallelPair = own?.parallel;
  const officialRate = own?.official?.rate;

  // Schema.org: ExchangeRateSpecification + FAQPage + BreadcrumbList
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
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
  if (parallelPair && own?.parallel) {
    schemaParts.push({
      "@context": "https://schema.org",
      "@type": "ExchangeRateSpecification",
      currency: "NGN",
      currentExchangeRate: {
        "@type": "UnitPriceSpecification",
        price: parallelPair.sell,
        priceCurrency: "NGN",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: currency },
      },
      validFrom: own.parallel.fetchedAt,
    });
    // Dataset schema is what AI Overviews actually pull on FX queries — Google's
    // FAQPage rich result was retired in mid-2026, but Dataset+dateModified
    // continues to surface in answer boxes.
    schemaParts.push({
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: `${meta.name} to Naira parallel-market exchange rate`,
      description: `Hourly-updated indicative parallel-market exchange rate from Nigerian Bureau de Change quotes for ${currency} to NGN.`,
      url: `https://naijatransfer.com/${meta.slug}`,
      license: "https://creativecommons.org/licenses/by/4.0/",
      creator: { "@type": "Organization", name: "NaijaTransfer" },
      isAccessibleForFree: true,
      keywords: [
        `${meta.nameLower} to naira black market`,
        `${currency} to NGN parallel market`,
        `${meta.nameLower} to naira today`,
        "Nigerian Bureau de Change rates",
      ],
      datePublished: own.parallel.fetchedAt,
      dateModified: own.parallel.fetchedAt,
      variableMeasured: `${currency}/NGN parallel-market rate`,
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
            Black market rates
          </Link>
          {" / "}
          <span>{meta.name} to Naira</span>
        </nav>

        <h1 className="text-h1 sm:text-display font-bold mb-2">
          {meta.name} to Naira black market rate today
        </h1>
        {parallelPair && own?.parallel && (
          <p className="text-body-sm text-[var(--text-secondary)] mb-3">
            As of {formatWat(own.parallel.fetchedAt)} — {meta.symbol}1 ={" "}
            <strong className="text-[var(--text-primary)]">{formatNgn(parallelPair.sell)}</strong>{" "}
            (parallel sell), {formatNgn(parallelPair.buy)} (parallel buy).
            {officialRate && (
              <>
                {" "}
                Official NFEM: <strong>{formatNgn(officialRate)}</strong>.
              </>
            )}
          </p>
        )}
        <p className="text-body text-[var(--text-secondary)] mb-6">
          Indicative parallel-market rate for {currency} → NGN, refreshed hourly from publicly reported Nigerian Bureau de Change quotes. Compare with the official NFEM rate and convert any amount below.
        </p>

        <div className="space-y-6">
          <RateBoard rates={rates} focus={currency} />
          <Converter rates={parallelMap} defaultCurrency={currency} />
          {parallelPair && (
            <div>
              <h2 className="text-h2 font-bold mb-3">
                {meta.name} to Naira conversion at today&apos;s parallel rate
              </h2>
              <AmountTable currency={currency} rate={parallelPair.sell} />
            </div>
          )}
          <Disclaimer />
        </div>

        <section className="mt-12">
          <h2 className="text-h2 font-bold mb-4">
            About the {meta.nameLower}-to-naira parallel rate
          </h2>
          <div className="space-y-4 text-body text-[var(--text-secondary)]">
            <p>
              Nigeria runs two effective markets for foreign currency. The official Nigerian
              Foreign Exchange Market (NFEM) is where banks settle imports, oil receipts, and
              corporate transfers at a Central Bank–reported rate. The parallel market — also
              called the &ldquo;black market&rdquo; — is where licensed Bureau de Change operators,
              traders, and individuals buy and sell {meta.nameLower}s at a market-clearing price
              that reflects real-time demand.
            </p>
            <p>
              Since the naira float in June 2023, the gap between the two markets has narrowed
              from over 60 percent to a much smaller premium. {parallelPair && officialRate ? (
                <>
                  As of the latest update, the parallel-market sell rate is{" "}
                  <strong>{formatNgn(parallelPair.sell)}</strong> per {meta.symbol}1, against an
                  official rate of <strong>{formatNgn(officialRate)}</strong> — a spread of{" "}
                  <strong>{spreadPercent(parallelPair.sell, officialRate).toFixed(2)}%</strong>.
                </>
              ) : (
                "Rates are still loading — refresh the page in a minute."
              )}
            </p>
            <p>
              Most retail Nigerians transact at the parallel rate when buying foreign currency
              for travel, school fees, online subscriptions, and personal remittances. The
              official rate matters more for large corporate transfers and government accounting.
            </p>
            {parallelPair && own?.parallel && (
              <p className="text-body-sm">
                Last refreshed {formatRelative(own.parallel.fetchedAt)}. Source:{" "}
                {own.parallel.source}.
              </p>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-h2 font-bold mb-3">Where Nigerians exchange {meta.nameLower}s</h2>
          <p className="text-body text-[var(--text-secondary)] mb-3">
            Licensed Bureau de Change operators are clustered in a few major cities. We list cities only — never specific dealers — because rates and reliability vary day to day, and naming individual operators creates compliance and AML exposure.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 text-body text-[var(--text-secondary)]">
            <li>
              <strong className="text-[var(--text-primary)]">Lagos:</strong> Allen Avenue (Ikeja), Apongbon (Lagos Island), and Wuse-style clusters around Victoria Island.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Abuja:</strong> Wuse Zone 4 is the main hub; rates are typically a few naira tighter than Lagos.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Kano:</strong> Sabon Gari and the Wapa market — historically the cheapest dollar in the country.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Port Harcourt:</strong> Aba Road BDC corridor, with smaller spreads than Lagos but lower volume.
            </li>
          </ul>
          <p className="text-body-sm text-[var(--text-secondary)] mt-3">
            On 11 February 2026, the CBN re-admitted licensed BDCs to the Nigerian Foreign Exchange Market (NFEM) at a $150,000-per-week purchase cap, narrowing the official-versus-parallel spread further.{" "}
            <a
              href="https://www.cbn.gov.ng"
              rel="noopener noreferrer external"
              target="_blank"
              className="underline"
            >
              See CBN circulars
            </a>{" "}
            for the official guidance.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-h2 font-bold mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}>
                <h3 className="text-body font-semibold mb-1">{item.q}</h3>
                <p className="text-body text-[var(--text-secondary)]">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-h3 font-bold mb-2">Sending money internationally?</h2>
          <p className="text-body text-[var(--text-secondary)] mb-4">
            NaijaTransfer sends files up to 4 GB free, no account needed. If you&apos;re working with overseas clients, send the receipts and contracts faster.
          </p>
          <Link href="/">
            <Button variant="primary">Send a file free</Button>
          </Link>
        </section>
      </div>
    </PageLayout>
  );
}
