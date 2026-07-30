import type {
  PhilippineContributionCode,
  SalaryContributionAllocation,
  SalaryPayFrequency,
} from "@/features/salary/types";

export const PHILIPPINE_CONTRIBUTION_SOURCES = {
  ph_sss_employee: {
    label: "SSS employee share",
    shortLabel: "SSS",
    effectiveFrom: "2025-01-01",
    ruleVersion: "ph_sss_employee_2025_01",
    sourceUrl: "https://www.sss.gov.ph/pay-contribution/",
    basis: "monthlyCompensation",
  },
  ph_philhealth_employee: {
    label: "PhilHealth employee share",
    shortLabel: "PhilHealth",
    effectiveFrom: "2025-01-01",
    ruleVersion: "ph_philhealth_employee_2025_01",
    sourceUrl:
      "https://www.philhealth.gov.ph/advisories/2025/PA2025-0002.pdf",
    basis: "monthlyBasicSalary",
  },
  ph_pagibig_employee: {
    label: "Pag-IBIG employee share",
    shortLabel: "Pag-IBIG",
    effectiveFrom: "2024-02-01",
    ruleVersion: "ph_pagibig_employee_2024_02",
    sourceUrl:
      "https://pco.gov.ph/other_releases/pag-ibig-members-to-gain-more-benefits-under-new-rates-starting-february-2024/",
    basis: "monthlyCompensation",
  },
} as const satisfies Record<
  PhilippineContributionCode,
  {
    label: string;
    shortLabel: string;
    effectiveFrom: string;
    ruleVersion: string;
    sourceUrl: string;
    basis: "monthlyBasicSalary" | "monthlyCompensation";
  }
>;

export const SALARY_ALLOCATION_FRACTIONS: Record<
  SalaryContributionAllocation,
  number
> = {
  full: 1,
  half: 0.5,
  quarter: 0.25,
};

export class UnsupportedContributionDateError extends Error {
  constructor(
    public readonly code: PhilippineContributionCode,
    public readonly paymentDate: string,
  ) {
    const rule = PHILIPPINE_CONTRIBUTION_SOURCES[code];
    super(
      `${rule.shortLabel} is only supported from ${rule.effectiveFrom}. Enter a manual override for this pay date.`,
    );
    this.name = "UnsupportedContributionDateError";
  }
}

type PhilippineContributionContext = {
  paymentDate: string;
  monthlyBasicSalary: number;
  monthlyCompensation: number;
};

export type PhilippineContributionCalculation = {
  code: PhilippineContributionCode;
  basisAmount: number;
  monthlyAmount: number;
  ruleVersion: string;
  effectiveFrom: string;
  sourceUrl: string;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertNonnegativeFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
}

function sssMonthlySalaryCredit(monthlyCompensation: number) {
  if (monthlyCompensation < 5_250) return 5_000;
  if (monthlyCompensation >= 34_750) return 35_000;
  return 5_500 + Math.floor((monthlyCompensation - 5_250) / 500) * 500;
}

export function calculatePhilippineContribution(
  code: PhilippineContributionCode,
  context: PhilippineContributionContext,
): PhilippineContributionCalculation {
  const rule = PHILIPPINE_CONTRIBUTION_SOURCES[code];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(context.paymentDate)) {
    throw new Error("A valid payment date is required for government presets.");
  }
  if (context.paymentDate < rule.effectiveFrom) {
    throw new UnsupportedContributionDateError(code, context.paymentDate);
  }

  assertNonnegativeFinite(context.monthlyBasicSalary, "Monthly basic salary");
  assertNonnegativeFinite(
    context.monthlyCompensation,
    "Monthly compensation",
  );

  let basisAmount = 0;
  let monthlyAmount = 0;

  if (code === "ph_sss_employee") {
    basisAmount = context.monthlyCompensation;
    monthlyAmount = sssMonthlySalaryCredit(basisAmount) * 0.05;
  } else if (code === "ph_philhealth_employee") {
    basisAmount = context.monthlyBasicSalary;
    const premiumBasis = Math.min(100_000, Math.max(10_000, basisAmount));
    monthlyAmount = premiumBasis * 0.05 * 0.5;
  } else {
    basisAmount = context.monthlyCompensation;
    const fundSalary = Math.min(10_000, basisAmount);
    monthlyAmount = Math.min(200, fundSalary * (fundSalary <= 1_500 ? 0.01 : 0.02));
  }

  return {
    code,
    basisAmount: roundMoney(basisAmount),
    monthlyAmount: roundMoney(monthlyAmount),
    ruleVersion: rule.ruleVersion,
    effectiveFrom: rule.effectiveFrom,
    sourceUrl: rule.sourceUrl,
  };
}

export function allocatePhilippineContribution(
  monthlyAmount: number,
  allocation: SalaryContributionAllocation,
) {
  assertNonnegativeFinite(monthlyAmount, "Monthly contribution");
  return roundMoney(monthlyAmount * SALARY_ALLOCATION_FRACTIONS[allocation]);
}

export function getMonthlySalaryBasis(
  basePay: number,
  frequency: SalaryPayFrequency,
) {
  assertNonnegativeFinite(basePay, "Base pay");
  const factor =
    frequency === "monthly"
      ? 1
      : frequency === "semi_monthly"
        ? 2
        : frequency === "biweekly"
          ? 26 / 12
          : 52 / 12;
  return roundMoney(basePay * factor);
}

export function getDefaultGovernmentAllocation(
  frequency: SalaryPayFrequency,
): SalaryContributionAllocation {
  if (frequency === "monthly") return "full";
  if (frequency === "weekly") return "quarter";
  return "half";
}
