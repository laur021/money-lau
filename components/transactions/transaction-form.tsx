"use client";

import { Button } from "@/components/ui/button";
import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { IonicDateInput } from "@/components/ionic/ionic-date-input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { createTransaction, updateTransaction } from "@/features/transactions/actions";
import type { ReceiptDraft } from "@/features/receipts/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";

type Account = { id: string; name: string; currency: string; is_archived?: boolean };
type Category = {
  id: string;
  name: string;
  transaction_type: "income" | "expense";
  is_archived?: boolean;
};

export type TransactionFormValue = {
  id: string;
  transaction_type: "income" | "expense" | "transfer";
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
  amount: number | string;
  currency: string;
  status: "completed" | "pending" | "cancelled";
  transaction_date: string;
  description: string | null;
  merchant: string | null;
  reference_number: string | null;
  tags?: string[];
};

export type ReceiptTransactionDraft = Omit<ReceiptDraft, "categoryId" | "transactionDate"> & {
  categoryId: string | null;
  transactionDate: string | null;
};

export function TransactionForm({
  accounts,
  categories,
  initialValue,
  receiptDraft,
}: {
  accounts: Account[];
  categories: Category[];
  initialValue?: TransactionFormValue;
  receiptDraft?: ReceiptTransactionDraft;
}) {
  const receiptAccount = receiptDraft?.currency
    ? accounts.find((account) => !account.is_archived && account.currency === receiptDraft.currency)
    : undefined;
  const [transactionType, setTransactionType] = useState<"income" | "expense" | "transfer">(
    initialValue?.transaction_type ?? "expense",
  );
  const [accountId, setAccountId] = useState(initialValue?.account_id ?? receiptAccount?.id ?? accounts[0]?.id ?? "");
  const sourceAccount = useMemo(
    () => accounts.find((account) => account.id === accountId),
    [accountId, accounts]
  );
  const matchingAccounts = accounts.filter(
    (account) =>
      account.currency === sourceAccount?.currency &&
      (!account.is_archived || account.id === initialValue?.destination_account_id)
  );
  const matchingCategories = categories.filter(
    (category) =>
      category.transaction_type === transactionType &&
      (!category.is_archived || category.id === initialValue?.category_id)
  );
  const needsCategory = transactionType !== "transfer";
  const receiptCurrencyMismatch = Boolean(receiptDraft?.currency && sourceAccount?.currency !== receiptDraft.currency);
  const canSubmit = Boolean(sourceAccount && (!needsCategory || matchingCategories.length) && !receiptCurrencyMismatch);
  const prefix = initialValue ? `transaction-${initialValue.id}` : "new-transaction";

  return (
    <ActionFeedbackForm
      action={initialValue ? updateTransaction : createTransaction}
      successMessage={initialValue ? "Transaction updated" : "Transaction added"}
    >
      {initialValue ? <input name="id" type="hidden" value={initialValue.id} /> : null}
      {receiptDraft ? (
        <Alert>
          <AlertTitle>Review the extracted details</AlertTitle>
          <AlertDescription>
            Receipt details are a draft only. Confirm the account, category, amount, and date before saving.
            {receiptDraft.tax !== null ? ` Detected tax: ${receiptDraft.tax.toFixed(2)}.` : ""}
          </AlertDescription>
        </Alert>
      ) : null}
      {receiptCurrencyMismatch ? (
        <Alert variant="destructive">
          <AlertTitle>Select an account in {receiptDraft?.currency}</AlertTitle>
          <AlertDescription>
            The scanned receipt is in {receiptDraft?.currency}, but the selected account is in {sourceAccount?.currency ?? "another currency"}. Saving is disabled until they match.
          </AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field>
          <FieldLabel htmlFor={`${prefix}-type`}>Transaction type</FieldLabel>
          <NativeSelect
            className="w-full"
            id={`${prefix}-type`}
            name="transactionType"
            onChange={(event) =>
              setTransactionType(event.target.value as "income" | "expense" | "transfer")
            }
            value={transactionType}
          >
            <NativeSelectOption value="expense">Expense</NativeSelectOption>
            <NativeSelectOption value="income">Income</NativeSelectOption>
            <NativeSelectOption value="transfer">Transfer</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-source`}>Source account</FieldLabel>
          <NativeSelect
            className="w-full"
            id={`${prefix}-source`}
            name="accountId"
            onChange={(event) => setAccountId(event.target.value)}
            required
            value={accountId}
          >
            {accounts.length ? (
              accounts.map((account) => (
                <NativeSelectOption key={account.id} value={account.id}>
                  {account.name} ({account.currency}){account.is_archived ? " - archived" : ""}
                </NativeSelectOption>
              ))
            ) : (
              <NativeSelectOption value="">No active accounts</NativeSelectOption>
            )}
          </NativeSelect>
        </Field>
        {transactionType === "transfer" ? (
          <Field>
            <FieldLabel htmlFor={`${prefix}-destination`}>Destination account</FieldLabel>
            <NativeSelect
              className="w-full"
              defaultValue={initialValue?.destination_account_id ?? ""}
              id={`${prefix}-destination`}
              name="destinationAccountId"
              required
            >
              <NativeSelectOption disabled value="">
                Select destination
              </NativeSelectOption>
              {matchingAccounts
                .filter((account) => account.id !== accountId)
                .map((account) => (
                  <NativeSelectOption key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </NativeSelectOption>
                ))}
            </NativeSelect>
            <FieldDescription>
              Transfers require two accounts using the same currency.
            </FieldDescription>
          </Field>
        ) : (
          <Field>
            <FieldLabel htmlFor={`${prefix}-category`}>Category</FieldLabel>
            <NativeSelect
              className="w-full"
              defaultValue={initialValue?.category_id ?? receiptDraft?.categoryId ?? (receiptDraft ? "" : matchingCategories[0]?.id ?? "")}
              id={`${prefix}-category`}
              name="categoryId"
              required
            >
              {matchingCategories.length ? (
                <>
                  {receiptDraft ? <NativeSelectOption disabled value="">Select category</NativeSelectOption> : null}
                  {matchingCategories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                    {category.is_archived ? " - archived" : ""}
                  </NativeSelectOption>
                  ))}
                </>
              ) : (
                <NativeSelectOption value="">No matching categories</NativeSelectOption>
              )}
            </NativeSelect>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor={`${prefix}-amount`}>Amount</FieldLabel>
          <Input
            defaultValue={Number(initialValue?.amount ?? receiptDraft?.amount ?? 0) || undefined}
            id={`${prefix}-amount`}
            min="0.01"
            name="amount"
            required
            step="0.01"
            type="number"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-currency`}>Currency</FieldLabel>
          <Input
            id={`${prefix}-currency`}
            name="currency"
            readOnly
            value={sourceAccount?.currency ?? initialValue?.currency ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-date`}>Transaction date</FieldLabel>
          <IonicDateInput
            defaultValue={initialValue?.transaction_date.slice(0, 10) ?? receiptDraft?.transactionDate ?? undefined}
            id={`${prefix}-date`}
            name="transactionDate"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-status`}>Status</FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={initialValue?.status ?? "completed"}
            id={`${prefix}-status`}
            name="status"
          >
            <NativeSelectOption value="completed">Completed</NativeSelectOption>
            <NativeSelectOption value="pending">Pending</NativeSelectOption>
            <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-merchant`}>Merchant or source</FieldLabel>
          <Input
            defaultValue={initialValue?.merchant ?? receiptDraft?.merchant ?? ""}
            id={`${prefix}-merchant`}
            name="merchant"
            placeholder="Optional"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-reference`}>Reference number</FieldLabel>
          <Input
            defaultValue={initialValue?.reference_number ?? ""}
            id={`${prefix}-reference`}
            name="referenceNumber"
            placeholder="Optional"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-tags`}>Tags</FieldLabel>
          <Input
            defaultValue={initialValue?.tags?.join(", ") ?? ""}
            id={`${prefix}-tags`}
            name="tags"
            placeholder="work, reimbursable"
          />
          <FieldDescription>Separate up to ten tags with commas.</FieldDescription>
        </Field>
        <Field className="md:col-span-2">
          <FieldLabel htmlFor={`${prefix}-description`}>Description</FieldLabel>
          <Input
            defaultValue={initialValue?.description ?? ""}
            id={`${prefix}-description`}
            name="description"
            placeholder="Optional note"
          />
        </Field>
        <Button className="w-fit" disabled={!canSubmit} type="submit">
          {initialValue ? <Pencil data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          {initialValue ? "Save transaction" : "Add transaction"}
        </Button>
      </FieldGroup>
    </ActionFeedbackForm>
  );
}
