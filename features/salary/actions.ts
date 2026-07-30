"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  salaryCalculationTypes,
  salaryComponentKinds,
  salaryPayFrequencies,
  type SalaryCalculatedComponent,
  type SalaryComponentInput,
} from "@/features/salary/types";
import { calculateSalary } from "@/lib/calculations/salary";
import { createClient } from "@/lib/supabase/server";

const optionalText = z.string().trim().max(2_000).optional().or(z.literal(""));
const currencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());

const componentSchema = z
  .object({
    id: z.string().uuid().optional(),
    sourceProfileComponentId: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(100),
    kind: z.enum(salaryComponentKinds),
    calculationType: z.enum(salaryCalculationTypes),
    fixedAmount: z.number().nonnegative().optional(),
    percentage: z.number().nonnegative().optional(),
    hours: z.number().nonnegative().optional(),
    hourlyRate: z.number().nonnegative().optional(),
    multiplier: z.number().nonnegative().optional(),
    displayOrder: z.number().int().nonnegative().optional(),
  })
  .superRefine((component, context) => {
    if (component.calculationType === "fixed" && component.fixedAmount === undefined) {
      context.addIssue({
        code: "custom",
        message: "Fixed components require an amount.",
        path: ["fixedAmount"],
      });
    }
    if (
      component.calculationType.startsWith("percentage") &&
      component.percentage === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "Percentage components require a percentage.",
        path: ["percentage"],
      });
    }
    if (
      component.calculationType === "hourly" &&
      (component.hours === undefined ||
        component.hourlyRate === undefined ||
        component.multiplier === undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "Hourly components require hours, rate, and multiplier.",
        path: ["hours"],
      });
    }
  });

const profileSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1).max(100),
  employerName: z.string().trim().min(1).max(160),
  jobTitle: z.string().trim().max(120).optional().or(z.literal("")),
  currency: currencySchema,
  payFrequency: z.enum(salaryPayFrequencies),
  basePay: z.coerce.number().nonnegative(),
  defaultAccountId: z.string().uuid(),
  defaultIncomeCategoryId: z.string().uuid(),
});

const runSchema = z
  .object({
    id: z.string().uuid().optional().or(z.literal("")),
    profileId: z.string().uuid(),
    accountId: z.string().uuid(),
    incomeCategoryId: z.string().uuid(),
    payPeriodStart: z.string().date(),
    payPeriodEnd: z.string().date(),
    paymentDate: z.string().date(),
    basePay: z.coerce.number().nonnegative(),
    notes: optionalText,
  })
  .refine((value) => value.payPeriodStart <= value.payPeriodEnd, {
    message: "Pay period start must be on or before the end date.",
    path: ["payPeriodEnd"],
  });

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function parseComponents(formData: FormData) {
  const value = z.string().parse(formData.get("components"));
  return z.array(componentSchema).max(50).parse(JSON.parse(value)) as SalaryComponentInput[];
}

function profileComponentPayload(
  userId: string,
  profileId: string,
  component: SalaryComponentInput,
  index: number,
) {
  return {
    user_id: userId,
    profile_id: profileId,
    component_kind: component.kind,
    name: component.name,
    calculation_type: component.calculationType,
    fixed_amount: component.calculationType === "fixed" ? component.fixedAmount ?? 0 : null,
    percentage: component.calculationType.startsWith("percentage")
      ? component.percentage ?? 0
      : null,
    hours: component.calculationType === "hourly" ? component.hours ?? 0 : null,
    hourly_rate:
      component.calculationType === "hourly" ? component.hourlyRate ?? 0 : null,
    multiplier:
      component.calculationType === "hourly" ? component.multiplier ?? 1 : null,
    display_order: component.displayOrder ?? index,
  };
}

function runComponentPayload(
  userId: string,
  salaryRunId: string,
  component: SalaryCalculatedComponent,
  index: number,
) {
  return {
    user_id: userId,
    salary_run_id: salaryRunId,
    source_profile_component_id: component.sourceProfileComponentId ?? component.id ?? null,
    component_kind: component.kind,
    name: component.name,
    calculation_type: component.calculationType,
    fixed_amount: component.calculationType === "fixed" ? component.fixedAmount ?? 0 : null,
    percentage: component.calculationType.startsWith("percentage")
      ? component.percentage ?? 0
      : null,
    hours: component.calculationType === "hourly" ? component.hours ?? 0 : null,
    hourly_rate:
      component.calculationType === "hourly" ? component.hourlyRate ?? 0 : null,
    multiplier:
      component.calculationType === "hourly" ? component.multiplier ?? 1 : null,
    calculated_amount: component.calculatedAmount,
    display_order: component.displayOrder ?? index,
  };
}

function refreshSalaryViews() {
  revalidatePath("/salary");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Unauthorized");
  return { supabase, userId };
}

async function assertSalaryReferences(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  categoryId: string,
  currency: string,
) {
  const [{ data: account }, { data: category }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", userId)
      .eq("currency", currency)
      .eq("is_archived", false)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .eq("transaction_type", "income")
      .eq("is_archived", false)
      .maybeSingle(),
  ]);

  if (!account) {
    throw new Error("Choose an active account that matches the salary currency.");
  }
  if (!category) {
    throw new Error("Choose an active income category.");
  }
}

export async function saveSalaryProfile(formData: FormData) {
  const value = profileSchema.parse(Object.fromEntries(formData));
  const components = parseComponents(formData);
  calculateSalary(value.basePay, components);
  const { supabase, userId } = await getAuthenticatedClient();

  await assertSalaryReferences(
    supabase,
    userId,
    value.defaultAccountId,
    value.defaultIncomeCategoryId,
    value.currency,
  );

  const profilePayload = {
    user_id: userId,
    name: value.name,
    employer_name: value.employerName,
    job_title: value.jobTitle || null,
    currency: value.currency,
    pay_frequency: value.payFrequency,
    base_pay: value.basePay,
    default_account_id: value.defaultAccountId,
    default_income_category_id: value.defaultIncomeCategoryId,
  };

  let profileId = value.id || "";
  if (profileId) {
    const { data, error } = await supabase
      .from("salary_profiles")
      .update(profilePayload)
      .eq("id", profileId)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    profileId = data.id;

    const { error: deleteError } = await supabase
      .from("salary_profile_components")
      .delete()
      .eq("profile_id", profileId);
    if (deleteError) throw new Error(deleteError.message);
  } else {
    const { data, error } = await supabase
      .from("salary_profiles")
      .insert(profilePayload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    profileId = data.id;
  }

  if (components.length) {
    const { error } = await supabase
      .from("salary_profile_components")
      .insert(
        components.map((component, index) =>
          profileComponentPayload(userId, profileId, component, index),
        ),
      );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/salary");
}

export async function setSalaryProfileArchived(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const isArchived = z.enum(["true", "false"]).parse(formData.get("isArchived")) === "true";
  const { supabase, userId } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("salary_profiles")
    .update({ is_archived: isArchived })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/salary");
}

export async function saveSalaryRun(formData: FormData) {
  const value = runSchema.parse(Object.fromEntries(formData));
  const components = parseComponents(formData);
  const calculation = calculateSalary(value.basePay, components);
  const { supabase, userId } = await getAuthenticatedClient();
  const { data: profile, error: profileError } = await supabase
    .from("salary_profiles")
    .select("id,name,employer_name,job_title,currency,pay_frequency,is_archived")
    .eq("id", value.profileId)
    .eq("user_id", userId)
    .single();
  if (profileError || !profile || profile.is_archived) {
    throw new Error("Choose an active salary profile.");
  }

  await assertSalaryReferences(
    supabase,
    userId,
    value.accountId,
    value.incomeCategoryId,
    profile.currency,
  );

  const runPayload = {
    user_id: userId,
    profile_id: profile.id,
    profile_name: profile.name,
    employer_name: profile.employer_name,
    job_title: profile.job_title,
    pay_frequency: profile.pay_frequency,
    currency: profile.currency,
    account_id: value.accountId,
    income_category_id: value.incomeCategoryId,
    pay_period_start: value.payPeriodStart,
    pay_period_end: value.payPeriodEnd,
    payment_date: value.paymentDate,
    base_pay: calculation.basePay,
    gross_pay: calculation.grossPay,
    total_deductions: calculation.totalDeductions,
    net_pay: calculation.netPay,
    notes: value.notes || null,
  };

  let runId = value.id || "";
  if (runId) {
    const { data, error } = await supabase
      .from("salary_runs")
      .update(runPayload)
      .eq("id", runId)
      .eq("user_id", userId)
      .is("transaction_id", null)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    runId = data.id;

    const { error: deleteError } = await supabase
      .from("salary_run_components")
      .delete()
      .eq("salary_run_id", runId);
    if (deleteError) throw new Error(deleteError.message);
  } else {
    const { data, error } = await supabase
      .from("salary_runs")
      .insert(runPayload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    runId = data.id;
  }

  if (calculation.components.length) {
    const { error } = await supabase
      .from("salary_run_components")
      .insert(
        calculation.components.map((component, index) =>
          runComponentPayload(userId, runId, component, index),
        ),
      );
    if (error) throw new Error(error.message);
  }

  refreshSalaryViews();
  redirect(`/salary/${runId}`);
}

export async function deleteSalaryDraft(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase, userId } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("salary_runs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .is("transaction_id", null);
  if (error) throw new Error(error.message);
  refreshSalaryViews();
  redirect("/salary");
}

async function recalculateSalaryDraft(
  supabase: SupabaseClient,
  userId: string,
  runId: string,
) {
  const [{ data: run, error: runError }, { data: components, error: componentError }] =
    await Promise.all([
      supabase
        .from("salary_runs")
        .select("base_pay,transaction_id")
        .eq("id", runId)
        .eq("user_id", userId)
        .single(),
      supabase
        .from("salary_run_components")
        .select(
          "id,source_profile_component_id,name,component_kind,calculation_type,fixed_amount,percentage,hours,hourly_rate,multiplier,display_order",
        )
        .eq("salary_run_id", runId)
        .eq("user_id", userId)
        .order("display_order"),
    ]);
  if (runError || !run) throw new Error("Salary run not found.");
  if (componentError) throw new Error(componentError.message);
  if (run.transaction_id) throw new Error("Salary run is already posted.");

  const inputs: SalaryComponentInput[] = (components ?? []).map((component) => ({
    id: component.id,
    sourceProfileComponentId: component.source_profile_component_id ?? undefined,
    name: component.name,
    kind: component.component_kind,
    calculationType: component.calculation_type,
    fixedAmount: component.fixed_amount ?? undefined,
    percentage: component.percentage ?? undefined,
    hours: component.hours ?? undefined,
    hourlyRate: component.hourly_rate ?? undefined,
    multiplier: component.multiplier ?? undefined,
    displayOrder: component.display_order,
  }));
  const calculation = calculateSalary(Number(run.base_pay), inputs);
  if (calculation.netPay <= 0) {
    throw new Error("Net pay must be greater than zero before posting.");
  }

  const { error } = await supabase
    .from("salary_runs")
    .update({
      gross_pay: calculation.grossPay,
      total_deductions: calculation.totalDeductions,
      net_pay: calculation.netPay,
    })
    .eq("id", runId)
    .eq("user_id", userId)
    .is("transaction_id", null);
  if (error) throw new Error(error.message);
}

export async function postSalaryRun(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase, userId } = await getAuthenticatedClient();
  await recalculateSalaryDraft(supabase, userId, id);
  const { error } = await supabase.rpc("post_salary_run", {
    target_salary_run_id: id,
  });
  if (error) throw new Error(error.message);
  refreshSalaryViews();
}

export async function unpostSalaryRun(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.rpc("unpost_salary_run", {
    target_salary_run_id: id,
  });
  if (error) throw new Error(error.message);
  refreshSalaryViews();
}
