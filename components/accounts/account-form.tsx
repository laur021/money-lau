"use client";

import { useState } from "react";
import { InstitutionLogo, PHILIPPINE_INSTITUTIONS } from "@/components/accounts/institution-logo";
import { Button } from "@/components/ui/button";
import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
const CUSTOM_INSTITUTION = "custom-institution";

function institutionSelection(institutionName: string) {
  return PHILIPPINE_INSTITUTIONS.some(({ name }) => name === institutionName)
    ? institutionName
    : institutionName
      ? CUSTOM_INSTITUTION
      : "";
}

export function AccountForm({ account }: { account?: AccountRecord }) {
  const prefix = account ? `account-${account.id}` : "new-account";
  const action = account ? updateAccount : createAccount;
  const initialInstitution = account?.institution_name ?? "";
  const [selectedInstitutionName, setSelectedInstitutionName] = useState(() =>
    institutionSelection(initialInstitution),
  );
  const [customInstitutionName, setCustomInstitutionName] = useState(() =>
    selectedInstitutionName === CUSTOM_INSTITUTION ? initialInstitution : "",
  );
  const selectedInstitution = PHILIPPINE_INSTITUTIONS.find(
    ({ name }) => name === selectedInstitutionName,
  );
  const institutionName =
    selectedInstitutionName === CUSTOM_INSTITUTION
      ? customInstitutionName
      : selectedInstitutionName;

  return (
    <ActionFeedbackForm action={action} successMessage={account ? "Account updated" : "Account added"}>
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
          <input name="institutionName" type="hidden" value={institutionName} />
          <Select
            onValueChange={(value) => setSelectedInstitutionName(value)}
            value={selectedInstitutionName}
          >
            <SelectTrigger className="w-full" id={`${prefix}-institution`}>
              {selectedInstitution ? (
                <span className="flex min-w-0 items-center gap-2">
                  <InstitutionLogo
                    accountType={selectedInstitution.type}
                    className="size-6 rounded-sm p-1"
                    institutionName={selectedInstitution.name}
                  />
                  <span className="truncate">{selectedInstitution.name}</span>
                </span>
              ) : (
                <SelectValue placeholder="Select a bank or e-wallet" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Banks</SelectLabel>
                {PHILIPPINE_INSTITUTIONS.filter(({ type }) => type === "bank").map((institution) => (
                  <SelectItem key={institution.name} value={institution.name}>
                    <InstitutionLogo
                      accountType={institution.type}
                      className="size-7 rounded-sm p-1"
                      institutionName={institution.name}
                    />
                    <span>{institution.name}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>E-wallets</SelectLabel>
                {PHILIPPINE_INSTITUTIONS.filter(({ type }) => type === "e_wallet").map((institution) => (
                  <SelectItem key={institution.name} value={institution.name}>
                    <InstitutionLogo
                      accountType={institution.type}
                      className="size-7 rounded-sm p-1"
                      institutionName={institution.name}
                    />
                    <span>{institution.name}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectItem value={CUSTOM_INSTITUTION}>Other institution</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>Choose from supported Philippine providers or enter another institution.</FieldDescription>
        </Field>
        {selectedInstitutionName === CUSTOM_INSTITUTION ? (
          <Field>
            <FieldLabel htmlFor={`${prefix}-custom-institution`}>Institution name</FieldLabel>
            <Input
              id={`${prefix}-custom-institution`}
              onChange={(event) => setCustomInstitutionName(event.target.value)}
              placeholder="Enter the institution name"
              required
              value={customInstitutionName}
            />
          </Field>
        ) : null}
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
    </ActionFeedbackForm>
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
