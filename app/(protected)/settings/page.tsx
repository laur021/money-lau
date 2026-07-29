import { Settings2, ShieldAlert, UserRound } from "lucide-react";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { ThemePreference } from "@/components/settings/theme-preference";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { updatePreferences } from "@/features/settings/actions";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: profile }, { data: authData }] = await Promise.all([
    supabase.from("profiles").select("display_name,default_currency,date_format,timezone,week_starts_on,theme,default_dashboard_period,deletion_requested_at").single(),
    supabase.auth.getUser(),
  ]);
  const defaults = profile ?? {
    display_name: "",
    default_currency: "PHP",
    date_format: "MMM d, yyyy",
    timezone: "Asia/Manila",
    week_starts_on: 1,
    theme: "dark",
    default_dashboard_period: "this_month",
    deletion_requested_at: null,
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Personal workspace</p>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound className="size-4" />Profile and preferences</CardTitle>
          <CardDescription>Choose the defaults MoneyLau uses for new financial activity and reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updatePreferences}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="display-name">Display name</FieldLabel>
                <Input id="display-name" name="displayName" defaultValue={defaults.display_name ?? ""} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="default-currency">Default currency</FieldLabel>
                <NativeSelect id="default-currency" name="defaultCurrency" defaultValue={defaults.default_currency}>
                  <NativeSelectOption value="PHP">PHP - Philippine peso</NativeSelectOption>
                  <NativeSelectOption value="USD">USD - US dollar</NativeSelectOption>
                  <NativeSelectOption value="EUR">EUR - Euro</NativeSelectOption>
                  <NativeSelectOption value="SGD">SGD - Singapore dollar</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                <NativeSelect id="timezone" name="timezone" defaultValue={defaults.timezone}>
                  <NativeSelectOption value="Asia/Manila">Asia/Manila</NativeSelectOption>
                  <NativeSelectOption value="Asia/Singapore">Asia/Singapore</NativeSelectOption>
                  <NativeSelectOption value="Asia/Shanghai">Asia/Shanghai</NativeSelectOption>
                  <NativeSelectOption value="UTC">UTC</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="date-format">Date format</FieldLabel>
                <NativeSelect id="date-format" name="dateFormat" defaultValue={defaults.date_format}>
                  <NativeSelectOption value="MMM d, yyyy">Jan 31, 2026</NativeSelectOption>
                  <NativeSelectOption value="dd/MM/yyyy">31/01/2026</NativeSelectOption>
                  <NativeSelectOption value="MM/dd/yyyy">01/31/2026</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="week-start">Week starts on</FieldLabel>
                <NativeSelect id="week-start" name="weekStartsOn" defaultValue={String(defaults.week_starts_on)}>
                  <NativeSelectOption value="1">Monday</NativeSelectOption>
                  <NativeSelectOption value="0">Sunday</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="dashboard-period">Default dashboard period</FieldLabel>
                <NativeSelect id="dashboard-period" name="defaultDashboardPeriod" defaultValue={defaults.default_dashboard_period}>
                  <NativeSelectOption value="this_month">This month</NativeSelectOption>
                  <NativeSelectOption value="last_month">Last month</NativeSelectOption>
                  <NativeSelectOption value="this_year">This year</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Button type="submit">Save preferences</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings2 className="size-4" />Appearance</CardTitle>
          <CardDescription>Use the built-in shadcn theme tokens in dark, light, or system mode.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field orientation="responsive">
            <FieldLabel htmlFor="theme-preference">Theme</FieldLabel>
            <ThemePreference defaultTheme={defaults.theme as "light" | "dark" | "system"} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="size-4" />Account and data</CardTitle>
          <CardDescription>Signed in as {authData.user?.email ?? "your Google account"}.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {defaults.deletion_requested_at ? <Badge variant="destructive">Deletion request pending</Badge> : null}
          <FieldDescription>Financial records can be exported from Reports before requesting removal.</FieldDescription>
          <div><DeleteAccountDialog /></div>
        </CardContent>
      </Card>
    </main>
  );
}
