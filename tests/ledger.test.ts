import { describe, expect, it } from "vitest";
import { expenseTotalsByCategory, filterRowsByDate, toCsv, totalsByCurrency } from "../lib/calculations/ledger";

const rows = [
  { transaction_type: "income", amount: 100, currency: "PHP", status: "completed", transaction_date: "2026-07-01T00:00:00.000Z", category_id: "salary" },
  { transaction_type: "expense", amount: 30, currency: "PHP", status: "completed", transaction_date: "2026-07-02T00:00:00.000Z", category_id: "food" },
  { transaction_type: "expense", amount: 12, currency: "USD", status: "completed", transaction_date: "2026-06-30T00:00:00.000Z", category_id: "food" },
  { transaction_type: "transfer", amount: 20, currency: "PHP", status: "completed", transaction_date: "2026-07-03T00:00:00.000Z", category_id: null },
  { transaction_type: "expense", amount: 3, currency: "PHP", status: "pending", transaction_date: "2026-07-04T00:00:00.000Z", category_id: "food" },
  { transaction_type: "expense", amount: 4, currency: "PHP", status: "cancelled", transaction_date: "2026-07-05T00:00:00.000Z", category_id: "food" },
];

describe("ledger summaries", () => {
  it("separates currency totals and excludes transfers, pending, and cancelled rows", () => {
    expect(totalsByCurrency(rows)).toEqual({ PHP: { income: 100, expense: 30 }, USD: { income: 0, expense: 12 } });
  });

  it("filters rows within an inclusive date range", () => {
    expect(filterRowsByDate(rows, new Date("2026-07-01T00:00:00.000Z"), new Date("2026-07-03T23:59:59.999Z"))).toHaveLength(3);
  });

  it("summarizes completed expenses by category", () => {
    expect(expenseTotalsByCategory(rows)).toEqual({ food: 42 });
  });

  it("quotes CSV values", () => {
    expect(toCsv([rows[0]])).toContain('"income"');
  });
});
