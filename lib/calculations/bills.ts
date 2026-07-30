import type { BillDueState, BillItem, BillTotals } from "@/features/bills/types";

const monthExpression = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function monthStart(month: string) {
  if (!monthExpression.test(month)) throw new Error("Month must use YYYY-MM.");
  return `${month}-01`;
}

export function monthFromDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(month: string, amount: number) {
  const [year, monthNumber] = monthStart(month).slice(0, 7).split("-").map(Number);
  const result = new Date(year, monthNumber - 1 + amount, 1);
  return monthFromDate(result);
}

export function monthLabel(month: string) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(`${monthStart(month)}T12:00:00`),
  );
}

export function dueDateForMonth(month: string, dueDay: number) {
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    throw new Error("Due day must be between 1 and 31.");
  }
  const [year, monthNumber] = monthStart(month).slice(0, 7).split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(Math.min(dueDay, lastDay)).padStart(2, "0")}`;
}

export function calculateBillTotals(items: BillItem[]): BillTotals {
  return items.reduce<BillTotals>((totals, item) => {
    const total = totals[item.currency] ?? {
      planned: 0,
      paid: 0,
      remaining: 0,
      count: 0,
      paidCount: 0,
    };
    total.planned += item.plannedAmount;
    total.count += 1;
    if (item.transactionId) {
      total.paid += item.actualPaidAmount ?? 0;
      total.paidCount += 1;
    } else {
      total.remaining += item.plannedAmount;
    }
    totals[item.currency] = total;
    return totals;
  }, {});
}

export function billDueState(item: Pick<BillItem, "dueDate" | "transactionId">, today = new Date()): BillDueState {
  if (item.transactionId) return "paid";
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDate = new Date(`${item.dueDate}T00:00:00`);
  const daysUntilDue = Math.round((dueDate.getTime() - startOfToday.getTime()) / 86_400_000);
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 3) return "due_soon";
  return "upcoming";
}

export function isAdvanceBill(item: Pick<BillItem, "plannerMonth" | "coverageMonth">) {
  return item.plannerMonth !== item.coverageMonth;
}
