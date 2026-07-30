"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const optionalShortText = z.string().trim().max(100).optional().or(z.literal(""));

const accountSchema = z.object({
  name: z.string().trim().min(1).max(100),
  institutionName: optionalShortText,
  accountType: z.enum([
    "bank",
    "cash",
    "savings",
    "checking",
    "credit_card",
    "e_wallet",
    "investment",
    "other",
  ]),
  openingBalance: z.coerce.number(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  accountIdentifier: z.string().trim().max(4).optional().or(z.literal("")),
  icon: z.string().trim().max(50).optional().or(z.literal("")),
  color: z.string().trim().max(30).optional().or(z.literal("")),
  includeInTotal: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0).optional().default(0),
});

function accountPayload(value: z.infer<typeof accountSchema>) {
  return {
    name: value.name,
    institution_name: value.institutionName || null,
    account_type: value.accountType,
    opening_balance: value.openingBalance,
    currency: value.currency,
    account_identifier: value.accountIdentifier || null,
    icon: value.icon || "wallet",
    color: value.color || "blue",
    include_in_total: value.includeInTotal === "true" || value.includeInTotal === "on",
    display_order: value.displayOrder,
  };
}

function refreshAccountViews() {
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/reports");
}

export async function createAccount(formData: FormData) {
  const value = accountSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new Error("Unauthorized");
  const { error } = await supabase.from("accounts").insert({
    user_id: data.claims.sub,
    ...accountPayload(value),
  });
  if (error) throw new Error(error.message);
  refreshAccountViews();
}

export async function updateAccount(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const value = accountSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update(accountPayload(value)).eq("id", id);
  if (error) throw new Error(error.message);
  refreshAccountViews();
}

export async function setAccountArchived(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const archived = z.enum(["true", "false"]).parse(formData.get("archived")) === "true";
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update({ is_archived: archived }).eq("id", id);
  if (error) throw new Error(error.message);
  refreshAccountViews();
}

export async function moveAccount(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const displayOrder = z.coerce.number().int().parse(formData.get("displayOrder"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ display_order: Math.max(0, displayOrder + (direction === "up" ? -1 : 1)) })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
}

const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  transactionType: z.enum(["income", "expense"]),
  parentCategoryId: z.string().uuid().optional().or(z.literal("")),
  icon: z.string().trim().max(50).optional().or(z.literal("")),
  color: z.string().trim().max(30).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().min(0).optional().default(0),
});

function categoryPayload(value: z.infer<typeof categorySchema>) {
  return {
    name: value.name,
    transaction_type: value.transactionType,
    parent_category_id: value.parentCategoryId || null,
    icon: value.icon || "tag",
    color: value.color || "blue",
    display_order: value.displayOrder,
  };
}

function refreshCategoryViews() {
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function createCategory(formData: FormData) {
  const value = categorySchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new Error("Unauthorized");
  const { error } = await supabase.from("categories").insert({
    user_id: data.claims.sub,
    ...categoryPayload(value),
  });
  if (error) throw new Error(error.message);
  refreshCategoryViews();
}

export async function updateCategory(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const value = categorySchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(categoryPayload(value)).eq("id", id);
  if (error) throw new Error(error.message);
  refreshCategoryViews();
}

export async function setCategoryArchived(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const archived = z.enum(["true", "false"]).parse(formData.get("archived")) === "true";
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ is_archived: archived }).eq("id", id);
  if (error) throw new Error(error.message);
  refreshCategoryViews();
}

export async function moveCategory(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const displayOrder = z.coerce.number().int().parse(formData.get("displayOrder"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ display_order: Math.max(0, displayOrder + (direction === "up" ? -1 : 1)) })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}