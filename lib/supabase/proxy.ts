import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { hasSupabaseConfig, readPublicEnv } from "@/lib/validation/env";

export async function updateSession(request: NextRequest) {
  const env = readPublicEnv();
  const response = NextResponse.next({ request });
  if (!hasSupabaseConfig(env)) return response;
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value)); cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  await supabase.auth.getClaims();
  return response;
}
