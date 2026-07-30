import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { createAccount, updateAccount } from "@/features/accounts/actions";
import { Pencil, Plus } from "lucide-react";

export type AccountRecord = {
  id: string;
  name: string;
  institution_name: string | null;
  account_type: string;
  opening_balance: number | string;
  currency: string;
  account_identifier: string | null;
  icon: string | null;
  color: string | null;
  include_in_total: boolean;
  is_archived: boolean;
  display_order: number;
};

const accountTypes = [
  ["bank", "Bank"],
  ["cash", "Cash wallet"],
  ["savings", "Savings"],
  ["checking", "Checking"],
  ["credit_card", "Credit card"],
  ["e_wallet", "E-wallet"],
  ["investment", "Investment"],
  ["other", "Other"],
] as const;

const accountColors = ["blue", "cyan", "green", "amber", "rose", "violet"];

export function AccountForm({ account }: { account?: AccountRecord }) {
  const prefix = account ? `account-${account.id}` : "new-account";
  const action = account ? updateAccount : createAccount;

  return (
    <form action={action}>
      {account ? <input name="id" type="hidden" value={account.id} /> : null}
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${prefix}-name`}>Account name</FieldLabel>
          <Input
            defaultValue={account?.name}
            id={`${prefix}-name`}
            name="name"
            placeholder="Main checking"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-institution`}>Institution</FieldLabel>
          <Input
            defaultValue={account?.institution_name ?? ""}
            id={`${prefix}-institution`}
            name="institutionName"
            placeholder="BDO, GCash, or custom name"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-type`}>Account type</FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={account?.account_type ?? "bank"}
            id={`${prefix}-type`}
            name="accountType"
          >
            {accountTypes.map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-opening`}>Opening balance</FieldLabel>
          <Input
            defaultValue={Number(account?.opening_balance ?? 0)}
            id={`${prefix}-opening`}
            name="openingBalance"
            step="0.01"
            type="number"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-currency`}>Currency</FieldLabel>
          <Input
            defaultValue={account?.currency ?? "PHP"}
            id={`${prefix}-currency`}
            maxLength={3}
            name="currency"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-identifier`}>Last four digits</FieldLabel>
          <Input
            defaultValue={account?.account_identifier ?? ""}
            id={`${prefix}-identifier`}
            maxLength={4}
            name="accountIdentifier"
            placeholder="Optional"
          />
          <FieldDescription>Never enter a full account or card number.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-icon`}>Icon</FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={account?.icon ?? "wallet"}
            id={`${prefix}-icon`}
            name="icon"
          >
            <NativeSelectOption value="wallet">Wallet</NativeSelectOption>
            <NativeSelectOption value="landmark">Bank</NativeSelectOption>
            <NativeSelectOption value="credit-card">Card</NativeSelectOption>
            <NativeSelectOption value="piggy-bank">Savings</NativeSelectOption>
            <NativeSelectOption value="chart">Investment</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-color`}>Display color</FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={account?.color ?? "blue"}
            id={`${prefix}-color`}
            name="color"
          >
            {accountColors.map((color) => (
              <NativeSelectOption key={color} value={color}>
                {color}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            defaultChecked={account?.include_in_total ?? true}
            id={`${prefix}-include`}
            name="includeInTotal"
            value="true"
          />
          <FieldContent>
            <FieldLabel htmlFor={`${prefix}-include`}>Include in total balance</FieldLabel>
            <FieldDescription>Excluded accounts remain available in reports.</FieldDescription>
          </FieldContent>
        </Field>
        <input name="displayOrder" type="hidden" value={account?.display_order ?? 0} />
        <Button className="w-fit" type="submit">
          {account ? <Pencil data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          {account ? "Save account" : "Add account"}
        </Button>
      </FieldGroup>
    </form>
  );
}

export function AccountEditDialog({ account }: { account: AccountRecord }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil data-icon="inline-start" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
          <DialogDescription>
            Update display details without changing historical transactions.
          </DialogDescription>
        </DialogHeader>
        <AccountForm account={account} />
      </DialogContent>
    </Dialog>
  );
}
