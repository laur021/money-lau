import type { ReportingPeriod } from "@/lib/calculations/periods";

export type InsightMessage = {
  role: "assistant" | "user";
  content: string;
};

export type InsightRequest = {
  currency: string;
  history: InsightMessage[];
  message: string;
  period: ReportingPeriod;
};

export type InsightCategoryTotal = {
  name: string;
  amount: number;
};

export type InsightBill = {
  category: string;
  dueDate: string;
  plannedAmount: number;
  state: "overdue" | "upcoming";
};

export type FinancialInsightSummary = {
  currency: string;
  periodLabel: string;
  totals: {
    completedIncome: number;
    completedExpense: number;
    netCashFlow: number;
  };
  expenseCategories: InsightCategoryTotal[];
  includedAccountBalance: number;
  upcomingBills: InsightBill[];
  postedSalaryIncome: number;
  previousMonthExpense?: number;
};
