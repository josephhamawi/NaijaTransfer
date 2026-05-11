"use client";

import { useMemo, useState } from "react";
import type { Currency } from "@/services/fx.service";
import { CURRENCY_META, formatNgn } from "./format";

export interface ConverterRate {
  buy: number;
  sell: number;
  /** Which market the rate represents — drives the footnote line. */
  market: "parallel" | "official";
}

interface ConverterProps {
  /** Currency → { buy, sell, market } pair, NGN per 1 unit */
  rates: Partial<Record<Currency, ConverterRate>>;
  /** Default focused currency */
  defaultCurrency?: Currency;
}

type Direction = "to-ngn" | "from-ngn";

export default function Converter({ rates, defaultCurrency = "USD" }: ConverterProps) {
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [direction, setDirection] = useState<Direction>("to-ngn");
  const [amount, setAmount] = useState<string>("100");

  const pair = rates[currency];
  const meta = CURRENCY_META[currency];

  // For "I have X foreign, how much NGN" use the BDC sell rate (rate at which
  // the BDC sells naira to you — that's what you actually receive).
  // For "I need X NGN, how much foreign" use the BDC buy rate.
  const result = useMemo(() => {
    const value = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0 || !pair) return null;
    if (direction === "to-ngn") return value * pair.sell;
    return value / pair.buy;
  }, [amount, direction, pair]);

  const available = (Object.keys(rates) as Currency[]).filter((c) => rates[c]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-body-sm font-semibold">Convert</span>
        <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden text-body-sm">
          <button
            type="button"
            onClick={() => setDirection("to-ngn")}
            className={`px-3 py-1.5 ${
              direction === "to-ngn"
                ? "bg-nigerian-green text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            }`}
          >
            {currency} → NGN
          </button>
          <button
            type="button"
            onClick={() => setDirection("from-ngn")}
            className={`px-3 py-1.5 ${
              direction === "from-ngn"
                ? "bg-nigerian-green text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            }`}
          >
            NGN → {currency}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">
        <label className="block">
          <span className="text-body-sm text-[var(--text-secondary)] block mb-1">
            {direction === "to-ngn" ? `${meta.name} amount` : "Naira amount"}
          </span>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[var(--border-color)] bg-[var(--bg-secondary)] text-body-sm text-[var(--text-secondary)]">
              {direction === "to-ngn" ? meta.symbol : "₦"}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-r-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] text-body focus:outline-none focus:ring-2 focus:ring-nigerian-green"
            />
          </div>
        </label>

        <div className="hidden sm:block text-2xl text-[var(--text-secondary)] pb-2 text-center">→</div>

        <div>
          <span className="text-body-sm text-[var(--text-secondary)] block mb-1">
            You get (approx.)
          </span>
          <div className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-body font-semibold tabular-nums">
            {result === null
              ? "—"
              : direction === "to-ngn"
              ? formatNgn(result)
              : `${meta.symbol}${result.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </div>
        </div>
      </div>

      {available.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-body-sm text-[var(--text-secondary)]">Currency:</span>
          {available.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`px-3 py-1 rounded-full text-body-sm border transition-colors ${
                c === currency
                  ? "bg-nigerian-green text-white border-nigerian-green"
                  : "border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {pair && (
        <p className="mt-3 text-body-sm text-[var(--text-secondary)]">
          {pair.market === "parallel" ? (
            <>
              Using parallel-market rate: buy {formatNgn(pair.buy)} / sell {formatNgn(pair.sell)}{" "}
              per {meta.symbol}1.
            </>
          ) : (
            <>
              Using official rate: {formatNgn(pair.sell)} per {meta.symbol}1. No active Nigerian
              parallel market for {currency}.
            </>
          )}
        </p>
      )}
    </div>
  );
}
