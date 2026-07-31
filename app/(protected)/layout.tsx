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
  const [{ data: profile }, { data: accounts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,avatar_url,default_currency,ai_insights_consent_at")
      .eq("id", data.claims.sub)
      .maybeSingle(),
    supabase
      .from("accounts")
      .select("currency")
      .eq("is_archived", false),
  ]);
  const defaultCurrency = profile?.default_currency ?? "PHP";
  const insightCurrencies = Array.from(
    new Set([defaultCurrency, ...(accounts ?? []).map((account) => account.currency)]),
  ).sort();
  const metadata =
    typeof data.claims.user_metadata === "object" &&
    data.claims.user_metadata !== null
      ? (data.claims.user_metadata as Record<string, unknown>)
      : {};
  const email =
    typeof data.claims.email === "string" ? data.claims.email : "";
  const metadataName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : "";
  const metadataAvatar =
    typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

  return (
    <AppShell
      user={{
        avatarUrl: profile?.avatar_url ?? metadataAvatar,
        defaultCurrency,
        displayName: profile?.display_name || metadataName || "MoneyLau user",
        email,
        hasInsightsConsent: Boolean(profile?.ai_insights_consent_at),
        insightCurrencies,
      }}
    >
      {children}
    </AppShell>
  );
}

