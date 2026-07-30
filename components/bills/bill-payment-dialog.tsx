"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { postBillPayment } from "@/features/bills/actions";
import type { BillAccountOption, BillCategoryOption, BillItem } from "@/features/bills/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function BillPaymentDialog({
  accounts,
  categories,
  item,
}: {
  accounts: BillAccountOption[];
  categories: BillCategoryOption[];
  item: BillItem;
}) {
  const [accountId, setAccountId] = useState(item.accountId ?? "");
  const matchingAccounts = useMemo(
    () => accounts.filter((account) => account.currency === item.currency && !account.is_archived),
    [accounts, item.currency],
  );
  const activeCategories = categories.filter((category) => !category.is_archived);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button aria-label={`Mark ${item.name} paid`} size="icon-sm" variant="ghost">
          <Check />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark {item.name} paid</DialogTitle>
          <DialogDescription>
            This posts a completed expense and deducts it from the selected account.
          </DialogDescription>
        </DialogHeader>
        <form action={postBillPayment} className="flex flex-col gap-5">
          <input name="id" type="hidden" value={item.id} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`bill-payment-amount-${item.id}`}>Actual paid amount</FieldLabel>
              <Input
                defaultValue={item.plannedAmount}
                id={`bill-payment-amount-${item.id}`}
                min="0.01"
                name="actualPaidAmount"
                required
                step="0.01"
                type="number"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`bill-payment-date-${item.id}`}>Payment date</FieldLabel>
              <Input
                defaultValue={today()}
                id={`bill-payment-date-${item.id}`}
                name="paymentDate"
                required
                type="date"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`bill-payment-account-${item.id}`}>Paying account</FieldLabel>
              <NativeSelect
                className="w-full"
                id={`bill-payment-account-${item.id}`}
                name="accountId"
                onChange={(event) => setAccountId(event.target.value)}
                required
                value={accountId}
              >
                <NativeSelectOption disabled value="">Select account</NativeSelectOption>
                {matchingAccounts.map((account) => (
                  <NativeSelectOption key={account.id} value={account.id}>
                    {account.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor={`bill-payment-category-${item.id}`}>Expense category</FieldLabel>
              <NativeSelect
                className="w-full"
                defaultValue={item.categoryId ?? ""}
                id={`bill-payment-category-${item.id}`}
                name="categoryId"
                required
              >
                <NativeSelectOption disabled value="">Select category</NativeSelectOption>
                {activeCategories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit">
              <Check data-icon="inline-start" />
              Post payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
