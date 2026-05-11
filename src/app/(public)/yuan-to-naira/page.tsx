import type { Metadata } from "next";
import SecondaryCurrencyPage from "@/components/fx/SecondaryCurrencyPage";
import type { HistorySearchParams } from "@/components/fx/RateHistory";
import { todayWat } from "@/components/fx/format";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const date = todayWat();
  return {
    title: `Yuan to Naira Rate Today, ${date}`,
    description: `Live CNY to naira exchange rate for ${date} from international FX feeds. Convert yuan to naira and see today's official rate, history, and conversion table.`,
    alternates: { canonical: "https://naijatransfer.com/yuan-to-naira" },
    openGraph: {
      title: `Yuan to Naira Rate Today, ${date}`,
      description: "Live CNY→NGN exchange rate with converter and history.",
      type: "article",
    },
  };
}

export default function Page({ searchParams }: { searchParams: HistorySearchParams }) {
  return <SecondaryCurrencyPage currency="CNY" searchParams={searchParams} />;
}
