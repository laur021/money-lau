import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { InsightsConsentControl } from "@/components/settings/insights-consent-control";
import { ThemePreference } from "@/components/settings/theme-preference";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { updatePreferences } from "@/features/settings/actions";
import { createClient } from "@/lib/supabase/server";
import { Settings2, ShieldAlert, UserRound } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: profile }, { data: authData }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name,avatar_url,default_currency,date_format,timezone,week_starts_on,theme,default_dashboard_period,number_format,show_archived_accounts,show_archived_categories,deletion_requested_at,ai_insights_consent_at"
      )
      .single(),
    supabase.auth.getUser(),
  ]);
  const defaults = profile ?? {
    display_name: "",
    avatar_url: null,
    default_currency: "PHP",
    date_format: "MMM d, yyyy",
    timezone: "Asia/Manila",
    week_starts_on: 1,
    theme: "dark",
    default_dashboard_period: "this_month",
    number_format: "1,234.56",
    show_archived_accounts: false,
    show_archived_categories: false,
    deletion_requested_at: null,
    ai_insights_consent_at: null,
  };
  const initials = String(defaults.display_name || authData.user?.email || "ML")
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Profile, defaults, and data controls</p>
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage
                alt={defaults.display_name || "MoneyLau user"}
                src={defaults.avatar_url ?? undefined}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <UserRound />
                Profile and preferences
              </CardTitle>
              <CardDescription>{authData.user?.email ?? "Google account"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form action={updatePreferences}>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="display-name">Display name</FieldLabel>
                <Input
                  defaultValue={defaults.display_name ?? ""}
                  id="display-name"
                  name="displayName"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input id="email" readOnly value={authData.user?.email ?? ""} />
                <FieldDescription>Managed by your Google account.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="default-currency">Default currency</FieldLabel>
                <Input
                  defaultValue={defaults.default_currency}
                  id="default-currency"
                  maxLength={3}
                  name="defaultCurrency"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                <NativeSelect
                  className="w-full"
                  defaultValue={defaults.timezone}
                  id="timezone"
                  name="timezone"
                >
                  <NativeSelectOption value="Asia/Manila">Asia/Manila</NativeSelectOption>
                  <NativeSelectOption value="Asia/Singapore">Asia/Singapore</NativeSelectOption>
                  <NativeSelectOption value="Asia/Shanghai">Asia/Shanghai</NativeSelectOption>
                  <NativeSelectOption value="UTC">UTC</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="date-format">Date format</FieldLabel>
                <NativeSelect
                  className="w-full"
                  defaultValue={defaults.date_format}
                  id="date-format"
                  name="dateFormat"
                >
                  <NativeSelectOption value="MMM d, yyyy">Jan 31, 2026</NativeSelectOption>
                  <NativeSelectOption value="dd/MM/yyyy">31/01/2026</NativeSelectOption>
                  <NativeSelectOption value="MM/dd/yyyy">01/31/2026</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="week-start">Week starts on</FieldLabel>
                <NativeSelect
                  className="w-full"
                  defaultValue={String(defaults.week_starts_on)}
                  id="week-start"
                  name="weekStartsOn"
                >
                  <NativeSelectOption value="1">Monday</NativeSelectOption>
                  <NativeSelectOption value="0">Sunday</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="dashboard-period">Default dashboard period</FieldLabel>
                <NativeSelect
                  className="w-full"
                  defaultValue={defaults.default_dashboard_period}
                  id="dashboard-period"
                  name="defaultDashboardPeriod"
                >
                  <NativeSelectOption value="today">Today</NativeSelectOption>
                  <NativeSelectOption value="this_week">This week</NativeSelectOption>
                  <NativeSelectOption value="this_month">This month</NativeSelectOption>
                  <NativeSelectOption value="last_month">Last month</NativeSelectOption>
                  <NativeSelectOption value="this_year">This year</NativeSelectOption>
                  <NativeSelectOption value="custom">Custom range</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel>Number format</FieldLabel>
                <Input readOnly value="1,234.56" />
                <FieldDescription>
                  MoneyLau uses comma-separated thousands throughout the app.
                </FieldDescription>
                <input name="numberFormat" type="hidden" value="1,234.56" />
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  defaultChecked={defaults.show_archived_accounts}
                  id="show-archived-accounts"
                  name="showArchivedAccounts"
                  value="true"
                />
                <FieldContent>
                  <FieldLabel htmlFor="show-archived-accounts">Show archived accounts</FieldLabel>
                  <FieldDescription>
                    Include archived accounts on the Accounts page.
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  defaultChecked={defaults.show_archived_categories}
                  id="show-archived-categories"
                  name="showArchivedCategories"
                  value="true"
                />
                <FieldContent>
                  <FieldLabel htmlFor="show-archived-categories">
                    Show archived categories
                  </FieldLabel>
                  <FieldDescription>
                    Include archived categories on the Categories page.
                  </FieldDescription>
                </FieldContent>
              </Field>
              <Button className="w-fit" type="submit">
                Save preferences
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 />
            MoneyLau Insights
          </CardTitle>
          <CardDescription>
            Control whether MoneyLau may send selected financial summaries to DeepSeek for read-only budgeting guidance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InsightsConsentControl defaultEnabled={Boolean(defaults.ai_insights_consent_at)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose light, dark, or system appearance using the MoneyLau shadcn theme.
          </CardDescription>
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
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert />
            Account and data
          </CardTitle>
          <CardDescription>
            Export your records from Reports before requesting account removal.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {defaults.deletion_requested_at ? (
            <Badge variant="destructive">Deletion request pending</Badge>
          ) : null}
          <FieldDescription>
            Deletion requests are recorded for secure administrative processing; privileged database
            credentials are never shipped to your browser.
          </FieldDescription>
          <div>
            <DeleteAccountDialog />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
