import { endOfMonth, format, parseISO, startOfMonth, subDays } from "date-fns";
import type {
  SalaryCalculation,
  SalaryComponentInput,
  SalaryGovernmentContext,
  SalaryPayFrequency,
} from "@/features/salary/types";
import {
  allocatePhilippineContribution,
  calculatePhilippineContribution,
  UnsupportedContributionDateError,
} from "./ph-government-contributions";

function toCents(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error("Salary values must be finite numbers.");
  }

  return Math.round((value + Number.EPSILON) * 100);
}

function fromCents(value: number) {
  return value / 100;
}

function componentAmountInCents(
  component: SalaryComponentInput,
  basePayCents: number,
  grossPayCents: number,
  governmentContext?: SalaryGovernmentContext,
) {
  switch (component.calculationType) {
    case "fixed":
      return toCents(component.fixedAmount ?? 0);
    case "percentage_base":
      return Math.round(basePayCents * ((component.percentage ?? 0) / 100));
    case "percentage_gross":
      return Math.round(grossPayCents * ((component.percentage ?? 0) / 100));
    case "hourly":
      return toCents(
        (component.hours ?? 0) *
          (component.hourlyRate ?? 0) *
          (component.multiplier ?? 1),
      );
    case "government_preset": {
      if (!component.governmentPresetCode) {
        throw new Error("Government presets require a preset code.");
      }
      if (!governmentContext) {
        throw new Error("Government presets require salary and payment context.");
      }
      if (governmentContext.currency !== "PHP") {
        throw new Error("Philippine government presets require PHP currency.");
      }

      if (component.governmentOverrideAmount !== undefined) {
        return toCents(component.governmentOverrideAmount);
      }

      const prescribed = calculatePhilippineContribution(
        component.governmentPresetCode,
        governmentContext,
      );
      return toCents(
        allocatePhilippineContribution(
          prescribed.monthlyAmount,
          governmentContext.allocation,
        ),
      );
    }
  }
}

function validateComponent(component: SalaryComponentInput) {
  if (!component.name.trim()) {
    throw new Error("Every salary component needs a name.");
  }

  const values = [
    component.fixedAmount,
    component.percentage,
    component.hours,
    component.hourlyRate,
    component.multiplier,
    component.governmentMonthlyAmount,
    component.governmentOverrideAmount,
  ].filter((value): value is number => value !== undefined);

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Salary component values cannot be negative.");
  }

  if (component.calculationType === "hourly" && component.kind !== "earning") {
    throw new Error("Hourly components can only be additional earnings.");
  }

  if (
    component.calculationType === "percentage_gross" &&
    component.kind !== "deduction"
  ) {
    throw new Error("Gross-pay percentages can only be deductions.");
  }

  if (
    component.calculationType === "government_preset" &&
    (component.kind !== "deduction" || !component.governmentPresetCode)
  ) {
    throw new Error("Government presets must be valid deduction components.");
  }
}

export function calculateSalary(
  basePay: number,
  components: SalaryComponentInput[],
  governmentContext?: SalaryGovernmentContext,
): SalaryCalculation {
  const basePayCents = toCents(basePay);
  if (basePayCents < 0) {
    throw new Error("Base pay cannot be negative.");
  }

  components.forEach(validateComponent);

  const presetCodes = components
    .filter((component) => component.calculationType === "government_preset")
    .map((component) => component.governmentPresetCode);
  if (new Set(presetCodes).size !== presetCodes.length) {
    throw new Error("Government contribution presets cannot be duplicated.");
  }

  const earningAmounts = new Map<number, number>();
  let additionalEarningsCents = 0;

  components.forEach((component, index) => {
    if (component.kind !== "earning") return;
    const amount = componentAmountInCents(
      component,
      basePayCents,
      basePayCents,
      governmentContext,
    );
    earningAmounts.set(index, amount);
    additionalEarningsCents += amount;
  });

  const grossPayCents = basePayCents + additionalEarningsCents;
  const deductionAmounts = new Map<number, number>();
  let totalDeductionsCents = 0;

  components.forEach((component, index) => {
    if (component.kind !== "deduction") return;
    const amount = componentAmountInCents(
      component,
      basePayCents,
      grossPayCents,
      governmentContext,
    );
    deductionAmounts.set(index, amount);
    totalDeductionsCents += amount;
  });

  const netPayCents = grossPayCents - totalDeductionsCents;
  if (netPayCents < 0) {
    throw new Error("Deductions cannot exceed gross pay.");
  }

  return {
    basePay: fromCents(basePayCents),
    additionalEarnings: fromCents(additionalEarningsCents),
    grossPay: fromCents(grossPayCents),
    totalDeductions: fromCents(totalDeductionsCents),
    netPay: fromCents(netPayCents),
    components: components.map((component, index) => {
      let governmentMetadata: Partial<SalaryComponentInput> = {};
      if (
        component.calculationType === "government_preset" &&
        component.governmentPresetCode &&
        governmentContext
      ) {
        try {
          const prescribed = calculatePhilippineContribution(
            component.governmentPresetCode,
            governmentContext,
          );
          governmentMetadata = {
            governmentRuleVersion: prescribed.ruleVersion,
            governmentMonthlyAmount: prescribed.monthlyAmount,
            governmentAllocation: governmentContext.allocation,
          };
        } catch (error) {
          if (
            !(error instanceof UnsupportedContributionDateError) ||
            component.governmentOverrideAmount === undefined
          ) {
            throw error;
          }
          governmentMetadata = {
            governmentRuleVersion: "manual_override_unsupported_date",
            governmentMonthlyAmount: 0,
            governmentAllocation: governmentContext.allocation,
          };
        }
      }

      return {
        ...component,
        ...governmentMetadata,
        calculatedAmount: fromCents(
          earningAmounts.get(index) ?? deductionAmounts.get(index) ?? 0,
        ),
      };
    }),
  };
}

export function getSalaryPeriodDefaults(
  frequency: SalaryPayFrequency,
  paymentDate: string,
) {
  const payment = parseISO(paymentDate);
  let start = payment;
  let end = payment;

  if (frequency === "weekly") {
    start = subDays(payment, 6);
  } else if (frequency === "biweekly") {
    start = subDays(payment, 13);
  } else if (frequency === "semi_monthly") {
    if (payment.getDate() <= 15) {
      start = startOfMonth(payment);
      end = new Date(payment.getFullYear(), payment.getMonth(), 15);
    } else {
      start = new Date(payment.getFullYear(), payment.getMonth(), 16);
      end = endOfMonth(payment);
    }
  } else {
    start = startOfMonth(payment);
    end = endOfMonth(payment);
  }

  return {
    payPeriodStart: format(start, "yyyy-MM-dd"),
    payPeriodEnd: format(end, "yyyy-MM-dd"),
    paymentDate: format(payment, "yyyy-MM-dd"),
  };
}
