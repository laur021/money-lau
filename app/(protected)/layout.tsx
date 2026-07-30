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
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,avatar_url")
    .eq("id", data.claims.sub)
    .maybeSingle();
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
        displayName: profile?.display_name || metadataName || "MoneyLau user",
        email,
      }}
    >
      {children}
    </AppShell>
  );
}

