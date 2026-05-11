import type { Metadata } from "next";
import SecondaryCurrencyPage from "@/components/fx/SecondaryCurrencyPage";
import type { HistorySearchParams } from "@/components/fx/RateHistory";
import { todayWat } from "@/components/fx/format";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const date = todayWat();
  return {
    title: `Indian Rupee to Naira Rate Today, ${date}`,
    description: `Live INR to naira exchange rate for ${date} from international FX feeds. Convert Indian rupees to naira and see today's official rate, history, and conversion table.`,
    alternates: { canonical: "https://naijatransfer.com/indian-rupee-to-naira" },
    openGraph: {
      title: `Indian Rupee to Naira Rate Today, ${date}`,
      description: "Live INR→NGN exchange rate with converter and history.",
      type: "article",
    },
  };
}

export default function Page({ searchParams }: { searchParams: HistorySearchParams }) {
  return <SecondaryCurrencyPage currency="INR" searchParams={searchParams} />;
}
