import { describe, expect, it } from "vitest";
import { calculateSalary, getSalaryPeriodDefaults } from "../lib/calculations/salary";
import type { SalaryComponentInput } from "../features/salary/types";

describe("calculateSalary", () => {
  it("calculates fixed earnings and deductions", () => {
    const calculation = calculateSalary(30_000, [
      {
        name: "Allowance",
        kind: "earning",
        calculationType: "fixed",
        fixedAmount: 2_000,
      },
      {
        name: "Tax",
        kind: "deduction",
        calculationType: "fixed",
        fixedAmount: 1_500,
      },
    ]);

    expect(calculation).toMatchObject({
      additionalEarnings: 2_000,
      grossPay: 32_000,
      totalDeductions: 1_500,
      netPay: 30_500,
    });
  });

  it("calculates base and gross percentages after earnings", () => {
    const calculation = calculateSalary(10_000, [
      {
        name: "Commission",
        kind: "earning",
        calculationType: "percentage_base",
        percentage: 10,
      },
      {
        name: "Tax",
        kind: "deduction",
        calculationType: "percentage_gross",
        percentage: 5,
      },
    ]);

    expect(calculation.grossPay).toBe(11_000);
    expect(calculation.totalDeductions).toBe(550);
    expect(calculation.netPay).toBe(10_450);
  });

  it("supports hourly overtime with a multiplier", () => {
    const calculation = calculateSalary(20_000, [
      {
        name: "Overtime",
        kind: "earning",
        calculationType: "hourly",
        hours: 8,
        hourlyRate: 150,
        multiplier: 1.5,
      },
    ]);

    expect(calculation.additionalEarnings).toBe(1_800);
    expect(calculation.netPay).toBe(21_800);
  });

  it("rounds every component before totaling", () => {
    const components: SalaryComponentInput[] = [
      {
        name: "Allowance",
        kind: "earning",
        calculationType: "percentage_base",
        percentage: 1 / 3,
      },
      {
        name: "Tax",
        kind: "deduction",
        calculationType: "percentage_gross",
        percentage: 1 / 3,
      },
    ];
    const calculation = calculateSalary(100, components);

    expect(calculation.components[0].calculatedAmount).toBe(0.33);
    expect(calculation.components[1].calculatedAmount).toBe(0.33);
    expect(calculation.netPay).toBe(100);
  });

  it("allows a zero-net draft but exposes zero for posting validation", () => {
    expect(
      calculateSalary(1_000, [
        {
          name: "Deduction",
          kind: "deduction",
          calculationType: "fixed",
          fixedAmount: 1_000,
        },
      ]).netPay,
    ).toBe(0);
  });

  it("rejects deductions that exceed gross pay", () => {
    expect(() =>
      calculateSalary(1_000, [
        {
          name: "Deduction",
          kind: "deduction",
          calculationType: "fixed",
          fixedAmount: 1_000.01,
        },
      ]),
    ).toThrow("Deductions cannot exceed gross pay.");
  });
});

describe("getSalaryPeriodDefaults", () => {
  it.each([
    ["weekly", "2026-07-30", "2026-07-24", "2026-07-30"],
    ["biweekly", "2026-07-30", "2026-07-17", "2026-07-30"],
    ["semi_monthly", "2026-07-15", "2026-07-01", "2026-07-15"],
    ["semi_monthly", "2026-07-30", "2026-07-16", "2026-07-31"],
    ["monthly", "2026-07-30", "2026-07-01", "2026-07-31"],
  ] as const)(
    "uses the correct %s pay period",
    (frequency, paymentDate, payPeriodStart, payPeriodEnd) => {
      expect(getSalaryPeriodDefaults(frequency, paymentDate)).toEqual({
        paymentDate,
        payPeriodStart,
        payPeriodEnd,
      });
    },
  );
});
