"use client";

import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createReceiptLineItems } from "@/features/transactions/actions";
import type { ReceiptDraft } from "@/features/receipts/types";
import { formatAmount, formatMoney } from "@/lib/formatting/money";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Account = { id: string; name: string; currency: string; is_archived?: boolean };
type Category = {
  id: string;
  name: string;
  transaction_type: "income" | "expense";
  is_archived?: boolean;
};

export function ReceiptItemImportForm({
  accounts,
  categories,
  onRemoveItem,
  onSaved,
  receipt,
}: {
  accounts: Account[];
  categories: Category[];
  onRemoveItem: () => void;
  onSaved?: () => void;
  receipt: ReceiptDraft;
}) {
  const availableAccounts = accounts.filter((account) => !account.is_archived);
  const availableCategories = categories.filter(
    (category) => category.transaction_type === "expense" && !category.is_archived,
  );
  const [accountId, setAccountId] = useState(
    () =>
      availableAccounts.find((account) => account.currency === receipt.currency)?.id ??
      availableAccounts[0]?.id ??
      "",
  );
  const [categoryId, setCategoryId] = useState(
    availableCategories.some((category) => category.id === receipt.categoryId) ? receipt.categoryId ?? "" : "",
  );
  const [items, setItems] = useState(() =>
    receipt.items.map((item, index) => ({ id: index, item })),
  );
  const selectedAccount = availableAccounts.find((account) => account.id === accountId);
  const canSubmit = Boolean(accountId && categoryId && selectedAccount && items.length);

  function removeItem(itemId: number) {
    setItems((currentItems) => {
      const nextItems = currentItems.filter((entry) => entry.id !== itemId);
      if (!nextItems.length) onRemoveItem();
      return nextItems;
    });
  }

  return (
    <ActionFeedbackForm action={createReceiptLineItems} onSuccess={onSaved} pendingMessage="Saving receipt items…" successMessage={`${items.length} receipt items saved`} className="flex flex-col gap-4">
      <FieldGroup className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="receipt-items-account">Source account</FieldLabel>
          <NativeSelect
            className="w-full"
            id="receipt-items-account"
            name="accountId"
            onChange={(event) => setAccountId(event.target.value)}
            required
            value={accountId}
          >
            <NativeSelectOption disabled value="">Select account</NativeSelectOption>
            {availableAccounts.map((account) => (
              <NativeSelectOption key={account.id} value={account.id}>{account.name} ({account.currency})</NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>
            The currency updates to match the selected account.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="receipt-items-category">Category</FieldLabel>
          <NativeSelect
            className="w-full"
            id="receipt-items-category"
            name="categoryId"
            onChange={(event) => setCategoryId(event.target.value)}
            required
            value={categoryId}
          >
            <NativeSelectOption disabled value="">Select category</NativeSelectOption>
            {availableCategories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>{category.name}</NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription className="text-xs">The selected expense category applies to every item; you can edit individual entries later.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="receipt-items-date">Transaction date</FieldLabel>
          <Input defaultValue={receipt.transactionDate ?? undefined} id="receipt-items-date" name="transactionDate" type="date" />
        </Field>
        <Field>
          <FieldLabel htmlFor="receipt-items-status">Status</FieldLabel>
          <NativeSelect className="w-full" defaultValue="completed" id="receipt-items-status" name="status">
            <NativeSelectOption value="completed">Completed</NativeSelectOption>
            <NativeSelectOption value="pending">Pending</NativeSelectOption>
            <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="receipt-items-merchant">Merchant</FieldLabel>
          <Input defaultValue={receipt.merchant ?? ""} id="receipt-items-merchant" name="merchant" placeholder="Optional" />
        </Field>
        <Field>
          <FieldLabel htmlFor="receipt-items-currency">Currency</FieldLabel>
          <Input id="receipt-items-currency" name="currency" readOnly value={selectedAccount?.currency ?? receipt.currency ?? ""} />
        </Field>
      </FieldGroup>
      <section aria-labelledby="receipt-items-heading" className="mt-5 grid gap-3 rounded-lg border p-4">
        <div>
          <h3 className="font-medium" id="receipt-items-heading">Receipt items</h3>
          <p className="text-sm text-muted-foreground">Correct an item description or amount, or remove an incorrectly captured item before saving.</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="text-right">Amount to save</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(({ id, item }) => (
              <TableRow key={id}>
                <TableCell className="min-w-44"><Input defaultValue={item.description} name="itemDescription" required /></TableCell>
                <TableCell className="text-right">{item.quantity === null ? "—" : formatAmount(item.quantity)}</TableCell>
                <TableCell className="text-right">{item.unitPrice === null ? "—" : formatMoney(item.unitPrice, item.currency ?? receipt.currency ?? "PHP")}</TableCell>
                <TableCell className="min-w-30"><Input defaultValue={item.totalPrice ?? undefined} min="0.01" name="itemAmount" required step="0.01" type="number" /></TableCell>
                <TableCell>
                  <Button
                    aria-label={`Remove ${item.description || "receipt item"}`}
                    onClick={() => removeItem(id)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <Button className="mt-5" disabled={!canSubmit} type="submit">
        <Plus data-icon="inline-start" />
        Save {items.length} item{items.length === 1 ? "" : "s"}
      </Button>
    </ActionFeedbackForm>
  );
}
