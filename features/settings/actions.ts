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
  const { error } = await supabase.from("profiles").update({
    display_name: value.displayName,
    default_currency: value.defaultCurrency,
    date_format: value.dateFormat,
    timezone: value.timezone,
    week_starts_on: value.weekStartsOn,
    default_dashboard_period: value.defaultDashboardPeriod,
  }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateThemePreference(formData: FormData) {
  const theme = z.enum(["light", "dark", "system"]).parse(formData.get("theme"));
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("profiles").update({ theme }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function completeOnboarding(formData: FormData) {
  formData.set("dateFormat", "MMM d, yyyy");
  formData.set("weekStartsOn", "1");
  formData.set("defaultDashboardPeriod", "this_month");
  await updatePreferences(formData);
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function requestAccountDeletion(formData: FormData) {
  if (formData.get("confirmation") !== "DELETE") {
    throw new Error("Type DELETE to confirm the request.");
  }
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("profiles").update({ deletion_requested_at: new Date().toISOString() }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
