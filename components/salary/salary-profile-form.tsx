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
import type {
  SalaryComponentInput,
  SalaryContributionAllocation,
  SalaryPayFrequency,
  SalaryProfile,
} from "@/features/salary/types";
import {
  getDefaultGovernmentAllocation,
  getMonthlySalaryBasis,
} from "@/lib/calculations/ph-government-contributions";
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
  const [payFrequency, setPayFrequency] = useState<SalaryPayFrequency>(
    profile?.payFrequency ?? "monthly",
  );
  const initialMonthlyBasis =
    profile?.monthlyBasicSalary ??
    getMonthlySalaryBasis(profile?.basePay ?? 0, profile?.payFrequency ?? "monthly");
  const [monthlyBasicSalary, setMonthlyBasicSalary] = useState(initialMonthlyBasis);
  const [monthlyCompensation, setMonthlyCompensation] = useState(
    profile?.monthlyCompensation ?? initialMonthlyBasis,
  );
  const [governmentAllocation, setGovernmentAllocation] =
    useState<SalaryContributionAllocation>(
      profile?.governmentContributionAllocation ??
        getDefaultGovernmentAllocation(profile?.payFrequency ?? "monthly"),
    );
  const [basicSalaryEdited, setBasicSalaryEdited] = useState(Boolean(profile));
  const [compensationEdited, setCompensationEdited] = useState(Boolean(profile));
  const [components, setComponents] = useState<SalaryComponentInput[]>(
    profile?.components ?? [],
  );
  const matchingAccounts = accounts.filter(
    (account) =>
      account.currency === currency &&
      (!account.is_archived || account.id === profile?.defaultAccountId),
  );
  const hasGovernmentPresets = components.some(
    (component) => component.calculationType === "government_preset",
  );
  const previewDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const governmentContext = useMemo(
    () => ({
      currency,
      paymentDate: previewDate,
      monthlyBasicSalary,
      monthlyCompensation,
      allocation: governmentAllocation,
    }),
    [
      currency,
      governmentAllocation,
      monthlyBasicSalary,
      monthlyCompensation,
      previewDate,
    ],
  );
  const calculation = useMemo(() => {
    try {
      return calculateSalary(basePay, components, governmentContext);
    } catch {
      return null;
    }
  }, [
    basePay,
    components,
    governmentContext,
  ]);

  const changeCurrency = (nextCurrency: string) => {
    setCurrency(nextCurrency);
    if (nextCurrency !== "PHP") {
      setComponents((current) =>
        current.filter(
          (component) => component.calculationType !== "government_preset",
        ),
      );
    }
    setAccountId(
      accounts.find((account) => account.currency === nextCurrency && !account.is_archived)
        ?.id ?? "",
    );
  };

  const changeBasePay = (nextBasePay: number) => {
    setBasePay(nextBasePay);
    const nextMonthlyBasis = getMonthlySalaryBasis(nextBasePay, payFrequency);
    if (!basicSalaryEdited) setMonthlyBasicSalary(nextMonthlyBasis);
    if (!compensationEdited) setMonthlyCompensation(nextMonthlyBasis);
  };

  const changePayFrequency = (nextFrequency: SalaryPayFrequency) => {
    setPayFrequency(nextFrequency);
    const nextMonthlyBasis = getMonthlySalaryBasis(basePay, nextFrequency);
    if (!basicSalaryEdited) setMonthlyBasicSalary(nextMonthlyBasis);
    if (!compensationEdited) setMonthlyCompensation(nextMonthlyBasis);
    setGovernmentAllocation(getDefaultGovernmentAllocation(nextFrequency));
  };

  return (
    <form action={saveSalaryProfile} className="flex flex-col gap-5">
      {profile ? <input name="id" type="hidden" value={profile.id} /> : null}
      <input name="components" type="hidden" value={JSON.stringify(components)} />
      {!hasGovernmentPresets ? (
        <>
          <input
            name="monthlyBasicSalary"
            type="hidden"
            value={monthlyBasicSalary}
          />
          <input
            name="monthlyCompensation"
            type="hidden"
            value={monthlyCompensation}
          />
          <input
            name="governmentContributionAllocation"
            type="hidden"
            value={governmentAllocation}
          />
        </>
      ) : null}

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
            id={`profile-frequency-${profile?.id ?? "new"}`}
            name="payFrequency"
            onChange={(event) =>
              changePayFrequency(event.target.value as SalaryPayFrequency)
            }
            value={payFrequency}
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
            onChange={(event) =>
              changeBasePay(Number(event.target.value) || 0)
            }
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

      {hasGovernmentPresets ? (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-medium">Contribution settings</h3>
            <p className="text-xs text-muted-foreground">
              These monthly bases and allocation are used by the PH presets.
            </p>
          </div>
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor={`profile-monthly-basic-${profile?.id ?? "new"}`}>
                Monthly basic salary
              </FieldLabel>
              <Input
                id={`profile-monthly-basic-${profile?.id ?? "new"}`}
                min="0"
                name="monthlyBasicSalary"
                onChange={(event) => {
                  setBasicSalaryEdited(true);
                  setMonthlyBasicSalary(Number(event.target.value) || 0);
                }}
                required
                step="0.01"
                type="number"
                value={monthlyBasicSalary}
              />
              <FieldDescription>Used for PhilHealth.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`profile-monthly-comp-${profile?.id ?? "new"}`}>
                Monthly compensation
              </FieldLabel>
              <Input
                id={`profile-monthly-comp-${profile?.id ?? "new"}`}
                min="0"
                name="monthlyCompensation"
                onChange={(event) => {
                  setCompensationEdited(true);
                  setMonthlyCompensation(Number(event.target.value) || 0);
                }}
                required
                step="0.01"
                type="number"
                value={monthlyCompensation}
              />
              <FieldDescription>Used for SSS and Pag-IBIG.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={`profile-allocation-${profile?.id ?? "new"}`}>
                Default allocation
              </FieldLabel>
              <NativeSelect
                className="w-full"
                id={`profile-allocation-${profile?.id ?? "new"}`}
                name="governmentContributionAllocation"
                onChange={(event) =>
                  setGovernmentAllocation(
                    event.target.value as SalaryContributionAllocation,
                  )
                }
                value={governmentAllocation}
              >
                <NativeSelectOption value="full">Full monthly amount</NativeSelectOption>
                <NativeSelectOption value="half">Half monthly amount</NativeSelectOption>
                <NativeSelectOption value="quarter">
                  Quarter monthly amount
                </NativeSelectOption>
              </NativeSelect>
            </Field>
          </FieldGroup>
        </div>
      ) : null}

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
          governmentContext={governmentContext}
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
