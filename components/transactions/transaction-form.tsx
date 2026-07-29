"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { createTransaction } from "@/features/transactions/actions";

type Account = { id: string; name: string; currency: string };
type Category = { id: string; name: string; transaction_type: "income" | "expense" };

export function TransactionForm({ accounts, categories }: { accounts: Account[]; categories: Category[] }) {
  const [transactionType, setTransactionType] = useState<"income" | "expense" | "transfer">("expense");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const sourceAccount = useMemo(() => accounts.find((account) => account.id === accountId), [accountId, accounts]);
  const matchingAccounts = accounts.filter((account) => account.currency === sourceAccount?.currency);
  const matchingCategories = categories.filter((category) => category.transaction_type === transactionType);
  const needsCategory = transactionType !== "transfer";
  const canSubmit = Boolean(sourceAccount && (!needsCategory || matchingCategories.length));

  return (
    <form action={createTransaction}>
      <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="transaction-type">Transaction type</FieldLabel>
          <NativeSelect className="w-full" id="transaction-type" name="transactionType" value={transactionType} onChange={(event) => setTransactionType(event.target.value as "income" | "expense" | "transfer")}>
            <NativeSelectOption value="expense">Expense</NativeSelectOption>
            <NativeSelectOption value="income">Income</NativeSelectOption>
            <NativeSelectOption value="transfer">Transfer</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="source-account">Source account</FieldLabel>
          <NativeSelect className="w-full" id="source-account" name="accountId" required value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            {accounts.length ? accounts.map((account) => <NativeSelectOption key={account.id} value={account.id}>{account.name} ({account.currency})</NativeSelectOption>) : <NativeSelectOption value="">No active accounts</NativeSelectOption>}
          </NativeSelect>
        </Field>
        {transactionType === "transfer" ? (
          <Field>
            <FieldLabel htmlFor="destination-account">Destination account</FieldLabel>
            <NativeSelect className="w-full" id="destination-account" name="destinationAccountId" required defaultValue={matchingAccounts.find((account) => account.id !== accountId)?.id ?? ""}>
              <NativeSelectOption value="" disabled>Select destination</NativeSelectOption>
              {matchingAccounts.filter((account) => account.id !== accountId).map((account) => <NativeSelectOption key={account.id} value={account.id}>{account.name} ({account.currency})</NativeSelectOption>)}
            </NativeSelect>
            <FieldDescription>Only accounts in {sourceAccount?.currency ?? "the same currency"} are available.</FieldDescription>
          </Field>
        ) : (
          <Field>
            <FieldLabel htmlFor="transaction-category">Category</FieldLabel>
            <NativeSelect className="w-full" id="transaction-category" name="categoryId" required defaultValue={matchingCategories[0]?.id ?? ""}>
              {matchingCategories.length ? matchingCategories.map((category) => <NativeSelectOption key={category.id} value={category.id}>{category.name}</NativeSelectOption>) : <NativeSelectOption value="">No matching categories</NativeSelectOption>}
            </NativeSelect>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="transaction-amount">Amount</FieldLabel>
          <Input id="transaction-amount" name="amount" required min="0.01" step="0.01" type="number" />
        </Field>
        <Field>
          <FieldLabel htmlFor="transaction-currency">Currency</FieldLabel>
          <Input id="transaction-currency" name="currency" readOnly value={sourceAccount?.currency ?? ""} />
        </Field>
        <Field>
          <FieldLabel htmlFor="transaction-date">Transaction date</FieldLabel>
          <Input id="transaction-date" name="transactionDate" type="date" />
        </Field>
        <Field>
          <FieldLabel htmlFor="transaction-status">Status</FieldLabel>
          <NativeSelect className="w-full" id="transaction-status" name="status" defaultValue="completed">
            <NativeSelectOption value="completed">Completed</NativeSelectOption>
            <NativeSelectOption value="pending">Pending</NativeSelectOption>
            <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="merchant">Merchant</FieldLabel>
          <Input id="merchant" name="merchant" placeholder="Optional" />
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Input id="description" name="description" placeholder="Optional note" />
        </Field>
        <Button className="w-fit" disabled={!canSubmit} type="submit"><Plus data-icon="inline-start" />Add transaction</Button>
      </FieldGroup>
    </form>
  );
}
