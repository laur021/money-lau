import { format } from "date-fns";
import { PERIOD_LABELS, type ReportingPeriod } from "@/lib/calculations/periods";
import type { FinancialInsightSummary, InsightBill, InsightCategoryTotal } from "@/features/insights/types";

export type InsightTransactionRow = {
  amount: number | string;
  category: { name: string } | null;
  currency: string;
  status: string;
  transaction_type: "income" | "expense" | "transfer";
};

export type InsightAccountRow = {
  currency: string;
  id: string;
  include_in_total: boolean;
  is_archived: boolean;
};

export type InsightBalanceRow = {
  current_balance: number | string;
  id: string;
};

export type InsightBillRow = {
  category: { name: string } | null;
  currency: string;
  due_date: string;
  planned_amount: number | string;
};

export type InsightSalaryRow = {
  currency: string;
  net_pay: number | string;
  transaction_id: string | null;
};

export function buildFinancialInsightSummary({
  accounts,
  balances,
  bills,
  comparisonTransactions = [],
  currency,
  now = new Date(),
  period,
  salaries,
  transactions,
}: {
  accounts: InsightAccountRow[];
  balances: InsightBalanceRow[];
  bills: InsightBillRow[];
  comparisonTransactions?: InsightTransactionRow[];
  currency: string;
  now?: Date;
  period: ReportingPeriod;
  salaries: InsightSalaryRow[];
  transactions: InsightTransactionRow[];
}): FinancialInsightSummary {
  const completed = transactions.filter(
    (transaction) => transaction.currency === currency && transaction.status === "completed",
  );
  const totals = completed.reduce(
    (result, transaction) => {
      const amount = Number(transaction.amount);
      if (transaction.transaction_type === "income") result.completedIncome += amount;
      if (transaction.transaction_type === "expense") result.completedExpense += amount;
      return result;
    },
    { completedIncome: 0, completedExpense: 0 },
  );
  const categories = completed
    .filter((transaction) => transaction.transaction_type === "expense")
    .reduce<Record<string, number>>((result, transaction) => {
      const name = transaction.category?.name ?? "Uncategorized";
      result[name] = (result[name] ?? 0) + Number(transaction.amount);
      return result;
    }, {});
  const expenseCategories: InsightCategoryTotal[] = Object.entries(categories)
    .map(([name, amount]) => ({ name, amount }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 8);
  const balanceById = new Map(balances.map((balance) => [balance.id, Number(balance.current_balance)]));
  const includedAccountBalance = accounts
    .filter((account) => account.currency === currency && account.include_in_total && !account.is_archived)
    .reduce((sum, account) => sum + (balanceById.get(account.id) ?? 0), 0);
  const today = format(now, "yyyy-MM-dd");
  const upcomingBills: InsightBill[] = bills
    .filter((bill) => bill.currency === currency)
    .map((bill) => ({
      category: bill.category?.name ?? "Uncategorized",
      dueDate: bill.due_date,
      plannedAmount: Number(bill.planned_amount),
      state: bill.due_date < today ? ("overdue" as const) : ("upcoming" as const),
    }))
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 10);
  const postedSalaryIncome = salaries
    .filter((salary) => salary.currency === currency && salary.transaction_id)
    .reduce((sum, salary) => sum + Number(salary.net_pay), 0);
  const previousMonthExpense = comparisonTransactions
    .filter(
      (transaction) =>
        transaction.currency === currency &&
        transaction.status === "completed" &&
        transaction.transaction_type === "expense",
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  return {
    currency,
    periodLabel: PERIOD_LABELS[period],
    totals: {
      ...totals,
      netCashFlow: totals.completedIncome - totals.completedExpense,
    },
    expenseCategories,
    includedAccountBalance,
    upcomingBills,
    postedSalaryIncome,
    ...(period === "this_month" ? { previousMonthExpense } : {}),
  };
}

export function formatInsightSummary(summary: FinancialInsightSummary) {
  return JSON.stringify(summary);
}
