import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { completeOnboarding } from "@/features/settings/actions";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("display_name,default_currency,timezone").single();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center p-4 sm:p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Landmark className="size-5" />Set up your workspace</CardTitle>
          <CardDescription>Confirm a few defaults before recording your first financial activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeOnboarding}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="onboarding-display-name">Display name</FieldLabel>
                <Input id="onboarding-display-name" name="displayName" defaultValue={profile?.display_name ?? ""} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="onboarding-currency">Default currency</FieldLabel>
                <NativeSelect id="onboarding-currency" name="defaultCurrency" defaultValue={profile?.default_currency ?? "PHP"}>
                  <NativeSelectOption value="PHP">PHP - Philippine peso</NativeSelectOption>
                  <NativeSelectOption value="USD">USD - US dollar</NativeSelectOption>
                  <NativeSelectOption value="EUR">EUR - Euro</NativeSelectOption>
                  <NativeSelectOption value="SGD">SGD - Singapore dollar</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="onboarding-timezone">Timezone</FieldLabel>
                <NativeSelect id="onboarding-timezone" name="timezone" defaultValue={profile?.timezone ?? "Asia/Manila"}>
                  <NativeSelectOption value="Asia/Manila">Asia/Manila</NativeSelectOption>
                  <NativeSelectOption value="Asia/Singapore">Asia/Singapore</NativeSelectOption>
                  <NativeSelectOption value="Asia/Shanghai">Asia/Shanghai</NativeSelectOption>
                  <NativeSelectOption value="UTC">UTC</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Button type="submit">Open MoneyLau</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
