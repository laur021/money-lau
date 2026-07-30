import { describe, expect, it } from "vitest";
import {
  categoryPortions,
  largestActivity,
  monthlyCashFlow,
  reportingTotals,
  type ReportingRow,
} from "../lib/calculations/reporting";
import { reportingDateRange } from "../lib/calculations/periods";

const rows: ReportingRow[] = [
  {
    id: "1",
    transaction_type: "expense",
    amount: 750,
    currency: "PHP",
    status: "completed",
    transaction_date: "2026-07-02T00:00:00.000Z",
    category_id: "food",
    category: { name: "Food", color: "#ef4444" },
  },
  {
    id: "2",
    transaction_type: "expense",
    amount: 250,
    currency: "PHP",
    status: "completed",
    transaction_date: "2026-07-03T00:00:00.000Z",
    category_id: "travel",
    category: { name: "Travel", color: "#06b6d4" },
  },
  {
    id: "3",
    transaction_type: "income",
    amount: 3000,
    currency: "PHP",
    status: "completed",
    transaction_date: "2026-06-30T00:00:00.000Z",
    category_id: "salary",
    category: { name: "Salary", color: null },
  },
];

describe("financial reporting", () => {
  it("calculates category portions and percentages", () => {
    expect(categoryPortions(rows, "PHP")).toEqual([
      { id: "food", name: "Food", color: "#ef4444", value: 750, percentage: 75 },
      { id: "travel", name: "Travel", color: "#06b6d4", value: 250, percentage: 25 },
    ]);
  });

  it("groups completed cash flow by month", () => {
    expect(monthlyCashFlow(rows, "PHP")).toEqual([
      { month: "2026-06", label: "Jun 26", income: 3000, expense: 0 },
      { month: "2026-07", label: "Jul 26", income: 0, expense: 1000 },
    ]);
  });

  it("reports totals and largest activity", () => {
    expect(reportingTotals(rows, "PHP")).toEqual({
      income: 3000,
      expense: 1000,
      count: 3,
    });
    expect(largestActivity(rows, "PHP", "expense", 1)[0]?.id).toBe("1");
  });

  it("resolves calendar reporting periods", () => {
    const range = reportingDateRange("this_month", new Date(2026, 6, 15, 8));
    expect(range.from?.getFullYear()).toBe(2026);
    expect(range.from?.getMonth()).toBe(6);
    expect(range.from?.getDate()).toBe(1);
    expect(range.to?.getMonth()).toBe(6);
    expect(range.to?.getDate()).toBe(31);
  });
});
