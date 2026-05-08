import type { Metadata } from "next";
import CurrencyPage from "@/components/fx/CurrencyPage";
import type { HistorySearchParams } from "@/components/fx/RateHistory";
import { todayWat } from "@/components/fx/format";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const date = todayWat();
  return {
    title: `Euro to Naira Black Market Rate Today, ${date} | NaijaTransfer`,
    description: `Live EUR to naira parallel-market rate for ${date}, refreshed hourly from Nigerian BDC quotes. Compare with the official CBN rate, see today's buy/sell, and convert any euro amount.`,
    alternates: { canonical: "https://naijatransfer.com/euro-to-naira-black-market" },
    openGraph: {
      title: `Euro to Naira Black Market Rate Today, ${date}`,
      description: "Hourly-updated EUR→NGN parallel-market rate with CBN comparison and converter.",
      type: "article",
    },
  };
}

export default function Page({ searchParams }: { searchParams: HistorySearchParams }) {
  return <CurrencyPage currency="EUR" searchParams={searchParams} />;
}
