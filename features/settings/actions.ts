"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { preferencesSchema } from "@/lib/validation/preferences";

async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Unauthorized");
  return { supabase, userId };
}

export async function updatePreferences(formData: FormData) {
  const value = preferencesSchema.parse(Object.fromEntries(formData));
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: value.displayName,
      default_currency: value.defaultCurrency,
      date_format: value.dateFormat,
      timezone: value.timezone,
      week_starts_on: value.weekStartsOn,
      default_dashboard_period: value.defaultDashboardPeriod,
      number_format: value.numberFormat,
      show_archived_accounts: value.showArchivedAccounts === "true" || value.showArchivedAccounts === "on",
      show_archived_categories: value.showArchivedCategories === "true" || value.showArchivedCategories === "on",
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/categories");
}

export async function updateThemePreference(formData: FormData) {
  const theme = z.enum(["light", "dark", "system"]).parse(formData.get("theme"));
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("profiles").update({ theme }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateInsightsConsent(formData: FormData) {
  const enabled = z.enum(["true", "false"]).parse(formData.get("enabled")) === "true";
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ ai_insights_consent_at: enabled ? new Date().toISOString() : null })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

const onboardingSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  defaultCurrency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  timezone: z.string().trim().min(1).max(100),
  accountName: z.string().trim().min(1).max(100),
  accountType: z.enum(["bank", "cash", "savings", "checking", "credit_card", "e_wallet", "investment", "other"]),
  openingBalance: z.coerce.number(),
  accountCurrency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  firstTransactionType: z.enum(["none", "income", "expense"]),
  firstAmount: z.string().optional().or(z.literal("")),
  firstCategoryId: z.string().uuid().optional().or(z.literal("")),
  firstDescription: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function completeOnboarding(formData: FormData) {
  const value = onboardingSchema.parse(Object.fromEntries(formData));
  const { supabase, userId } = await getUserId();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: value.displayName,
      default_currency: value.defaultCurrency,
      timezone: value.timezone,
      date_format: "MMM d, yyyy",
      week_starts_on: 1,
      default_dashboard_period: "this_month",
      number_format: "1,234.56",
      show_archived_accounts: false,
      show_archived_categories: false,
      onboarding_completed: true,
    })
    .eq("id", userId);
  if (profileError) throw new Error(profileError.message);

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: value.accountName,
      account_type: value.accountType,
      opening_balance: value.openingBalance,
      currency: value.accountCurrency,
      include_in_total: true,
      icon: "wallet",
      color: "blue",
    })
    .select("id")
    .single();
  if (accountError) throw new Error(accountError.message);

  const firstAmount = Number(value.firstAmount || 0);
  if (value.firstTransactionType !== "none" && firstAmount > 0 && value.firstCategoryId) {
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: userId,
      transaction_type: value.firstTransactionType,
      account_id: account.id,
      category_id: value.firstCategoryId,
      amount: firstAmount,
      currency: value.accountCurrency,
      status: "completed",
      description: value.firstDescription || "First MoneyLau transaction",
    });
    if (transactionError) throw new Error(transactionError.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  redirect("/dashboard");
}

export async function requestAccountDeletion(formData: FormData) {
  if (formData.get("confirmation") !== "DELETE") {
    throw new Error("Type DELETE to confirm the request.");
  }
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
