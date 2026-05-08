import type { Metadata } from "next";
import CurrencyPage from "@/components/fx/CurrencyPage";
import type { HistorySearchParams } from "@/components/fx/RateHistory";
import { todayWat } from "@/components/fx/format";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const date = todayWat();
  return {
    title: `Dollar to Naira Black Market Rate Today, ${date}`,
    description: `Live USD to naira parallel-market rate for ${date}, refreshed hourly from Nigerian BDC quotes. Compare with the official CBN rate, see today's buy/sell, and convert any dollar amount.`,
    alternates: { canonical: "https://naijatransfer.com/dollar-to-naira-black-market" },
    openGraph: {
      title: `Dollar to Naira Black Market Rate Today, ${date}`,
      description: "Hourly-updated USD→NGN parallel-market rate with CBN comparison and converter.",
      type: "article",
    },
  };
}

export default function Page({ searchParams }: { searchParams: HistorySearchParams }) {
  return <CurrencyPage currency="USD" searchParams={searchParams} />;
}
