import type {
  SalaryContributionAllocation,
  SalaryComponentInput,
  SalaryProfile,
  SalaryRun,
} from "@/features/salary/types";
import {
  getDefaultGovernmentAllocation,
  getMonthlySalaryBasis,
} from "@/lib/calculations/ph-government-contributions";
import { createClient } from "@/lib/supabase/server";

type ProfileComponentRow = {
  id: string;
  name: string;
  component_kind: SalaryComponentInput["kind"];
  calculation_type: SalaryComponentInput["calculationType"];
  fixed_amount: number | string | null;
  percentage: number | string | null;
  hours: number | string | null;
  hourly_rate: number | string | null;
  multiplier: number | string | null;
  government_preset_code: SalaryComponentInput["governmentPresetCode"] | null;
  government_rule_version: string | null;
  government_monthly_amount: number | string | null;
  government_allocation_fraction: number | string | null;
  government_override_amount: number | string | null;
  display_order: number;
};

type RunComponentRow = ProfileComponentRow & {
  source_profile_component_id: string | null;
  calculated_amount: number | string;
};

type ProfileRow = {
  id: string;
  name: string;
  employer_name: string;
  job_title: string | null;
  currency: string;
  pay_frequency: SalaryProfile["payFrequency"];
  base_pay: number | string;
  monthly_basic_salary: number | string | null;
  monthly_compensation: number | string | null;
  government_contribution_allocation: SalaryContributionAllocation | null;
  default_account_id: string;
  default_income_category_id: string;
  is_archived: boolean;
  salary_profile_components: ProfileComponentRow[];
};

type RunRow = {
  id: string;
  profile_id: string;
  profile_name: string;
  employer_name: string;
  job_title: string | null;
  currency: string;
  pay_frequency: SalaryRun["payFrequency"];
  account_id: string;
  income_category_id: string;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string;
  base_pay: number | string;
  monthly_basic_salary: number | string | null;
  monthly_compensation: number | string | null;
  government_contribution_allocation: SalaryContributionAllocation | null;
  gross_pay: number | string;
  total_deductions: number | string;
  net_pay: number | string;
  notes: string | null;
  transaction_id: string | null;
  salary_run_components: RunComponentRow[];
};

function optionalNumber(value: number | string | null) {
  return value === null ? undefined : Number(value);
}

function allocationFromFraction(
  value: number | string | null,
): SalaryContributionAllocation | undefined {
  if (value === null) return undefined;
  const fraction = Number(value);
  if (fraction === 1) return "full";
  if (fraction === 0.5) return "half";
  return "quarter";
}

function mapProfileComponent(component: ProfileComponentRow): SalaryComponentInput {
  return {
    id: component.id,
    name: component.name,
    kind: component.component_kind,
    calculationType: component.calculation_type,
    fixedAmount: optionalNumber(component.fixed_amount),
    percentage: optionalNumber(component.percentage),
    hours: optionalNumber(component.hours),
    hourlyRate: optionalNumber(component.hourly_rate),
    multiplier: optionalNumber(component.multiplier),
    governmentPresetCode: component.government_preset_code ?? undefined,
    governmentRuleVersion: component.government_rule_version ?? undefined,
    governmentMonthlyAmount: optionalNumber(component.government_monthly_amount),
    governmentAllocation: allocationFromFraction(
      component.government_allocation_fraction,
    ),
    governmentOverrideAmount: optionalNumber(component.government_override_amount),
    displayOrder: component.display_order,
  };
}

function mapProfile(profile: ProfileRow): SalaryProfile {
  const basePay = Number(profile.base_pay);
  return {
    id: profile.id,
    name: profile.name,
    employerName: profile.employer_name,
    jobTitle: profile.job_title,
    currency: profile.currency,
    payFrequency: profile.pay_frequency,
    basePay,
    monthlyBasicSalary:
      profile.monthly_basic_salary === null
        ? getMonthlySalaryBasis(basePay, profile.pay_frequency)
        : Number(profile.monthly_basic_salary),
    monthlyCompensation:
      profile.monthly_compensation === null
        ? getMonthlySalaryBasis(basePay, profile.pay_frequency)
        : Number(profile.monthly_compensation),
    governmentContributionAllocation:
      profile.government_contribution_allocation ??
      getDefaultGovernmentAllocation(profile.pay_frequency),
    defaultAccountId: profile.default_account_id,
    defaultIncomeCategoryId: profile.default_income_category_id,
    isArchived: profile.is_archived,
    components: [...profile.salary_profile_components]
      .sort((a, b) => a.display_order - b.display_order)
      .map(mapProfileComponent),
  };
}

function mapRun(run: RunRow): SalaryRun {
  const basePay = Number(run.base_pay);
  return {
    id: run.id,
    profileId: run.profile_id,
    profileName: run.profile_name,
    employerName: run.employer_name,
    jobTitle: run.job_title,
    currency: run.currency,
    payFrequency: run.pay_frequency,
    accountId: run.account_id,
    incomeCategoryId: run.income_category_id,
    payPeriodStart: run.pay_period_start,
    payPeriodEnd: run.pay_period_end,
    paymentDate: run.payment_date,
    basePay,
    monthlyBasicSalary:
      run.monthly_basic_salary === null
        ? getMonthlySalaryBasis(basePay, run.pay_frequency)
        : Number(run.monthly_basic_salary),
    monthlyCompensation:
      run.monthly_compensation === null
        ? getMonthlySalaryBasis(basePay, run.pay_frequency)
        : Number(run.monthly_compensation),
    governmentContributionAllocation:
      run.government_contribution_allocation ??
      getDefaultGovernmentAllocation(run.pay_frequency),
    grossPay: Number(run.gross_pay),
    totalDeductions: Number(run.total_deductions),
    netPay: Number(run.net_pay),
    notes: run.notes,
    transactionId: run.transaction_id,
    components: [...run.salary_run_components]
      .sort((a, b) => a.display_order - b.display_order)
      .map((component) => ({
        ...mapProfileComponent(component),
        sourceProfileComponentId: component.source_profile_component_id ?? undefined,
        calculatedAmount: Number(component.calculated_amount),
      })),
  };
}

export async function getSalaryOptions({ includeArchived = false } = {}) {
  const supabase = await createClient();
  const [
    { data: profileRow },
    { data: accountRows, error: accountError },
    { data: categoryRows, error: categoryError },
  ] = await Promise.all([
    supabase.from("profiles").select("default_currency").single(),
    supabase
      .from("accounts")
      .select("id,name,currency,is_archived")
      .order("display_order")
      .order("name"),
    supabase
      .from("categories")
      .select("id,name,is_archived")
      .eq("transaction_type", "income")
      .order("display_order")
      .order("name"),
  ]);
  if (accountError) throw new Error(accountError.message);
  if (categoryError) throw new Error(categoryError.message);

  return {
    defaultCurrency: profileRow?.default_currency ?? "PHP",
    accounts: (accountRows ?? []).filter((account) => includeArchived || !account.is_archived),
    categories: (categoryRows ?? []).filter(
      (category) => includeArchived || !category.is_archived,
    ),
  };
}

export async function getSalaryProfiles({ includeArchived = false } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("salary_profiles")
    .select(
      "id,name,employer_name,job_title,currency,pay_frequency,base_pay,monthly_basic_salary,monthly_compensation,government_contribution_allocation,default_account_id,default_income_category_id,is_archived,salary_profile_components(id,name,component_kind,calculation_type,fixed_amount,percentage,hours,hourly_rate,multiplier,government_preset_code,government_rule_version,government_monthly_amount,government_allocation_fraction,government_override_amount,display_order)",
    )
    .order("is_archived")
    .order("name");
  if (!includeArchived) query = query.eq("is_archived", false);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ProfileRow[]).map(mapProfile);
}

export async function getSalaryRuns(limit = 100) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salary_runs")
    .select(
      "id,profile_id,profile_name,employer_name,job_title,currency,pay_frequency,account_id,income_category_id,pay_period_start,pay_period_end,payment_date,base_pay,monthly_basic_salary,monthly_compensation,government_contribution_allocation,gross_pay,total_deductions,net_pay,notes,transaction_id,salary_run_components(id,source_profile_component_id,name,component_kind,calculation_type,fixed_amount,percentage,hours,hourly_rate,multiplier,government_preset_code,government_rule_version,government_monthly_amount,government_allocation_fraction,government_override_amount,calculated_amount,display_order)",
    )
    .order("payment_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RunRow[]).map(mapRun);
}

export async function getSalaryRun(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salary_runs")
    .select(
      "id,profile_id,profile_name,employer_name,job_title,currency,pay_frequency,account_id,income_category_id,pay_period_start,pay_period_end,payment_date,base_pay,monthly_basic_salary,monthly_compensation,government_contribution_allocation,gross_pay,total_deductions,net_pay,notes,transaction_id,salary_run_components(id,source_profile_component_id,name,component_kind,calculation_type,fixed_amount,percentage,hours,hourly_rate,multiplier,government_preset_code,government_rule_version,government_monthly_amount,government_allocation_fraction,government_override_amount,calculated_amount,display_order)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRun(data as unknown as RunRow) : null;
}
