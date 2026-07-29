export type LedgerRow = {
  transaction_type: string;
  amount: number | string;
  currency: string;
  status: string;
  transaction_date: string;
  category_id: string | null;
};

export type CurrencyTotals = Record<string, { income: number; expense: number }>;

export function completedRows(rows: LedgerRow[]) {
  return rows.filter((row) => row.status === "completed");
}

export function filterRowsByDate(rows: LedgerRow[], start?: Date, end?: Date) {
  return rows.filter((row) => {
    const date = new Date(row.transaction_date);
    if (Number.isNaN(date.getTime())) return false;
    return (!start || date >= start) && (!end || date <= end);
  });
}

export function totalsByCurrency(rows: LedgerRow[]): CurrencyTotals {
  return completedRows(rows).reduce<CurrencyTotals>((totals, row) => {
    const total = totals[row.currency] ?? { income: 0, expense: 0 };
    if (row.transaction_type === "income") total.income += Number(row.amount);
    if (row.transaction_type === "expense") total.expense += Number(row.amount);
    totals[row.currency] = total;
    return totals;
  }, {});
}

export function expenseTotalsByCategory(rows: LedgerRow[]) {
  return completedRows(rows).reduce<Record<string, number>>((totals, row) => {
    if (row.transaction_type !== "expense") return totals;
    const categoryId = row.category_id ?? "uncategorized";
    totals[categoryId] = (totals[categoryId] ?? 0) + Number(row.amount);
    return totals;
  }, {});
}

export function toCsv(rows: LedgerRow[]) {
  return [
    "type,amount,currency,status,date",
    ...rows.map((row) => [row.transaction_type, row.amount, row.currency, row.status, row.transaction_date].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")),
  ].join("\n");
}
