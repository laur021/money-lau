export const salaryPayFrequencies = [
  "weekly",
  "biweekly",
  "semi_monthly",
  "monthly",
] as const;

export const salaryComponentKinds = ["earning", "deduction"] as const;

export const salaryCalculationTypes = [
  "fixed",
  "percentage_base",
  "percentage_gross",
  "hourly",
  "government_preset",
] as const;

export const philippineContributionCodes = [
  "ph_sss_employee",
  "ph_philhealth_employee",
  "ph_pagibig_employee",
] as const;

export const salaryContributionAllocations = [
  "full",
  "half",
  "quarter",
] as const;

export type SalaryPayFrequency = (typeof salaryPayFrequencies)[number];
export type SalaryComponentKind = (typeof salaryComponentKinds)[number];
export type SalaryCalculationType = (typeof salaryCalculationTypes)[number];
export type PhilippineContributionCode =
  (typeof philippineContributionCodes)[number];
export type SalaryContributionAllocation =
  (typeof salaryContributionAllocations)[number];

export type SalaryGovernmentContext = {
  currency: string;
  paymentDate: string;
  monthlyBasicSalary: number;
  monthlyCompensation: number;
  allocation: SalaryContributionAllocation;
};

export type SalaryComponentInput = {
  id?: string;
  sourceProfileComponentId?: string;
  name: string;
  kind: SalaryComponentKind;
  calculationType: SalaryCalculationType;
  fixedAmount?: number;
  percentage?: number;
  hours?: number;
  hourlyRate?: number;
  multiplier?: number;
  governmentPresetCode?: PhilippineContributionCode;
  governmentRuleVersion?: string;
  governmentMonthlyAmount?: number;
  governmentAllocation?: SalaryContributionAllocation;
  governmentOverrideAmount?: number;
  displayOrder?: number;
};

export type SalaryCalculatedComponent = SalaryComponentInput & {
  calculatedAmount: number;
};

export type SalaryCalculation = {
  basePay: number;
  additionalEarnings: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  components: SalaryCalculatedComponent[];
};

export type SalaryProfile = {
  id: string;
  name: string;
  employerName: string;
  jobTitle: string | null;
  currency: string;
  payFrequency: SalaryPayFrequency;
  basePay: number;
  monthlyBasicSalary: number;
  monthlyCompensation: number;
  governmentContributionAllocation: SalaryContributionAllocation;
  defaultAccountId: string;
  defaultIncomeCategoryId: string;
  isArchived: boolean;
  components: SalaryComponentInput[];
};

export type SalaryRun = {
  id: string;
  profileId: string;
  profileName: string;
  employerName: string;
  jobTitle: string | null;
  currency: string;
  payFrequency: SalaryPayFrequency;
  accountId: string;
  incomeCategoryId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  paymentDate: string;
  basePay: number;
  monthlyBasicSalary: number;
  monthlyCompensation: number;
  governmentContributionAllocation: SalaryContributionAllocation;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  notes: string | null;
  transactionId: string | null;
  components: SalaryCalculatedComponent[];
};
