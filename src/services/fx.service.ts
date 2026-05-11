import { db } from "@/lib/db";

export type Currency =
  | "USD"
  | "EUR"
  | "GBP"
  | "CNY"
  | "JPY"
  | "AUD"
  | "CAD"
  | "INR"
  | "PKR";
export type Market = "parallel" | "official";

/** Primary currencies have an active Nigerian parallel-market quote (BDC). */
export const PRIMARY_CURRENCIES: Currency[] = ["USD", "EUR", "GBP"];
/** Secondary currencies use the official rate only — no meaningful parallel premium. */
export const SECONDARY_CURRENCIES: Currency[] = ["CNY", "JPY", "AUD", "CAD", "INR", "PKR"];

export function isPrimaryCurrency(c: Currency): boolean {
  return PRIMARY_CURRENCIES.includes(c);
}

export interface RateRow {
  currency: Currency;
  market: Market;
  buyRate: number;
  sellRate: number;
  source: string;
  fetchedAt: Date;
}

export interface RefreshResult {
  written: number;
  errors: string[];
  parallel: Partial<Record<Currency, { dates: number; latest: { buy: number; sell: number } }>>;
  official: Partial<Record<Currency, number>>;
}

const ALL_CURRENCIES: Currency[] = [...PRIMARY_CURRENCIES, ...SECONDARY_CURRENCIES];
const PARALLEL_SOURCE_URL = "https://www.ngnrates.com/black-market";
const PARALLEL_SOURCE_NAME = "ngnrates.com";
const OFFICIAL_SOURCE_NAME = "open.er-api.com";

// Sanity bounds for the parallel scrape (USD/EUR/GBP only). Anything outside
// means the parser drifted.
const MIN_NGN_PER_UNIT = 200;
const MAX_NGN_PER_UNIT = 10_000;

function isPlausibleParallelRate(n: number): boolean {
  return Number.isFinite(n) && n >= MIN_NGN_PER_UNIT && n <= MAX_NGN_PER_UNIT;
}

// Official rates span a much wider range — JPY/INR/PKR can be a few naira per
// unit, GBP can be over a thousand. Just guard against zero/NaN/extreme drift.
function isPlausibleOfficialRate(n: number): boolean {
  return Number.isFinite(n) && n > 0.1 && n < 100_000;
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; NaijaTransferBot/1.0; +https://naijatransfer.com)",
      Accept: "text/html,application/xhtml+xml",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.text();
}

interface DatedQuote {
  /** Quote date at noon UTC (12:00). Stamped this way so it lands on the
   *  correct calendar day in Africa/Lagos regardless of clock skew. */
  date: Date;
  buy: number;
  sell: number;
}

/**
 * Parse parallel-market buy/sell pairs out of ngnrates.com/black-market HTML.
 *
 * Page structure (verified May 2026): two stacked HTML tables — one for BDC
 * buy quotes, one for BDC sell quotes. Each row is shaped:
 *
 *   <td>USD</td><td>₦ 1395</td><td>08/05/2026</td>...
 *
 * Returns a per-currency list of one consensus quote per visible date
 * (typically the last 5–10 days). For each (currency, date) we take the
 * max value as the buy rate (BDC sell-to-you) and the min as the sell
 * rate (BDC buy-from-you). When only one value exists for a date, both
 * sides use it.
 */
export function parseParallelRates(html: string): Partial<Record<Currency, DatedQuote[]>> {
  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/&nbsp;/g, " ");

  const samples: Record<string, { dateStr: string; value: number }[]> = {
    USD: [],
    EUR: [],
    GBP: [],
  };

  // Match: <td>CURRENCY</td><td>₦ AMOUNT</td><td>DD/MM/YYYY</td>
  const rowRegex =
    /<td[^>]*>\s*(USD|EUR|GBP)\s*<\/td>\s*<td[^>]*>\s*(?:₦|N|NGN)?\s*([0-9]{3,5}(?:[,.][0-9]{1,3})?)\s*<\/td>\s*<td[^>]*>\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/gi;

  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(stripped)) !== null) {
    const currency = match[1].toUpperCase();
    const value = Number(match[2].replace(/,/g, ""));
    const dateStr = match[3];
    if (isPlausibleParallelRate(value)) samples[currency].push({ dateStr, value });
  }

  const result: Partial<Record<Currency, DatedQuote[]>> = {};
  for (const currency of PRIMARY_CURRENCIES) {
    const byDate = new Map<string, number[]>();
    for (const s of samples[currency] ?? []) {
      const arr = byDate.get(s.dateStr) ?? [];
      arr.push(s.value);
      byDate.set(s.dateStr, arr);
    }
    const quotes: DatedQuote[] = [];
    for (const [dateStr, values] of byDate) {
      const [d, m, y] = dateStr.split("/").map(Number);
      if (!d || !m || !y) continue;
      const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const sorted = [...values].sort((a, b) => a - b);
      const buy = sorted[sorted.length - 1];
      const sell = sorted[0];
      quotes.push({ date, buy, sell });
    }
    if (quotes.length) {
      quotes.sort((a, b) => b.date.getTime() - a.date.getTime());
      result[currency] = quotes;
    }
  }
  return result;
}

async function fetchParallelRates(): Promise<Partial<Record<Currency, DatedQuote[]>>> {
  const html = await fetchText(PARALLEL_SOURCE_URL);
  return parseParallelRates(html);
}

/** Africa/Lagos has no DST and is fixed at UTC+1 — day boundaries are
 *  reliably YYYY-MM-DD 23:00 UTC of the previous day. */
function lagosDayBounds(quoteDate: Date): { from: Date; to: Date } {
  const y = quoteDate.getUTCFullYear();
  const m = quoteDate.getUTCMonth();
  const d = quoteDate.getUTCDate();
  // The quote was stamped at 12:00 UTC on day `d`, which is 13:00 WAT — same
  // calendar day. Lagos midnight on `d` is 23:00 UTC on `d-1`.
  const from = new Date(Date.UTC(y, m, d - 1, 23, 0, 0));
  const to = new Date(Date.UTC(y, m, d, 23, 0, 0));
  return { from, to };
}

async function fetchOfficialRate(currency: Currency): Promise<number> {
  // open.er-api.com is free, no key. `/v6/latest/{base}` returns rates with
  // NGN as one of the keys — i.e. NGN per 1 unit of the base currency.
  const data = await fetch(`https://open.er-api.com/v6/latest/${currency}`, {
    cache: "no-store",
  }).then((r) => r.json());
  if (data?.result !== "success" || typeof data?.rates?.NGN !== "number") {
    throw new Error(`Bad official-rate response for ${currency}`);
  }
  return data.rates.NGN;
}

export async function refreshFxRates(): Promise<RefreshResult> {
  const result: RefreshResult = { written: 0, errors: [], parallel: {}, official: {} };
  const now = new Date();

  // Parallel — one HTTP call, three currencies, multiple visible dates.
  // We get ~5–10 days of historical quotes per scrape (ngnrates shows recent
  // submissions), so each cron run backfills any new days that appeared
  // and refreshes the latest entry for today.
  try {
    const parallel = await fetchParallelRates();
    for (const currency of PRIMARY_CURRENCIES) {
      const quotes = parallel[currency];
      if (!quotes || quotes.length === 0) {
        result.errors.push(`parallel ${currency}: not found in source`);
        continue;
      }
      for (const q of quotes) {
        const { from, to } = lagosDayBounds(q.date);
        // Idempotent per-day write: drop any existing row for this Lagos
        // calendar day, then insert the fresh consensus quote. Keeps the
        // table to one row per (currency, market, source, day).
        await db.fxRate.deleteMany({
          where: {
            currency,
            market: "parallel",
            source: PARALLEL_SOURCE_NAME,
            fetchedAt: { gte: from, lt: to },
          },
        });
        await db.fxRate.create({
          data: {
            currency,
            market: "parallel",
            buyRate: q.buy,
            sellRate: q.sell,
            source: PARALLEL_SOURCE_NAME,
            fetchedAt: q.date,
          },
        });
        result.written += 1;
      }
      result.parallel[currency] = {
        dates: quotes.length,
        latest: { buy: quotes[0].buy, sell: quotes[0].sell },
      };
    }
  } catch (e) {
    result.errors.push(`parallel fetch: ${(e as Error).message}`);
  }

  // Official — one HTTP call per currency. Dedupe per Lagos day so we don't
  // accumulate 24 rows per (currency, day) at hourly cron cadence.
  for (const currency of ALL_CURRENCIES) {
    try {
      const ngn = await fetchOfficialRate(currency);
      if (!isPlausibleOfficialRate(ngn)) {
        result.errors.push(`official ${currency}: implausible rate ${ngn}`);
        continue;
      }
      result.official[currency] = ngn;
      const { from, to } = lagosDayBounds(now);
      await db.fxRate.deleteMany({
        where: {
          currency,
          market: "official",
          source: OFFICIAL_SOURCE_NAME,
          fetchedAt: { gte: from, lt: to },
        },
      });
      await db.fxRate.create({
        data: {
          currency,
          market: "official",
          buyRate: ngn,
          sellRate: ngn,
          source: OFFICIAL_SOURCE_NAME,
          fetchedAt: now,
        },
      });
      result.written += 1;
    } catch (e) {
      result.errors.push(`official ${currency}: ${(e as Error).message}`);
    }
  }

  return result;
}

export type Granularity = "day" | "month" | "year";

interface RawHistoryRow {
  period: Date;
  buy_avg: number | null;
  sell_avg: number | null;
  samples: bigint;
}

export interface HistoryRow {
  period: Date;
  buy: number;
  sell: number;
  samples: number;
}

/**
 * Aggregated history of a (currency, market) pair, bucketed by day/month/year
 * in Africa/Lagos time. Returns the average buy and sell rate across all
 * samples in each bucket. Most recent bucket first.
 */
export async function getRateHistory(args: {
  currency: Currency;
  market: Market;
  granularity: Granularity;
  /** Inclusive lower bound on fetchedAt. */
  from?: Date;
  /** Exclusive upper bound on fetchedAt. */
  to?: Date;
  /** Cap result count. Defaults to 1000. */
  limit?: number;
}): Promise<HistoryRow[]> {
  const { currency, market, granularity, from, to, limit = 1000 } = args;
  const trunc =
    granularity === "day" ? "day" : granularity === "month" ? "month" : "year";

  // Build WHERE clause dynamically. Granularity is whitelisted above so safe
  // to inline; everything else goes through parameterised placeholders.
  const params: unknown[] = [currency, market];
  let where = `currency = $1 AND market = $2`;
  if (from) {
    params.push(from);
    where += ` AND "fetchedAt" >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND "fetchedAt" < $${params.length}`;
  }
  params.push(limit);
  const limitIdx = params.length;

  const rows = await db.$queryRawUnsafe<RawHistoryRow[]>(
    `SELECT date_trunc('${trunc}', "fetchedAt" AT TIME ZONE 'Africa/Lagos') AS period,
            AVG("buyRate")::float AS buy_avg,
            AVG("sellRate")::float AS sell_avg,
            COUNT(*) AS samples
     FROM fx_rates
     WHERE ${where}
     GROUP BY period
     ORDER BY period DESC
     LIMIT $${limitIdx}`,
    ...params,
  );

  return rows
    .filter((r) => r.buy_avg !== null && r.sell_avg !== null)
    .map((r) => ({
      period: r.period,
      buy: r.buy_avg as number,
      sell: r.sell_avg as number,
      samples: Number(r.samples),
    }));
}

/**
 * Earliest fetchedAt timestamp for a currency. Used to constrain the year
 * dropdown in the history filter — we can't show rates for years we don't
 * have data for.
 */
export async function getEarliestRateDate(currency: Currency): Promise<Date | null> {
  const row = await db.fxRate.findFirst({
    where: { currency },
    orderBy: { fetchedAt: "asc" },
    select: { fetchedAt: true },
  });
  return row?.fetchedAt ?? null;
}

export interface LatestRate {
  currency: Currency;
  parallel: { buy: number; sell: number; source: string; fetchedAt: Date } | null;
  official: { rate: number; source: string; fetchedAt: Date } | null;
}

export async function getLatestRates(
  currencies: Currency[] = ALL_CURRENCIES,
): Promise<LatestRate[]> {
  const rows = await db.fxRate.findMany({
    where: { currency: { in: currencies } },
    orderBy: { fetchedAt: "desc" },
  });

  return currencies.map((currency) => {
    const parallel = rows.find((r) => r.currency === currency && r.market === "parallel");
    const official = rows.find((r) => r.currency === currency && r.market === "official");
    return {
      currency,
      parallel: parallel
        ? {
            buy: parallel.buyRate,
            sell: parallel.sellRate,
            source: parallel.source,
            fetchedAt: parallel.fetchedAt,
          }
        : null,
      official: official
        ? { rate: official.buyRate, source: official.source, fetchedAt: official.fetchedAt }
        : null,
    };
  });
}
