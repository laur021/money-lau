"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveBillItem } from "@/features/bills/actions";
import type { BillAccountOption, BillCategoryOption, BillItem } from "@/features/bills/types";
import { dueDateForMonth } from "@/lib/calculations/bills";

export function BillItemForm({
  accounts,
  categories,
  defaultCurrency,
  plannerMonth,
  item,
}: {
  accounts: BillAccountOption[];
  categories: BillCategoryOption[];
  defaultCurrency: string;
  plannerMonth: string;
  item?: BillItem;
}) {
  const [currency, setCurrency] = useState(item?.currency ?? defaultCurrency);
  const [accountId, setAccountId] = useState(item?.accountId ?? "");
  const matchingAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.currency === currency && (!account.is_archived || account.id === item?.accountId),
      ),
    [accounts, currency, item?.accountId],
  );

  return (
    <form action={saveBillItem} className="flex flex-col gap-5">
      {item ? <input name="id" type="hidden" value={item.id} /> : null}
      <input name="plannerMonth" type="hidden" value={plannerMonth} />
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`bill-item-name-${item?.id ?? "new"}`}>Bill name</FieldLabel>
          <Input
            defaultValue={item?.name ?? ""}
            id={`bill-item-name-${item?.id ?? "new"}`}
            name="name"
            placeholder="Internet bill"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`bill-item-amount-${item?.id ?? "new"}`}>Planned amount</FieldLabel>
          <Input
            defaultValue={item?.plannedAmount ?? ""}
            id={`bill-item-amount-${item?.id ?? "new"}`}
            min="0.01"
            name="plannedAmount"
            required
            step="0.01"
            type="number"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`bill-item-due-${item?.id ?? "new"}`}>Due date</FieldLabel>
          <Input
            defaultValue={item?.dueDate ?? dueDateForMonth(plannerMonth, 1)}
            id={`bill-item-due-${item?.id ?? "new"}`}
            name="dueDate"
            required
            type="date"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`bill-item-coverage-${item?.id ?? "new"}`}>Covered month</FieldLabel>
          <Input
            defaultValue={item?.coverageMonth.slice(0, 7) ?? plannerMonth}
            id={`bill-item-coverage-${item?.id ?? "new"}`}
            name="coverageMonth"
            required
            type="month"
          />
          <FieldDescription>Choose a later month for an advance payment.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`bill-item-currency-${item?.id ?? "new"}`}>Currency</FieldLabel>
          <NativeSelect
            className="w-full"
            id={`bill-item-currency-${item?.id ?? "new"}`}
            name="currency"
            onChange={(event) => {
              setCurrency(event.target.value);
              setAccountId("");
            }}
            value={currency}
          >
            {[...new Set([defaultCurrency, ...accounts.map((account) => account.currency)])].map(
              (value) => (
                <NativeSelectOption key={value} value={value}>
                  {value}
                </NativeSelectOption>
              ),
            )}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`bill-item-account-${item?.id ?? "new"}`}>Paying account</FieldLabel>
          <NativeSelect
            className="w-full"
            id={`bill-item-account-${item?.id ?? "new"}`}
            name="accountId"
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
          <FieldLabel htmlFor={`bill-item-category-${item?.id ?? "new"}`}>Expense category</FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={item?.categoryId ?? ""}
            id={`bill-item-category-${item?.id ?? "new"}`}
            name="categoryId"
          >
            <NativeSelectOption value="">Choose when paid</NativeSelectOption>
            {categories
              .filter((category) => !category.is_archived || category.id === item?.categoryId)
              .map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}{category.is_archived ? " - archived" : ""}
              </NativeSelectOption>
              ))}
          </NativeSelect>
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel htmlFor={`bill-item-notes-${item?.id ?? "new"}`}>Note</FieldLabel>
          <Textarea
            defaultValue={item?.notes ?? ""}
            id={`bill-item-notes-${item?.id ?? "new"}`}
            name="notes"
            placeholder="Optional reminder or payment details"
          />
        </Field>
      </FieldGroup>
      <Button className="w-fit" type="submit">
        {item ? <Pencil data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
        {item ? "Save bill" : "Add bill"}
      </Button>
    </form>
  );
}
