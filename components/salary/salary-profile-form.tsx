"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, Save } from "lucide-react";
import { SalaryComponentEditor } from "@/components/salary/salary-component-editor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { saveSalaryProfile } from "@/features/salary/actions";
import type { SalaryComponentInput, SalaryProfile } from "@/features/salary/types";
import { calculateSalary } from "@/lib/calculations/salary";
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

export function SalaryProfileForm({
  accounts,
  categories,
  defaultCurrency,
  profile,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  defaultCurrency: string;
  profile?: SalaryProfile;
}) {
  const initialAccount =
    accounts.find((account) => account.id === profile?.defaultAccountId) ??
    accounts.find((account) => account.currency === defaultCurrency) ??
    accounts[0];
  const [currency, setCurrency] = useState(profile?.currency ?? initialAccount?.currency ?? defaultCurrency);
  const [accountId, setAccountId] = useState(
    profile?.defaultAccountId ?? initialAccount?.id ?? "",
  );
  const [basePay, setBasePay] = useState(profile?.basePay ?? 0);
  const [components, setComponents] = useState<SalaryComponentInput[]>(
    profile?.components ?? [],
  );
  const matchingAccounts = accounts.filter(
    (account) =>
      account.currency === currency &&
      (!account.is_archived || account.id === profile?.defaultAccountId),
  );
  const calculation = useMemo(() => {
    try {
      return calculateSalary(basePay, components);
    } catch {
      return null;
    }
  }, [basePay, components]);

  const changeCurrency = (nextCurrency: string) => {
    setCurrency(nextCurrency);
    setAccountId(
      accounts.find((account) => account.currency === nextCurrency && !account.is_archived)
        ?.id ?? "",
    );
  };

  return (
    <form action={saveSalaryProfile} className="flex flex-col gap-5">
      {profile ? <input name="id" type="hidden" value={profile.id} /> : null}
      <input name="components" type="hidden" value={JSON.stringify(components)} />

      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`profile-name-${profile?.id ?? "new"}`}>Profile name</FieldLabel>
          <Input
            defaultValue={profile?.name ?? ""}
            id={`profile-name-${profile?.id ?? "new"}`}
            name="name"
            placeholder="Main salary"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`profile-employer-${profile?.id ?? "new"}`}>Employer</FieldLabel>
          <Input
            defaultValue={profile?.employerName ?? ""}
            id={`profile-employer-${profile?.id ?? "new"}`}
            name="employerName"
            placeholder="Employer or client"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`profile-job-${profile?.id ?? "new"}`}>Job title</FieldLabel>
          <Input
            defaultValue={profile?.jobTitle ?? ""}
            id={`profile-job-${profile?.id ?? "new"}`}
            name="jobTitle"
            placeholder="Optional"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`profile-frequency-${profile?.id ?? "new"}`}>
            Pay frequency
          </FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={profile?.payFrequency ?? "monthly"}
            id={`profile-frequency-${profile?.id ?? "new"}`}
            name="payFrequency"
          >
            <NativeSelectOption value="weekly">Weekly</NativeSelectOption>
            <NativeSelectOption value="biweekly">Every two weeks</NativeSelectOption>
            <NativeSelectOption value="semi_monthly">Twice a month</NativeSelectOption>
            <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`profile-currency-${profile?.id ?? "new"}`}>Currency</FieldLabel>
          <NativeSelect
            className="w-full"
            id={`profile-currency-${profile?.id ?? "new"}`}
            name="currency"
            onChange={(event) => changeCurrency(event.target.value)}
            value={currency}
          >
            {[...new Set(accounts.map((account) => account.currency))].map((accountCurrency) => (
              <NativeSelectOption key={accountCurrency} value={accountCurrency}>
                {accountCurrency}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`profile-base-${profile?.id ?? "new"}`}>Base pay per period</FieldLabel>
          <Input
            id={`profile-base-${profile?.id ?? "new"}`}
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
          <FieldLabel htmlFor={`profile-account-${profile?.id ?? "new"}`}>
            Receiving account
          </FieldLabel>
          <NativeSelect
            className="w-full"
            id={`profile-account-${profile?.id ?? "new"}`}
            name="defaultAccountId"
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
          <FieldDescription>The account must use the selected currency.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`profile-category-${profile?.id ?? "new"}`}>
            Income category
          </FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={
              profile?.defaultIncomeCategoryId ??
              categories.find((category) => category.name === "Salary")?.id ??
              categories[0]?.id ??
              ""
            }
            id={`profile-category-${profile?.id ?? "new"}`}
            name="defaultIncomeCategoryId"
            required
          >
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-medium">Default pay components</h3>
          <p className="text-xs text-muted-foreground">
            These values are copied into each new pay run and can be adjusted there.
          </p>
        </div>
        <SalaryComponentEditor
          calculatedComponents={calculation?.components}
          components={components}
          currency={currency}
          onChange={setComponents}
        />
      </div>

      <Alert>
        <BriefcaseBusiness />
        <AlertTitle>Estimated net per pay period</AlertTitle>
        <AlertDescription className="font-medium tabular-nums">
          {formatMoney(calculation?.netPay ?? 0, currency)}
        </AlertDescription>
      </Alert>

      <Button className="w-fit" disabled={!accountId || !categories.length} type="submit">
        <Save data-icon="inline-start" />
        {profile ? "Save profile" : "Create profile"}
      </Button>
    </form>
  );
}
