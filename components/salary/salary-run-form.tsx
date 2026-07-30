"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Save } from "lucide-react";
import { SalaryComponentEditor } from "@/components/salary/salary-component-editor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveSalaryRun } from "@/features/salary/actions";
import type {
  SalaryComponentInput,
  SalaryProfile,
  SalaryRun,
} from "@/features/salary/types";
import { calculateSalary, getSalaryPeriodDefaults } from "@/lib/calculations/salary";
import { formatMoney } from "@/lib/formatting/money";

type AccountOption = {
  id: string;
  name: string;
  currency: string;
  is_archived?: boolean;
};

type CategoryOption = {
  id: string;
  name: string;
  is_archived?: boolean;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function SalaryRunForm({
  accounts,
  categories,
  initialProfileId,
  profiles,
  run,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  initialProfileId?: string;
  profiles: SalaryProfile[];
  run?: SalaryRun;
}) {
  const firstProfile =
    profiles.find((profile) => profile.id === (run?.profileId ?? initialProfileId)) ??
    profiles[0];
  const initialDates = getSalaryPeriodDefaults(
    firstProfile?.payFrequency ?? "monthly",
    run?.paymentDate ?? today(),
  );
  const [profileId, setProfileId] = useState(run?.profileId ?? firstProfile?.id ?? "");
  const [accountId, setAccountId] = useState(
    run?.accountId ?? firstProfile?.defaultAccountId ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    run?.incomeCategoryId ?? firstProfile?.defaultIncomeCategoryId ?? "",
  );
  const [basePay, setBasePay] = useState(run?.basePay ?? firstProfile?.basePay ?? 0);
  const [components, setComponents] = useState<SalaryComponentInput[]>(
    run?.components ?? firstProfile?.components ?? [],
  );
  const [paymentDate, setPaymentDate] = useState(run?.paymentDate ?? initialDates.paymentDate);
  const [payPeriodStart, setPayPeriodStart] = useState(
    run?.payPeriodStart ?? initialDates.payPeriodStart,
  );
  const [payPeriodEnd, setPayPeriodEnd] = useState(
    run?.payPeriodEnd ?? initialDates.payPeriodEnd,
  );
  const selectedProfile = profiles.find((profile) => profile.id === profileId) ?? firstProfile;
  const matchingAccounts = accounts.filter(
    (account) =>
      account.currency === selectedProfile?.currency &&
      (!account.is_archived || account.id === run?.accountId),
  );
  const calculation = useMemo(() => {
    try {
      return calculateSalary(basePay, components);
    } catch {
      return null;
    }
  }, [basePay, components]);

  const changeProfile = (nextProfileId: string) => {
    const profile = profiles.find((item) => item.id === nextProfileId);
    if (!profile) return;
    setProfileId(profile.id);
    setAccountId(profile.defaultAccountId);
    setCategoryId(profile.defaultIncomeCategoryId);
    setBasePay(profile.basePay);
    setComponents(profile.components.map((component) => ({ ...component })));
    const dates = getSalaryPeriodDefaults(profile.payFrequency, paymentDate);
    setPayPeriodStart(dates.payPeriodStart);
    setPayPeriodEnd(dates.payPeriodEnd);
  };

  const changePaymentDate = (nextDate: string) => {
    setPaymentDate(nextDate);
    if (!nextDate || !selectedProfile) return;
    const dates = getSalaryPeriodDefaults(selectedProfile.payFrequency, nextDate);
    setPayPeriodStart(dates.payPeriodStart);
    setPayPeriodEnd(dates.payPeriodEnd);
  };

  return (
    <form action={saveSalaryRun} className="flex flex-col gap-6">
      {run ? <input name="id" type="hidden" value={run.id} /> : null}
      <input name="components" type="hidden" value={JSON.stringify(components)} />

      <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="salary-run-profile">Salary profile</FieldLabel>
          <NativeSelect
            className="w-full"
            disabled={Boolean(run)}
            id="salary-run-profile"
            name="profileId"
            onChange={(event) => changeProfile(event.target.value)}
            value={profileId}
          >
            {profiles.map((profile) => (
              <NativeSelectOption key={profile.id} value={profile.id}>
                {profile.name} - {profile.employerName}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {run ? <input name="profileId" type="hidden" value={profileId} /> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="salary-run-base">Base pay</FieldLabel>
          <Input
            id="salary-run-base"
            min="0"
            name="basePay"
            onChange={(event) => setBasePay(Number(event.target.value) || 0)}
            required
            step="0.01"
            type="number"
            value={basePay}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="salary-run-account">Receiving account</FieldLabel>
          <NativeSelect
            className="w-full"
            id="salary-run-account"
            name="accountId"
            onChange={(event) => setAccountId(event.target.value)}
            required
            value={accountId}
          >
            <NativeSelectOption disabled value="">
              Select account
            </NativeSelectOption>
            {matchingAccounts.map((account) => (
              <NativeSelectOption key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="salary-run-category">Income category</FieldLabel>
          <NativeSelect
            className="w-full"
            id="salary-run-category"
            name="incomeCategoryId"
            onChange={(event) => setCategoryId(event.target.value)}
            required
            value={categoryId}
          >
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="salary-run-payment-date">Payment date</FieldLabel>
          <Input
            id="salary-run-payment-date"
            name="paymentDate"
            onChange={(event) => changePaymentDate(event.target.value)}
            required
            type="date"
            value={paymentDate}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="salary-run-period-start">Pay period start</FieldLabel>
          <Input
            id="salary-run-period-start"
            name="payPeriodStart"
            onChange={(event) => setPayPeriodStart(event.target.value)}
            required
            type="date"
            value={payPeriodStart}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="salary-run-period-end">Pay period end</FieldLabel>
          <Input
            id="salary-run-period-end"
            name="payPeriodEnd"
            onChange={(event) => setPayPeriodEnd(event.target.value)}
            required
            type="date"
            value={payPeriodEnd}
          />
          <FieldDescription>You can adjust the suggested period before saving.</FieldDescription>
        </Field>
        <Field className="md:col-span-2 xl:col-span-3">
          <FieldLabel htmlFor="salary-run-notes">Notes</FieldLabel>
          <Textarea
            defaultValue={run?.notes ?? ""}
            id="salary-run-notes"
            name="notes"
            placeholder="Optional payslip notes"
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-medium">Earnings and deductions</h2>
          <p className="text-xs text-muted-foreground">
            Adjust this pay period without changing the reusable profile.
          </p>
        </div>
        <SalaryComponentEditor
          calculatedComponents={calculation?.components}
          components={components}
          currency={selectedProfile?.currency ?? "PHP"}
          onChange={setComponents}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Gross pay</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold tabular-nums">
            {formatMoney(calculation?.grossPay ?? 0, selectedProfile?.currency ?? "PHP")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Deductions</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold tabular-nums">
            {formatMoney(
              calculation?.totalDeductions ?? 0,
              selectedProfile?.currency ?? "PHP",
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Net pay</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold tabular-nums">
            {formatMoney(calculation?.netPay ?? 0, selectedProfile?.currency ?? "PHP")}
          </CardContent>
        </Card>
      </div>

      {!calculation ? (
        <Alert variant="destructive">
          <CalendarDays />
          <AlertTitle>Check the salary values</AlertTitle>
          <AlertDescription>
            Deductions cannot exceed gross pay and all component values must be non-negative.
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        className="w-fit"
        disabled={!calculation || !profileId || !accountId || !categoryId}
        type="submit"
      >
        <Save data-icon="inline-start" />
        {run ? "Save draft" : "Save salary draft"}
      </Button>
    </form>
  );
}
