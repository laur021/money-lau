"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const optionalText = z.string().trim().max(500).optional().or(z.literal(""));

const transactionSchema = z.object({
  transactionType: z.enum(["income", "expense", "transfer"]),
  accountId: z.string().uuid(),
  destinationAccountId: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  status: z.enum(["completed", "pending", "cancelled"]),
  transactionDate: z.string().date().optional().or(z.literal("")),
  description: optionalText,
  merchant: optionalText,
  referenceNumber: z.string().trim().max(100).optional().or(z.literal("")),
  tags: z.string().trim().max(500).optional().or(z.literal("")),
});

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function transactionPayload(value: z.infer<typeof transactionSchema>) {
  return {
    transaction_type: value.transactionType,
    account_id: value.accountId,
    destination_account_id: value.destinationAccountId || null,
    category_id: value.categoryId || null,
    amount: value.amount,
    currency: value.currency,
    status: value.status,
    transaction_date: value.transactionDate || new Date().toISOString(),
    description: value.description || null,
    merchant: value.merchant || null,
    reference_number: value.referenceNumber || null,
  };
}

function parseTagNames(value: string | undefined) {
  return [...new Set((value ?? "").split(",").map((name) => name.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
}

async function findOrCreateTag(supabase: SupabaseClient, userId: string, name: string) {
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", name)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("tags")
    .insert({ user_id: userId, name })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function syncTransactionTags(
  supabase: SupabaseClient,
  userId: string,
  transactionId: string,
  names: string[],
) {
  const { error: deleteError } = await supabase
    .from("transaction_tags")
    .delete()
    .eq("transaction_id", transactionId);
  if (deleteError) throw new Error(deleteError.message);
  if (!names.length) return;

  const tagIds = await Promise.all(names.map((name) => findOrCreateTag(supabase, userId, name)));
  const { error } = await supabase.from("transaction_tags").insert(
    tagIds.map((tagId) => ({ transaction_id: transactionId, tag_id: tagId })),
  );
  if (error) throw new Error(error.message);
}

function refreshTransactionViews() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/accounts");
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Unauthorized");
  return { supabase, userId };
}

export async function createTransaction(formData: FormData) {
  const value = transactionSchema.parse(Object.fromEntries(formData));
  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({ user_id: userId, ...transactionPayload(value) })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await syncTransactionTags(supabase, userId, data.id, parseTagNames(value.tags));
  refreshTransactionViews();
}

export async function updateTransaction(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const value = transactionSchema.parse(Object.fromEntries(formData));
  const { supabase, userId } = await getAuthenticatedClient();
  const { error } = await supabase.from("transactions").update(transactionPayload(value)).eq("id", id);
  if (error) throw new Error(error.message);
  await syncTransactionTags(supabase, userId, id, parseTagNames(value.tags));
  refreshTransactionViews();
}

export async function deleteTransaction(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refreshTransactionViews();
}

export async function createTag(formData: FormData) {
  const name = z.string().trim().min(1).max(50).parse(formData.get("name")).toLowerCase();
  const { supabase, userId } = await getAuthenticatedClient();
  await findOrCreateTag(supabase, userId, name);
  revalidatePath("/transactions");
}

export async function deleteTag(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/transactions");
}
