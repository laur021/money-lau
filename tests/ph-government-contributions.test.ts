import { describe, expect, it } from "vitest";
import {
  allocatePhilippineContribution,
  calculatePhilippineContribution,
  getDefaultGovernmentAllocation,
  getMonthlySalaryBasis,
  UnsupportedContributionDateError,
} from "../lib/calculations/ph-government-contributions";
import { calculateSalary } from "../lib/calculations/salary";
import type { SalaryGovernmentContext } from "../features/salary/types";

const currentContext: SalaryGovernmentContext = {
  currency: "PHP",
  paymentDate: "2026-07-30",
  monthlyBasicSalary: 30_000,
  monthlyCompensation: 30_000,
  allocation: "half",
};

describe("calculatePhilippineContribution", () => {
  it.each([
    [0, 250],
    [5_249.99, 250],
    [5_250, 275],
    [5_749.99, 275],
    [5_750, 300],
    [34_749.99, 1_725],
    [34_750, 1_750],
    [100_000, 1_750],
  ])("calculates the SSS employee share at a compensation of %s", (salary, expected) => {
    const result = calculatePhilippineContribution("ph_sss_employee", {
      ...currentContext,
      monthlyCompensation: salary,
    });

    expect(result.monthlyAmount).toBe(expected);
    expect(result.ruleVersion).toBe("ph_sss_employee_2025_01");
  });

  it.each([
    [0, 250],
    [10_000, 250],
    [30_000, 750],
    [100_000, 2_500],
    [150_000, 2_500],
  ])("calculates the PhilHealth employee half-share at a salary of %s", (salary, expected) => {
    expect(
      calculatePhilippineContribution("ph_philhealth_employee", {
        ...currentContext,
        monthlyBasicSalary: salary,
      }).monthlyAmount,
    ).toBe(expected);
  });

  it.each([
    [0, 0],
    [1_500, 15],
    [1_500.01, 30],
    [5_000, 100],
    [10_000, 200],
    [50_000, 200],
  ])("calculates the Pag-IBIG employee share at a compensation of %s", (salary, expected) => {
    expect(
      calculatePhilippineContribution("ph_pagibig_employee", {
        ...currentContext,
        monthlyCompensation: salary,
      }).monthlyAmount,
    ).toBe(expected);
  });

  it("selects rules by payment date and rejects unsupported history", () => {
    expect(() =>
      calculatePhilippineContribution("ph_sss_employee", {
        ...currentContext,
        paymentDate: "2024-12-31",
      }),
    ).toThrow(UnsupportedContributionDateError);

    expect(
      calculatePhilippineContribution("ph_pagibig_employee", {
        ...currentContext,
        paymentDate: "2024-02-01",
      }).ruleVersion,
    ).toBe("ph_pagibig_employee_2024_02");
  });
});

describe("Philippine contribution allocation", () => {
  it.each([
    ["full", 333.34],
    ["half", 166.67],
    ["quarter", 83.34],
  ] as const)("allocates a monthly amount using %s", (allocation, expected) => {
    expect(allocatePhilippineContribution(333.34, allocation)).toBe(expected);
  });

  it.each([
    ["monthly", 12_000, 12_000, "full"],
    ["semi_monthly", 12_000, 24_000, "half"],
    ["biweekly", 12_000, 26_000, "half"],
    ["weekly", 12_000, 52_000, "quarter"],
  ] as const)(
    "prefills monthly bases and allocation for %s",
    (frequency, basePay, expectedBasis, expectedAllocation) => {
      expect(getMonthlySalaryBasis(basePay, frequency)).toBe(expectedBasis);
      expect(getDefaultGovernmentAllocation(frequency)).toBe(expectedAllocation);
    },
  );
});

describe("government presets in salary calculations", () => {
  it("uses the prescribed monthly amount and pay-run allocation", () => {
    const calculation = calculateSalary(
      15_000,
      [
        {
          name: "PhilHealth",
          kind: "deduction",
          calculationType: "government_preset",
          governmentPresetCode: "ph_philhealth_employee",
        },
      ],
      currentContext,
    );

    expect(calculation.components[0]).toMatchObject({
      calculatedAmount: 375,
      governmentMonthlyAmount: 750,
      governmentAllocation: "half",
      governmentRuleVersion: "ph_philhealth_employee_2025_01",
    });
  });

  it("honors an editable zero override and resets when the override is removed", () => {
    const component = {
      name: "SSS",
      kind: "deduction" as const,
      calculationType: "government_preset" as const,
      governmentPresetCode: "ph_sss_employee" as const,
    };

    expect(
      calculateSalary(
        15_000,
        [{ ...component, governmentOverrideAmount: 0 }],
        currentContext,
      ).components[0].calculatedAmount,
    ).toBe(0);
    expect(
      calculateSalary(15_000, [component], currentContext).components[0]
        .calculatedAmount,
    ).toBe(750);
  });

  it("allows unsupported history only when a manual override is supplied", () => {
    const historicalContext = {
      ...currentContext,
      paymentDate: "2023-12-31",
    };
    const component = {
      name: "SSS",
      kind: "deduction" as const,
      calculationType: "government_preset" as const,
      governmentPresetCode: "ph_sss_employee" as const,
    };

    expect(() =>
      calculateSalary(15_000, [component], historicalContext),
    ).toThrow("manual override");
    expect(
      calculateSalary(
        15_000,
        [{ ...component, governmentOverrideAmount: 500 }],
        historicalContext,
      ).components[0],
    ).toMatchObject({
      calculatedAmount: 500,
      governmentRuleVersion: "manual_override_unsupported_date",
    });
  });

  it("enforces PHP, valid deductions, uniqueness, and non-negative overrides", () => {
    const component = {
      name: "Pag-IBIG",
      kind: "deduction" as const,
      calculationType: "government_preset" as const,
      governmentPresetCode: "ph_pagibig_employee" as const,
    };

    expect(() =>
      calculateSalary(15_000, [component], {
        ...currentContext,
        currency: "USD",
      }),
    ).toThrow("require PHP");
    expect(() =>
      calculateSalary(15_000, [component, component], currentContext),
    ).toThrow("cannot be duplicated");
    expect(() =>
      calculateSalary(
        15_000,
        [{ ...component, governmentOverrideAmount: -1 }],
        currentContext,
      ),
    ).toThrow("cannot be negative");
  });
});
