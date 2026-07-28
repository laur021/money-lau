"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig, readPublicEnv } from "@/lib/validation/env";

export async function signInWithGoogle() {
  const env = readPublicEnv();
  if (!hasSupabaseConfig(env)) redirect("/login?error=configuration");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback` } });
  if (error || !data.url) redirect("/login?error=oauth_start");
  redirect(data.url);
}

export async function signOut() {
  const env = readPublicEnv();
  if (hasSupabaseConfig(env)) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
