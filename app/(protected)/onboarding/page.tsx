import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Landmark } from "lucide-react";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const [{ data: profile }, { data: categories }] = await Promise.all([
    supabase.from("profiles").select("display_name,default_currency,timezone").single(),
    supabase
      .from("categories")
      .select("id,name,transaction_type")
      .eq("is_archived", false)
      .order("transaction_type")
      .order("display_order"),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark />
            Set up your MoneyLau workspace
          </CardTitle>
          <CardDescription>
            Four short steps establish your preferences, first account, categories, and optional
            first transaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm
            categories={
              (categories ?? []) as {
                id: string;
                name: string;
                transaction_type: "income" | "expense";
              }[]
            }
            profile={profile}
          />
        </CardContent>
      </Card>
    </main>
  );
}
