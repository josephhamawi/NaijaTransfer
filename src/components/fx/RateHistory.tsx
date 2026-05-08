import Link from "next/link";
import {
  getRateHistory,
  type Currency,
  type Granularity,
  type HistoryRow,
} from "@/services/fx.service";
import { CURRENCY_META, formatNgn, spreadPercent } from "./format";

export type HistorySearchParams = {
  view?: string;
};

interface RateHistoryProps {
  currency: Currency;
  searchParams?: HistorySearchParams;
  basePath: string;
}

function parseView(s: string | undefined): Granularity {
  return s === "month" || s === "year" ? s : "day";
}

const VIEW_LABEL: Record<Granularity, string> = {
  day: "Daily",
  month: "Monthly",
  year: "Yearly",
};

export default async function RateHistory({
  currency,
  searchParams,
  basePath,
}: RateHistoryProps) {
  const meta = CURRENCY_META[currency];
  const view = parseView(searchParams?.view);

  const [parallel, official] = await Promise.all([
    getRateHistory({ currency, market: "parallel", granularity: view, limit: 10 }),
    getRateHistory({ currency, market: "official", granularity: view, limit: 10 }),
  ]);

  const officialMap = new Map(official.map((r) => [+new Date(r.period), r.buy]));

  return (
    <section id="history" className="mt-12">
      <h2 className="text-h2 font-bold mb-2">
        {meta.name} to Naira historical rates
      </h2>
      <p className="text-body text-[var(--text-secondary)] mb-4">
        Latest 10 {VIEW_LABEL[view].toLowerCase()} averages of the parallel-market buy and sell rate, with the official rate alongside for reference.
      </p>

      <ViewToggle view={view} basePath={basePath} />

      <HistoryTable
        rows={parallel}
        view={view}
        currency={currency}
        officialMap={officialMap}
      />
    </section>
  );
}

function ViewToggle({ view, basePath }: { view: Granularity; basePath: string }) {
  const chips: Granularity[] = ["day", "month", "year"];
  return (
    <div className="inline-flex rounded-full border border-[var(--border-color)] p-1 mb-4 bg-[var(--bg-elevated)]">
      {chips.map((v) => {
        const isActive = view === v;
        const href = `${basePath}?view=${v}#history`;
        return (
          <Link
            key={v}
            href={href}
            scroll={false}
            replace
            className={`px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors ${
              isActive
                ? "bg-nigerian-green text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {VIEW_LABEL[v]}
          </Link>
        );
      })}
    </div>
  );
}

function formatPeriod(d: Date | string, granularity: Granularity): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (granularity === "day") {
    return date.toLocaleDateString("en-NG", {
      timeZone: "Africa/Lagos",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (granularity === "month") {
    return date.toLocaleDateString("en-NG", {
      timeZone: "Africa/Lagos",
      month: "long",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", year: "numeric" });
}

function HistoryTable({
  rows,
  view,
  currency,
  officialMap,
}: {
  rows: HistoryRow[];
  view: Granularity;
  currency: Currency;
  officialMap: Map<number, number>;
}) {
  const meta = CURRENCY_META[currency];
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead className="bg-[var(--bg-secondary)]">
            <tr>
              <th className="text-left py-2 px-4 font-semibold">Period</th>
              <th className="text-right py-2 px-4 font-semibold">
                Buy ({meta.symbol}1)
              </th>
              <th className="text-right py-2 px-4 font-semibold">
                Sell ({meta.symbol}1)
              </th>
              <th className="text-right py-2 px-4 font-semibold hidden sm:table-cell">
                Official
              </th>
              <th className="text-right py-2 px-4 font-semibold hidden md:table-cell">
                Spread
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 px-4 text-center text-body-sm text-[var(--text-secondary)]"
                >
                  History is being collected. Come back tomorrow for more entries.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const officialRate = officialMap.get(+new Date(r.period));
                const spread =
                  officialRate !== undefined ? spreadPercent(r.sell, officialRate) : null;
                return (
                  <tr
                    key={String(r.period)}
                    className="border-t border-[var(--border-color)]"
                  >
                    <td className="py-2 px-4 whitespace-nowrap">
                      {formatPeriod(r.period, view)}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums">
                      {formatNgn(r.buy)}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums text-nigerian-green font-medium">
                      {formatNgn(r.sell)}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums hidden sm:table-cell text-[var(--text-secondary)]">
                      {officialRate !== undefined ? formatNgn(officialRate) : "—"}
                    </td>
                    <td className="py-2 px-4 text-right tabular-nums hidden md:table-cell text-[var(--text-secondary)]">
                      {spread !== null
                        ? `${spread > 0 ? "+" : ""}${spread.toFixed(2)}%`
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
