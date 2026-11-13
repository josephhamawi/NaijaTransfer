import { getDb } from "@/lib/firebase-admin";

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

/**
 * FX rates in Firestore.
 *
 * One document per (currency, market) holding a bounded array of daily
 * points, instead of one Postgres row per sample.
 *
 * The old schema stored a row per scrape and aggregated with
 * `date_trunc` in raw SQL, which Firestore has no equivalent for. It
 * already deduped to one row per Lagos day, so the array carries the
 * same information: four years of history becomes one document read
 * instead of a thousand-row scan, and the cron's delete-then-insert per
 * day becomes a single upsert.
 */

/** ~4 years of daily points. Keeps the document far below the 1 MiB cap. */
const MAX_POINTS = 1500;

const FX_RATES = "fxRates";

interface RatePoint {
  /** Lagos calendar day, YYYY-MM-DD. The dedupe key. */
  d: string;
  b: number;
  s: number;
}

function pairId(currency: Currency, market: Market): string {
  return `${currency}_${market}`;
}

/**
 * Lagos calendar day for an instant.
 *
 * Africa/Lagos has no DST and is fixed at UTC+1, so shifting by an hour
 * and taking the UTC date is exact — no timezone library needed.
 */
function lagosDayKey(at: Date): string {
  return new Date(at.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Midday UTC on a Lagos day key — a stable instant inside that day. */
function dayKeyToDate(key: string): Date {
  return new Date(`${key}T12:00:00.000Z`);
}

/**
 * Insert or replace one day's point, oldest trimmed.
 *
 * Idempotent per Lagos day: running the cron hourly rewrites today's
 * point rather than accumulating 24 of them.
 */
function mergePoint(points: RatePoint[], point: RatePoint): RatePoint[] {
  const merged = points.filter((p) => p.d !== point.d);
  merged.push(point);
  merged.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return merged.length > MAX_POINTS ? merged.slice(merged.length - MAX_POINTS) : merged;
}

async function writeRatePoint(args: {
  currency: Currency;
  market: Market;
  buy: number;
  sell: number;
  source: string;
  at: Date;
}): Promise<void> {
  const database = getDb();
  const ref = database.collection(FX_RATES).doc(pairId(args.currency, args.market));

  // A transaction because the hourly cron and a manual refresh can
  // overlap, and both read-modify-write the same points array.
  await database.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = (snap.data()?.points as RatePoint[] | undefined) ?? [];
    const points = mergePoint(existing, {
      d: lagosDayKey(args.at),
      b: args.buy,
      s: args.sell,
    });

    tx.set(
      ref,
      {
        currency: args.currency,
        market: args.market,
        source: args.source,
        latest: { buy: args.buy, sell: args.sell, fetchedAt: args.at },
        points,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  });
}

interface RatePairDoc {
  source: string;
  latest: { buy: number; sell: number; fetchedAt: Date } | null;
  points: RatePoint[];
}

async function readRatePair(
  currency: Currency,
  market: Market
): Promise<RatePairDoc | null> {
  const snap = await getDb().collection(FX_RATES).doc(pairId(currency, market)).get();
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  const latest = data.latest as
    | { buy: number; sell: number; fetchedAt: Date | { toDate?: () => Date } }
    | undefined;

  return {
    source: String(data.source ?? ""),
    latest: latest
      ? {
          buy: Number(latest.buy),
          sell: Number(latest.sell),
          fetchedAt:
            latest.fetchedAt instanceof Date
              ? latest.fetchedAt
              : ((latest.fetchedAt as { toDate?: () => Date })?.toDate?.() ?? new Date(0)),
        }
      : null,
    points: ((data.points as RatePoint[] | undefined) ?? []).slice(),
  };
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
        await writeRatePoint({
          currency,
          market: "parallel",
          buy: q.buy,
          sell: q.sell,
          source: PARALLEL_SOURCE_NAME,
          at: q.date,
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
      await writeRatePoint({
        currency,
        market: "official",
        buy: ngn,
        sell: ngn,
        source: OFFICIAL_SOURCE_NAME,
        at: now,
      });
      result.written += 1;
    } catch (e) {
      result.errors.push(`official ${currency}: ${(e as Error).message}`);
    }
  }

  return result;
}

export type Granularity = "day" | "month" | "year";

export interface HistoryRow {
  period: Date;
  buy: number;
  sell: number;
  samples: number;
}

/** Bucket key for a Lagos day string at the requested granularity. */
function periodKey(dayKey: string, granularity: Granularity): string {
  if (granularity === "year") return dayKey.slice(0, 4);
  if (granularity === "month") return dayKey.slice(0, 7);
  return dayKey;
}

function periodKeyToDate(key: string): Date {
  if (key.length === 4) return new Date(`${key}-01-01T12:00:00.000Z`);
  if (key.length === 7) return new Date(`${key}-01T12:00:00.000Z`);
  return dayKeyToDate(key);
}

/**
 * Aggregated history of a (currency, market) pair, bucketed by
 * day/month/year in Africa/Lagos time. Average buy and sell per bucket,
 * most recent first.
 *
 * Replaces a `date_trunc ... GROUP BY` query. Bucketing happens in
 * memory over one document's points array, which is strictly cheaper:
 * one read instead of a scan, and the array already holds one point per
 * Lagos day because the writer dedupes that way.
 *
 * `samples` therefore counts days in the bucket — the same thing the
 * SQL counted, since it also held one row per day.
 */
export async function getRateHistory(args: {
  currency: Currency;
  market: Market;
  granularity: Granularity;
  /** Inclusive lower bound on the rate date. */
  from?: Date;
  /** Exclusive upper bound on the rate date. */
  to?: Date;
  /** Cap result count. Defaults to 1000. */
  limit?: number;
}): Promise<HistoryRow[]> {
  const { currency, market, granularity, from, to, limit = 1000 } = args;

  const pair = await readRatePair(currency, market);
  if (!pair || pair.points.length === 0) return [];

  const fromKey = from ? lagosDayKey(from) : null;
  const toKey = to ? lagosDayKey(to) : null;

  const buckets = new Map<string, { buy: number; sell: number; samples: number }>();

  for (const point of pair.points) {
    // `to` is exclusive, matching the old SQL's `< $n`.
    if (fromKey && point.d < fromKey) continue;
    if (toKey && point.d >= toKey) continue;

    const key = periodKey(point.d, granularity);
    const bucket = buckets.get(key) ?? { buy: 0, sell: 0, samples: 0 };
    bucket.buy += point.b;
    bucket.sell += point.s;
    bucket.samples += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .slice(0, limit)
    .map(([key, bucket]) => ({
      period: periodKeyToDate(key),
      buy: bucket.buy / bucket.samples,
      sell: bucket.sell / bucket.samples,
      samples: bucket.samples,
    }));
}

/**
 * Earliest point held for a currency, across both markets. Constrains
 * the year dropdown so it cannot offer years with no data.
 */
export async function getEarliestRateDate(currency: Currency): Promise<Date | null> {
  const [parallel, official] = await Promise.all([
    readRatePair(currency, "parallel"),
    readRatePair(currency, "official"),
  ]);

  const firsts = [parallel?.points[0]?.d, official?.points[0]?.d].filter(
    (d): d is string => typeof d === "string"
  );
  if (firsts.length === 0) return null;

  return dayKeyToDate(firsts.sort()[0]);
}

export interface LatestRate {
  currency: Currency;
  parallel: { buy: number; sell: number; source: string; fetchedAt: Date } | null;
  official: { rate: number; source: string; fetchedAt: Date } | null;
}

export async function getLatestRates(
  currencies: Currency[] = ALL_CURRENCIES,
): Promise<LatestRate[]> {
  // Two document reads per currency, issued together rather than one
  // table scan ordered by fetchedAt.
  const pairs = await Promise.all(
    currencies.flatMap((currency) => [
      readRatePair(currency, "parallel").then((pair) => ({
        currency,
        market: "parallel" as const,
        pair,
      })),
      readRatePair(currency, "official").then((pair) => ({
        currency,
        market: "official" as const,
        pair,
      })),
    ]),
  );

  return currencies.map((currency) => {
    const parallel = pairs.find((p) => p.currency === currency && p.market === "parallel")?.pair;
    const official = pairs.find((p) => p.currency === currency && p.market === "official")?.pair;

    return {
      currency,
      parallel: parallel?.latest
        ? {
            buy: parallel.latest.buy,
            sell: parallel.latest.sell,
            source: parallel.source,
            fetchedAt: parallel.latest.fetchedAt,
          }
        : null,
      official: official?.latest
        ? {
            rate: official.latest.buy,
            source: official.source,
            fetchedAt: official.latest.fetchedAt,
          }
        : null,
    };
  });
}
