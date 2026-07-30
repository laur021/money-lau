import { describe, expect, it } from "vitest";
import type { BillItem } from "../features/bills/types";
import {
  addMonths,
  billDueState,
  calculateBillTotals,
  dueDateForMonth,
  isAdvanceBill,
} from "../lib/calculations/bills";

function bill(overrides: Partial<BillItem> = {}): BillItem {
  return {
    accountId: null,
    accountName: null,
    actualPaidAmount: null,
    categoryId: null,
    categoryName: null,
    coverageMonth: "2026-07-01",
    currency: "PHP",
    dueDate: "2026-07-15",
    id: "bill-1",
    name: "Electricity",
    notes: null,
    paymentDate: null,
    plannerMonth: "2026-07-01",
    plannedAmount: 1_000,
    sourceBillItemId: null,
    templateId: null,
    transactionId: null,
    ...overrides,
  };
}

describe("Bills planner calculations", () => {
  it("clamps due days to the last day of each month", () => {
    expect(dueDateForMonth("2026-02", 31)).toBe("2026-02-28");
    expect(dueDateForMonth("2028-02", 31)).toBe("2028-02-29");
    expect(dueDateForMonth("2026-04", 30)).toBe("2026-04-30");
  });

  it("moves calendar months across a year boundary", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("totals planned, paid, and remaining amounts per currency", () => {
    const totals = calculateBillTotals([
      bill(),
      bill({ id: "bill-2", plannedAmount: 2_000, actualPaidAmount: 1_950, transactionId: "transaction-2" }),
      bill({ id: "bill-3", currency: "USD", plannedAmount: 50, actualPaidAmount: 50, transactionId: "transaction-3" }),
    ]);

    expect(totals).toEqual({
      PHP: { count: 2, paid: 1_950, paidCount: 1, planned: 3_000, remaining: 1_000 },
      USD: { count: 1, paid: 50, paidCount: 1, planned: 50, remaining: 0 },
    });
  });

  it("labels overdue, due-soon, paid, and advance-payment bills", () => {
    expect(billDueState(bill({ dueDate: "2026-07-29" }), new Date("2026-07-30T12:00:00"))).toBe("overdue");
    expect(billDueState(bill({ dueDate: "2026-08-02" }), new Date("2026-07-30T12:00:00"))).toBe("due_soon");
    expect(billDueState(bill({ transactionId: "transaction-1" }), new Date("2026-07-30T12:00:00"))).toBe("paid");
    expect(isAdvanceBill(bill({ coverageMonth: "2026-08-01" }))).toBe(true);
    expect(isAdvanceBill(bill())).toBe(false);
  });
});
