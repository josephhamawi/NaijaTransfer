import {
  getRateHistory,
  type Currency,
  type Granularity,
  type HistoryRow,
} from "@/services/fx.service";
import { CURRENCY_META, formatNgn, spreadPercent } from "./format";

interface RateHistoryProps {
  currency: Currency;
}

export default async function RateHistory({ currency }: RateHistoryProps) {
  const meta = CURRENCY_META[currency];
  const [daily, monthly, yearly, dailyOfficial, monthlyOfficial, yearlyOfficial] =
    await Promise.all([
      getRateHistory(currency, "parallel", "day", 30),
      getRateHistory(currency, "parallel", "month", 12),
      getRateHistory(currency, "parallel", "year", 5),
      getRateHistory(currency, "official", "day", 30),
      getRateHistory(currency, "official", "month", 12),
      getRateHistory(currency, "official", "year", 5),
    ]);

  const officialDailyMap = new Map(dailyOfficial.map((r) => [+new Date(r.period), r.buy]));
  const officialMonthlyMap = new Map(monthlyOfficial.map((r) => [+new Date(r.period), r.buy]));
  const officialYearlyMap = new Map(yearlyOfficial.map((r) => [+new Date(r.period), r.buy]));

  if (!daily.length && !monthly.length && !yearly.length) {
    return (
      <section className="mt-12">
        <h2 className="text-h2 font-bold mb-3">
          {meta.name} to Naira historical rates
        </h2>
        <p className="text-body text-[var(--text-secondary)]">
          History is being collected. Check back tomorrow for daily averages, in a
          month for monthly views, and in a year for the yearly summary.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-h2 font-bold mb-2">
        {meta.name} to Naira historical rates
      </h2>
      <p className="text-body text-[var(--text-secondary)] mb-6">
        Average parallel-market buy and sell rates across all hourly samples in
        each period, with the official rate alongside for reference.
      </p>

      <div className="space-y-8">
        {!!daily.length && (
          <HistoryTable
            title="By day (last 30 days)"
            rows={daily}
            granularity="day"
            currency={currency}
            officialMap={officialDailyMap}
          />
        )}
        {!!monthly.length && (
          <HistoryTable
            title="By month (last 12 months)"
            rows={monthly}
            granularity="month"
            currency={currency}
            officialMap={officialMonthlyMap}
          />
        )}
        {!!yearly.length && (
          <HistoryTable
            title="By year"
            rows={yearly}
            granularity="year"
            currency={currency}
            officialMap={officialYearlyMap}
          />
        )}
      </div>
    </section>
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
  title,
  rows,
  granularity,
  currency,
  officialMap,
}: {
  title: string;
  rows: HistoryRow[];
  granularity: Granularity;
  currency: Currency;
  officialMap: Map<number, number>;
}) {
  const meta = CURRENCY_META[currency];
  return (
    <div>
      <h3 className="text-h3 font-bold mb-3">{title}</h3>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
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
            {rows.map((r) => {
              const officialRate = officialMap.get(+new Date(r.period));
              const spread = officialRate ? spreadPercent(r.sell, officialRate) : null;
              return (
                <tr
                  key={String(r.period)}
                  className="border-t border-[var(--border-color)]"
                >
                  <td className="py-2 px-4">{formatPeriod(r.period, granularity)}</td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {formatNgn(r.buy)}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-nigerian-green font-medium">
                    {formatNgn(r.sell)}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums hidden sm:table-cell text-[var(--text-secondary)]">
                    {officialRate ? formatNgn(officialRate) : "—"}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums hidden md:table-cell text-[var(--text-secondary)]">
                    {spread !== null
                      ? `${spread > 0 ? "+" : ""}${spread.toFixed(2)}%`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
