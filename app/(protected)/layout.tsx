import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig, readPublicEnv } from "@/lib/validation/env";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const env = readPublicEnv();
  if (!hasSupabaseConfig(env)) redirect("/login?error=configuration");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  return <AppShell>{children}</AppShell>;
}

