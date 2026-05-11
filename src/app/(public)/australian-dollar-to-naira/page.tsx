import type { Metadata } from "next";
import SecondaryCurrencyPage from "@/components/fx/SecondaryCurrencyPage";
import type { HistorySearchParams } from "@/components/fx/RateHistory";
import { todayWat } from "@/components/fx/format";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const date = todayWat();
  return {
    title: `Australian Dollar to Naira Rate Today, ${date}`,
    description: `Live AUD to naira exchange rate for ${date} from international FX feeds. Convert Australian dollars to naira and see today's official rate, history, and conversion table.`,
    alternates: { canonical: "https://naijatransfer.com/australian-dollar-to-naira" },
    openGraph: {
      title: `Australian Dollar to Naira Rate Today, ${date}`,
      description: "Live AUD→NGN exchange rate with converter and history.",
      type: "article",
    },
  };
}

export default function Page({ searchParams }: { searchParams: HistorySearchParams }) {
  return <SecondaryCurrencyPage currency="AUD" searchParams={searchParams} />;
}
