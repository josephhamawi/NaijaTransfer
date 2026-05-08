import { db } from "@/lib/db";

export type Currency = "USD" | "EUR" | "GBP";
export type Market = "parallel" | "official";

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
  parallel: Partial<Record<Currency, { buy: number; sell: number }>>;
  official: Partial<Record<Currency, number>>;
}

const CURRENCIES: Currency[] = ["USD", "EUR", "GBP"];
const PARALLEL_SOURCE_URL = "https://www.ngnrates.com/black-market";
const PARALLEL_SOURCE_NAME = "ngnrates.com";
const OFFICIAL_SOURCE_NAME = "open.er-api.com";

// Sanity bounds — anything outside these means the parser drifted.
const MIN_NGN_PER_UNIT = 200;
const MAX_NGN_PER_UNIT = 10_000;

function isPlausibleRate(n: number): boolean {
  return Number.isFinite(n) && n >= MIN_NGN_PER_UNIT && n <= MAX_NGN_PER_UNIT;
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

/**
 * Parse parallel-market buy/sell pairs out of ngnrates.com/black-market HTML.
 *
 * Page structure (verified May 2026): two stacked HTML tables — one for BDC
 * buy quotes, one for BDC sell quotes. Each row is shaped:
 *
 *   <td>USD</td><td>₦ 1395</td><td>08/05/2026</td>...
 *
 * We pull every (currency, amount) pair in document order and, since the
 * BDC sell rate (what the BDC charges you) is always >= the BDC buy rate
 * (what the BDC pays you), we resolve buy = max, sell = min for the
 * displayed quotes per currency. This is robust to which table appears
 * first on the page.
 */
export function parseParallelRates(
  html: string,
): Partial<Record<Currency, { buy: number; sell: number }>> {
  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/&nbsp;/g, " ");

  const samples: Record<Currency, number[]> = { USD: [], EUR: [], GBP: [] };

  // Match the consecutive-cell pattern: currency cell directly followed by an
  // amount cell. Anchoring on the </td><td> boundary avoids matching the date
  // column (which doesn't have ₦/N prefix).
  const rowRegex =
    /<td[^>]*>\s*(USD|EUR|GBP)\s*<\/td>\s*<td[^>]*>\s*(?:₦|N|NGN)?\s*([0-9]{3,5}(?:[,.][0-9]{1,3})?)/gi;

  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(stripped)) !== null) {
    const currency = match[1].toUpperCase() as Currency;
    const value = Number(match[2].replace(/,/g, ""));
    if (isPlausibleRate(value)) samples[currency].push(value);
  }

  const result: Partial<Record<Currency, { buy: number; sell: number }>> = {};
  for (const currency of CURRENCIES) {
    const list = samples[currency];
    if (list.length === 0) continue;
    // Use median of the high half (buy / BDC sell-to-you) and low half
    // (sell / BDC buy-from-you). Single-quote currencies fall back to that
    // value for both directions.
    const sorted = [...list].sort((a, b) => a - b);
    if (sorted.length === 1) {
      result[currency] = { buy: sorted[0], sell: sorted[0] };
      continue;
    }
    const midHigh = sorted.slice(Math.ceil(sorted.length / 2));
    const midLow = sorted.slice(0, Math.ceil(sorted.length / 2));
    const median = (arr: number[]) => arr[Math.floor(arr.length / 2)];
    result[currency] = { buy: median(midHigh), sell: median(midLow) };
  }
  return result;
}

async function fetchParallelRates(): Promise<
  Partial<Record<Currency, { buy: number; sell: number }>>
> {
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

export async function refreshFxRates(): Promise<RefreshResult> {
  const result: RefreshResult = { written: 0, errors: [], parallel: {}, official: {} };
  const now = new Date();

  // Parallel — one HTTP call, three currencies.
  try {
    const parallel = await fetchParallelRates();
    result.parallel = parallel;
    for (const currency of CURRENCIES) {
      const pair = parallel[currency];
      if (!pair) {
        result.errors.push(`parallel ${currency}: not found in source`);
        continue;
      }
      await db.fxRate.create({
        data: {
          currency,
          market: "parallel",
          buyRate: pair.buy,
          sellRate: pair.sell,
          source: PARALLEL_SOURCE_NAME,
          fetchedAt: now,
        },
      });
      result.written += 1;
    }
  } catch (e) {
    result.errors.push(`parallel fetch: ${(e as Error).message}`);
  }

  // Official — one HTTP call per currency.
  for (const currency of CURRENCIES) {
    try {
      const ngn = await fetchOfficialRate(currency);
      if (!isPlausibleRate(ngn)) {
        result.errors.push(`official ${currency}: implausible rate ${ngn}`);
        continue;
      }
      result.official[currency] = ngn;
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

  // Trim history — keep last 14 days. Rates page only ever shows the latest
  // row per (currency, market), so older rows are just storage.
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  await db.fxRate.deleteMany({ where: { fetchedAt: { lt: fourteenDaysAgo } } });

  return result;
}

export interface LatestRate {
  currency: Currency;
  parallel: { buy: number; sell: number; source: string; fetchedAt: Date } | null;
  official: { rate: number; source: string; fetchedAt: Date } | null;
}

export async function getLatestRates(): Promise<LatestRate[]> {
  const rows = await db.fxRate.findMany({
    where: { currency: { in: CURRENCIES } },
    orderBy: { fetchedAt: "desc" },
  });

  return CURRENCIES.map((currency) => {
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
