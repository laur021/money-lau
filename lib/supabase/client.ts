import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseConfig, readPublicEnv } from "@/lib/validation/env";

export function createClient() {
  const env = readPublicEnv();
  if (!hasSupabaseConfig(env)) throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
