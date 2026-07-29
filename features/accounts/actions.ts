"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
const accountSchema = z.object({
  name: z.string().trim().min(1),
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
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((v) => v.toUpperCase()),
});
export async function createAccount(formData: FormData) {
  const value = accountSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new Error("Unauthorized");
  const { error } = await supabase.from("accounts").insert({
    user_id: data.claims.sub,
    name: value.name,
    account_type: value.accountType,
    opening_balance: value.openingBalance,
    currency: value.currency,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
}
export async function setAccountArchived(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const archived = z.enum(["true", "false"]).parse(formData.get("archived")) === "true";
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update({ is_archived: archived }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
}
const categorySchema = z.object({
  name: z.string().trim().min(1),
  transactionType: z.enum(["income", "expense"]),
  parentCategoryId: z.string().uuid().optional().or(z.literal("")),
});
export async function createCategory(formData: FormData) {
  const value = categorySchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new Error("Unauthorized");
  const { error } = await supabase.from("categories").insert({
    user_id: data.claims.sub,
    name: value.name,
    transaction_type: value.transactionType,
    parent_category_id: value.parentCategoryId || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}
export async function setCategoryArchived(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const archived = z.enum(["true", "false"]).parse(formData.get("archived")) === "true";
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_archived: archived })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/categories");
}
