import {
  getEarliestRateDate,
  getRateHistory,
  type Currency,
  type Granularity,
  type HistoryRow,
} from "@/services/fx.service";
import { CURRENCY_META, formatNgn, spreadPercent } from "./format";

export type HistorySearchParams = {
  view?: string;
  year?: string;
  month?: string;
};

interface RateHistoryProps {
  currency: Currency;
  /** URL search params from the page route, used to drive the filter UI. */
  searchParams?: HistorySearchParams;
  /** Where this component is rendered (used to scope filter form action). */
  basePath: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseView(s: string | undefined): Granularity {
  return s === "month" || s === "year" ? s : "day";
}

function lagosNowParts(): { year: number; month: number } {
  // Decompose "now" into Africa/Lagos year/month using Intl APIs.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return { year, month };
}

function lagosMonthRange(year: number, month: number): { from: Date; to: Date } {
  // Africa/Lagos has no DST and is fixed at UTC+1, so "month start in Lagos"
  // is the previous day at 23:00 UTC. Build the bounds directly in UTC.
  const from = new Date(Date.UTC(year, month - 1, 1, -1, 0, 0));
  const to = new Date(Date.UTC(year, month, 1, -1, 0, 0));
  return { from, to };
}

function lagosYearRange(year: number): { from: Date; to: Date } {
  const from = new Date(Date.UTC(year - 1, 11, 31, 23, 0, 0));
  const to = new Date(Date.UTC(year, 11, 31, 23, 0, 0));
  return { from, to };
}

export default async function RateHistory({
  currency,
  searchParams,
  basePath,
}: RateHistoryProps) {
  const meta = CURRENCY_META[currency];
  const view = parseView(searchParams?.view);
  const now = lagosNowParts();
  const year = Number(searchParams?.year) || now.year;
  const month = Number(searchParams?.month) || now.month;

  const earliest = await getEarliestRateDate(currency);

  // Compute date range for the query based on the active view.
  let from: Date | undefined;
  let to: Date | undefined;
  if (view === "day") {
    const range = lagosMonthRange(year, month);
    from = range.from;
    to = range.to;
  } else if (view === "month") {
    const range = lagosYearRange(year);
    from = range.from;
    to = range.to;
  }

  const [parallel, official] = await Promise.all([
    getRateHistory({ currency, market: "parallel", granularity: view, from, to, limit: 400 }),
    getRateHistory({ currency, market: "official", granularity: view, from, to, limit: 400 }),
  ]);

  const officialMap = new Map(official.map((r) => [+new Date(r.period), r.buy]));

  // Build year options from earliest data → current year.
  const earliestYear = earliest
    ? Number(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Africa/Lagos",
          year: "numeric",
        }).format(earliest),
      )
    : now.year;
  const yearOptions: number[] = [];
  for (let y = now.year; y >= earliestYear; y--) yearOptions.push(y);

  return (
    <section className="mt-12">
      <h2 className="text-h2 font-bold mb-2">
        {meta.name} to Naira historical rates
      </h2>
      <p className="text-body text-[var(--text-secondary)] mb-4">
        Average parallel-market buy and sell rates across all hourly samples in
        each period, with the official rate alongside. Use the filters to
        explore past dates.
      </p>

      <FilterBar
        view={view}
        year={year}
        month={month}
        yearOptions={yearOptions}
        basePath={basePath}
      />

      <HistoryTable
        rows={parallel}
        view={view}
        currency={currency}
        officialMap={officialMap}
      />

      {!parallel.length && (
        <p className="text-body-sm text-[var(--text-secondary)] mt-3">
          No samples in this period yet. Rates are collected hourly — pick a
          different month or come back tomorrow.
        </p>
      )}
    </section>
  );
}

function FilterBar({
  view,
  year,
  month,
  yearOptions,
  basePath,
}: {
  view: Granularity;
  year: number;
  month: number;
  yearOptions: number[];
  basePath: string;
}) {
  const viewChips: { value: Granularity; label: string }[] = [
    { value: "day", label: "Daily" },
    { value: "month", label: "Monthly" },
    { value: "year", label: "Yearly" },
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-semibold">View:</span>
          <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden text-body-sm">
            {viewChips.map((chip) => {
              const params = new URLSearchParams();
              params.set("view", chip.value);
              if (chip.value !== "year") params.set("year", String(year));
              if (chip.value === "day") params.set("month", String(month));
              return (
                <a
                  key={chip.value}
                  href={`${basePath}?${params.toString()}#history`}
                  className={`px-3 py-1.5 ${
                    view === chip.value
                      ? "bg-nigerian-green text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  {chip.label}
                </a>
              );
            })}
          </div>
        </div>

        {view !== "year" && (
          <form method="get" action={basePath} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="view" value={view} />
            <label className="text-body-sm">
              <span className="block text-[var(--text-secondary)] mb-1">Year</span>
              <select
                name="year"
                defaultValue={year}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)]"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            {view === "day" && (
              <label className="text-body-sm">
                <span className="block text-[var(--text-secondary)] mb-1">Month</span>
                <select
                  name="month"
                  defaultValue={month}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)]"
                >
                  {MONTHS.map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-nigerian-green text-white text-body-sm font-semibold hover:bg-nigerian-green/90"
            >
              Apply
            </button>
          </form>
        )}
      </div>
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
    <div
      id="history"
      className="rounded-[var(--radius-lg)] border border-[var(--border-color)] overflow-hidden"
    >
      {/* Vertical-scroll container — caps at ~16 rows on desktop. */}
      <div className="max-h-[480px] overflow-y-auto">
        <table className="w-full text-body-sm">
          <thead className="bg-[var(--bg-secondary)] sticky top-0 z-10">
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
                  No data for the selected period.
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
