"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { monthStart } from "@/lib/calculations/bills";
import { createClient } from "@/lib/supabase/server";

const optionalUuid = z.string().uuid().optional().or(z.literal(""));
const optionalText = z.string().trim().max(2000).optional().or(z.literal(""));
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const templateSchema = z.object({
  id: optionalUuid,
  name: z.string().trim().min(1).max(120),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  defaultAmount: z.coerce.number().positive(),
  dueDay: z.coerce.number().int().min(1).max(31),
  defaultAccountId: optionalUuid,
  defaultCategoryId: optionalUuid,
  notes: optionalText,
});

const itemSchema = z.object({
  id: optionalUuid,
  plannerMonth: monthSchema,
  coverageMonth: monthSchema,
  name: z.string().trim().min(1).max(120),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  plannedAmount: z.coerce.number().positive(),
  dueDate: z.string().date(),
  accountId: optionalUuid,
  categoryId: optionalUuid,
  notes: optionalText,
});

function refreshBillViews() {
  revalidatePath("/bills");
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

export async function saveBillTemplate(formData: FormData) {
  const value = templateSchema.parse(Object.fromEntries(formData));
  const { supabase, userId } = await getAuthenticatedClient();
  const payload = {
    user_id: userId,
    name: value.name,
    currency: value.currency,
    default_amount: value.defaultAmount,
    due_day: value.dueDay,
    default_account_id: value.defaultAccountId || null,
    default_category_id: value.defaultCategoryId || null,
    notes: value.notes || null,
  };
  const { error } = value.id
    ? await supabase.from("bill_templates").update(payload).eq("id", value.id)
    : await supabase.from("bill_templates").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
}

export async function setBillTemplateArchived(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const isArchived = z.enum(["true", "false"]).parse(formData.get("isArchived")) === "true";
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.from("bill_templates").update({ is_archived: isArchived }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
}

export async function generateBillMonth(formData: FormData) {
  const plannerMonth = monthSchema.parse(formData.get("plannerMonth"));
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.rpc("generate_bill_month", {
    target_month: monthStart(plannerMonth),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
}

export async function saveBillItem(formData: FormData) {
  const value = itemSchema.parse(Object.fromEntries(formData));
  const { supabase, userId } = await getAuthenticatedClient();
  const payload = {
    user_id: userId,
    planner_month: monthStart(value.plannerMonth),
    coverage_month: monthStart(value.coverageMonth),
    name: value.name,
    currency: value.currency,
    planned_amount: value.plannedAmount,
    due_date: value.dueDate,
    account_id: value.accountId || null,
    category_id: value.categoryId || null,
    notes: value.notes || null,
  };
  const { error } = value.id
    ? await supabase.from("bill_items").update(payload).eq("id", value.id)
    : await supabase.from("bill_items").insert(payload);
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
}

export async function deleteBillItem(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.from("bill_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
}

export async function duplicateBillItem(formData: FormData) {
  const sourceBillItemId = z.string().uuid().parse(formData.get("sourceBillItemId"));
  const plannerMonth = monthSchema.parse(formData.get("plannerMonth"));
  const name = z.string().trim().max(120).parse(formData.get("name"));
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.rpc("duplicate_bill_item", {
    source_bill_item_id: sourceBillItemId,
    target_month: monthStart(plannerMonth),
    target_name: name,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
}

export async function postBillPayment(formData: FormData) {
  const value = z.object({
    id: z.string().uuid(),
    actualPaidAmount: z.coerce.number().positive(),
    paymentDate: z.string().date(),
    accountId: z.string().uuid(),
    categoryId: z.string().uuid(),
  }).parse(Object.fromEntries(formData));
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.rpc("post_bill_payment", {
    target_bill_item_id: value.id,
    paid_amount: value.actualPaidAmount,
    paid_on: value.paymentDate,
    paid_account_id: value.accountId,
    paid_category_id: value.categoryId,
  });
  if (error) throw new Error(error.message);
  refreshBillViews();
}

export async function unpostBillPayment(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.rpc("unpost_bill_payment", { target_bill_item_id: id });
  if (error) throw new Error(error.message);
  refreshBillViews();
}
