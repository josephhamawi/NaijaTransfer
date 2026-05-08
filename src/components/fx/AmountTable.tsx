import type { Currency } from "@/services/fx.service";
import { CURRENCY_META, formatNgn } from "./format";

interface AmountTableProps {
  currency: Currency;
  /** NGN per 1 unit at the parallel sell rate (what you receive). */
  rate: number;
}

const AMOUNTS = [1, 10, 50, 100, 500, 1_000, 5_000, 10_000];

/**
 * Per-amount breakdown ($1 → ₦X, $10 → ₦Y, etc.). Top-ranking parallel-market
 * pages all ship one — it captures long-tail queries like "100 dollar to naira
 * black market" and gets pulled into AI Overviews.
 */
export default function AmountTable({ currency, rate }: AmountTableProps) {
  const meta = CURRENCY_META[currency];
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
      <table className="w-full text-body-sm">
        <thead className="bg-[var(--bg-secondary)]">
          <tr>
            <th className="text-left py-2 px-4 font-semibold">{meta.name} amount</th>
            <th className="text-right py-2 px-4 font-semibold">Naira (parallel rate)</th>
          </tr>
        </thead>
        <tbody>
          {AMOUNTS.map((amount) => (
            <tr key={amount} className="border-t border-[var(--border-color)]">
              <td className="py-2 px-4">
                {meta.symbol}
                {amount.toLocaleString("en-NG")}
              </td>
              <td className="py-2 px-4 text-right tabular-nums font-medium">
                {formatNgn(amount * rate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
