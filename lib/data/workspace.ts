import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Shares the profile and account reads between the protected layout and a
 * child server page during one render request. React clears this cache after
 * the request, so financial data is never retained across users or requests.
 */
export const getWorkspaceData = cache(async () => {
  const supabase = await createClient();
  const [{ data: profile, error: profileError }, { data: accounts, error: accountsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name,avatar_url,default_currency,ai_insights_consent_at,default_dashboard_period,week_starts_on",
        )
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("id,name,institution_name,currency,account_type,include_in_total,is_archived,color")
        .eq("is_archived", false)
        .order("display_order")
        .order("name"),
    ]);

  if (profileError) throw new Error(profileError.message);
  if (accountsError) throw new Error(accountsError.message);

  return { profile, accounts: accounts ?? [] };
});
