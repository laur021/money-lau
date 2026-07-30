import { format } from "date-fns";
import type { LedgerRow } from "@/lib/calculations/ledger";

export type ReportingRow = LedgerRow & {
  id?: string;
  account_id?: string;
  destination_account_id?: string | null;
  description?: string | null;
  merchant?: string | null;
  category?: {
    name: string;
    color: string | null;
  } | null;
  source_account?: {
    name: string;
  } | null;
};

export type CategoryPortion = {
  id: string;
  name: string;
  color: string;
  value: number;
  percentage: number;
};

const FALLBACK_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
  "var(--destructive)",
];

function completedForCurrency(rows: ReportingRow[], currency: string) {
  return rows.filter(
    (row) => row.status === "completed" && row.currency === currency,
  );
}

export function categoryPortions(
  rows: ReportingRow[],
  currency: string,
  transactionType: "income" | "expense" = "expense",
) {
  const totals = completedForCurrency(rows, currency).reduce<
    Record<string, Omit<CategoryPortion, "percentage">>
  >((result, row) => {
    if (row.transaction_type !== transactionType) return result;
    const id = row.category_id ?? "uncategorized";
    const current = result[id] ?? {
      id,
      name: row.category?.name ?? "Uncategorized",
      color: row.category?.color ?? FALLBACK_COLORS[Object.keys(result).length % FALLBACK_COLORS.length],
      value: 0,
    };
    current.value += Number(row.amount);
    result[id] = current;
    return result;
  }, {});

  const total = Object.values(totals).reduce((sum, item) => sum + item.value, 0);

  return Object.values(totals)
    .map((item) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
    }))
    .sort((left, right) => right.value - left.value);
}

export function monthlyCashFlow(rows: ReportingRow[], currency: string) {
  const monthly = completedForCurrency(rows, currency).reduce<
    Record<string, { month: string; label: string; income: number; expense: number }>
  >((result, row) => {
    if (row.transaction_type === "transfer") return result;
    const date = new Date(row.transaction_date);
    if (Number.isNaN(date.getTime())) return result;
    const month = format(date, "yyyy-MM");
    const current = result[month] ?? {
      month,
      label: format(date, "MMM yy"),
      income: 0,
      expense: 0,
    };
    current[row.transaction_type as "income" | "expense"] += Number(row.amount);
    result[month] = current;
    return result;
  }, {});

  return Object.values(monthly).sort((left, right) =>
    left.month.localeCompare(right.month),
  );
}

export function reportingTotals(rows: ReportingRow[], currency: string) {
  return completedForCurrency(rows, currency).reduce(
    (result, row) => {
      if (row.transaction_type === "income") result.income += Number(row.amount);
      if (row.transaction_type === "expense") result.expense += Number(row.amount);
      if (row.transaction_type !== "transfer") result.count += 1;
      return result;
    },
    { income: 0, expense: 0, count: 0 },
  );
}

export function largestActivity(
  rows: ReportingRow[],
  currency: string,
  transactionType: "income" | "expense",
  limit = 5,
) {
  return completedForCurrency(rows, currency)
    .filter((row) => row.transaction_type === transactionType)
    .sort((left, right) => Number(right.amount) - Number(left.amount))
    .slice(0, limit);
}
