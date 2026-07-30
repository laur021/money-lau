"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveBillTemplate } from "@/features/bills/actions";
import type { BillAccountOption, BillCategoryOption, BillTemplate } from "@/features/bills/types";

export function BillTemplateForm({
  accounts,
  categories,
  defaultCurrency,
  template,
}: {
  accounts: BillAccountOption[];
  categories: BillCategoryOption[];
  defaultCurrency: string;
  template?: BillTemplate;
}) {
  const [currency, setCurrency] = useState(template?.currency ?? defaultCurrency);
  const [accountId, setAccountId] = useState(template?.defaultAccountId ?? "");
  const matchingAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.currency === currency &&
          (!account.is_archived || account.id === template?.defaultAccountId),
      ),
    [accounts, currency, template?.defaultAccountId],
  );
  const currencies = [...new Set(accounts.map((account) => account.currency))];

  return (
    <form action={saveBillTemplate} className="flex flex-col gap-5">
      {template ? <input name="id" type="hidden" value={template.id} /> : null}
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`bill-template-name-${template?.id ?? "new"}`}>Bill name</FieldLabel>
          <Input
            defaultValue={template?.name ?? ""}
            id={`bill-template-name-${template?.id ?? "new"}`}
            name="name"
            placeholder="St. Peter insurance"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`bill-template-amount-${template?.id ?? "new"}`}>
            Planned amount
          </FieldLabel>
          <Input
            defaultValue={template?.defaultAmount ?? ""}
            id={`bill-template-amount-${template?.id ?? "new"}`}
            min="0.01"
            name="defaultAmount"
            required
            step="0.01"
            type="number"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`bill-template-due-day-${template?.id ?? "new"}`}>
            Due day
          </FieldLabel>
          <Input
            defaultValue={template?.dueDay ?? 1}
            id={`bill-template-due-day-${template?.id ?? "new"}`}
            max="31"
            min="1"
            name="dueDay"
            required
            type="number"
          />
          <FieldDescription>Short months use their final day.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`bill-template-currency-${template?.id ?? "new"}`}>
            Currency
          </FieldLabel>
          <NativeSelect
            className="w-full"
            id={`bill-template-currency-${template?.id ?? "new"}`}
            name="currency"
            onChange={(event) => {
              setCurrency(event.target.value);
              setAccountId("");
            }}
            value={currency}
          >
            {[...new Set([defaultCurrency, ...currencies])].map((value) => (
              <NativeSelectOption key={value} value={value}>
                {value}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`bill-template-account-${template?.id ?? "new"}`}>
            Default paying account
          </FieldLabel>
          <NativeSelect
            className="w-full"
            id={`bill-template-account-${template?.id ?? "new"}`}
            name="defaultAccountId"
            onChange={(event) => setAccountId(event.target.value)}
            value={accountId}
          >
            <NativeSelectOption value="">Choose when paid</NativeSelectOption>
            {matchingAccounts.map((account) => (
              <NativeSelectOption key={account.id} value={account.id}>
                {account.name}{account.is_archived ? " - archived" : ""}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`bill-template-category-${template?.id ?? "new"}`}>
            Default expense category
          </FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={template?.defaultCategoryId ?? ""}
            id={`bill-template-category-${template?.id ?? "new"}`}
            name="defaultCategoryId"
          >
            <NativeSelectOption value="">Choose when paid</NativeSelectOption>
            {categories
              .filter((category) => !category.is_archived || category.id === template?.defaultCategoryId)
              .map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}{category.is_archived ? " - archived" : ""}
              </NativeSelectOption>
              ))}
          </NativeSelect>
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel htmlFor={`bill-template-notes-${template?.id ?? "new"}`}>Note</FieldLabel>
          <Textarea
            defaultValue={template?.notes ?? ""}
            id={`bill-template-notes-${template?.id ?? "new"}`}
            name="notes"
            placeholder="Optional reminder or payment instructions"
          />
        </Field>
      </FieldGroup>
      <Button className="w-fit" type="submit">
        <Save data-icon="inline-start" />
        {template ? "Save template" : "Create template"}
      </Button>
    </form>
  );
}
