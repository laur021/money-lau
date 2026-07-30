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
] as const;

export type SalaryPayFrequency = (typeof salaryPayFrequencies)[number];
export type SalaryComponentKind = (typeof salaryComponentKinds)[number];
export type SalaryCalculationType = (typeof salaryCalculationTypes)[number];

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
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  notes: string | null;
  transactionId: string | null;
  components: SalaryCalculatedComponent[];
};
