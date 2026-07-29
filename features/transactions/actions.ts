"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const optionalText = z.string().trim().max(500).optional().or(z.literal(""));
const schema = z.object({
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
});

export async function createTransaction(formData: FormData) {
  const value = schema.parse(Object.fromEntries(formData));
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) throw new Error("Unauthorized");
  const { error } = await supabase.from("transactions").insert({
    user_id: data.claims.sub,
    transaction_type: value.transactionType,
    account_id: value.accountId,
    destination_account_id: value.destinationAccountId || null,
    category_id: value.categoryId || null,
    amount: value.amount,
    currency: value.currency,
    status: value.status,
    transaction_date: value.transactionDate || undefined,
    description: value.description || null,
    merchant: value.merchant || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}
