"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { completeOnboarding } from "@/features/settings/actions";
import { CheckCircle2, Landmark, ReceiptText, UserRound } from "lucide-react";
import { useState } from "react";

type Category = { id: string; name: string; transaction_type: "income" | "expense" };

export function OnboardingForm({
  categories,
  profile,
}: {
  categories: Category[];
  profile: { display_name: string | null; default_currency: string; timezone: string } | null;
}) {
  const [transactionType, setTransactionType] = useState<"none" | "income" | "expense">("none");
  const matchingCategories = categories.filter(
    (category) => category.transaction_type === transactionType
  );

  return (
    <form action={completeOnboarding}>
      <FieldGroup>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">1</Badge>
          <div>
            <h2 className="font-medium">Welcome to MoneyLau</h2>
            <p className="text-sm text-muted-foreground">
              Confirm how your private workspace should display financial activity.
            </p>
          </div>
        </div>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="onboarding-display-name">
              <UserRound />
              Display name
            </FieldLabel>
            <Input
              defaultValue={profile?.display_name ?? ""}
              id="onboarding-display-name"
              name="displayName"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="onboarding-currency">Default currency</FieldLabel>
            <Input
              defaultValue={profile?.default_currency ?? "PHP"}
              id="onboarding-currency"
              maxLength={3}
              name="defaultCurrency"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="onboarding-timezone">Timezone</FieldLabel>
            <NativeSelect
              className="w-full"
              defaultValue={profile?.timezone ?? "Asia/Manila"}
              id="onboarding-timezone"
              name="timezone"
            >
              <NativeSelectOption value="Asia/Manila">Asia/Manila</NativeSelectOption>
              <NativeSelectOption value="Asia/Singapore">Asia/Singapore</NativeSelectOption>
              <NativeSelectOption value="Asia/Shanghai">Asia/Shanghai</NativeSelectOption>
              <NativeSelectOption value="UTC">UTC</NativeSelectOption>
            </NativeSelect>
          </Field>
        </FieldGroup>

        <Separator />
        <div className="flex items-center gap-3">
          <Badge variant="secondary">2</Badge>
          <div>
            <h2 className="font-medium">Create your first account</h2>
            <p className="text-sm text-muted-foreground">
              Use a bank, wallet, card, or cash account. Never enter banking credentials.
            </p>
          </div>
        </div>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="onboarding-account-name">
              <Landmark />
              Account name
            </FieldLabel>
            <Input
              id="onboarding-account-name"
              name="accountName"
              placeholder="Main wallet"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="onboarding-account-type">Account type</FieldLabel>
            <NativeSelect
              className="w-full"
              defaultValue="bank"
              id="onboarding-account-type"
              name="accountType"
            >
              <NativeSelectOption value="bank">Bank</NativeSelectOption>
              <NativeSelectOption value="cash">Cash wallet</NativeSelectOption>
              <NativeSelectOption value="savings">Savings</NativeSelectOption>
              <NativeSelectOption value="checking">Checking</NativeSelectOption>
              <NativeSelectOption value="credit_card">Credit card</NativeSelectOption>
              <NativeSelectOption value="e_wallet">E-wallet</NativeSelectOption>
              <NativeSelectOption value="investment">Investment</NativeSelectOption>
              <NativeSelectOption value="other">Other</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="onboarding-opening-balance">Opening balance</FieldLabel>
            <Input
              defaultValue="0"
              id="onboarding-opening-balance"
              name="openingBalance"
              step="0.01"
              type="number"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="onboarding-account-currency">Account currency</FieldLabel>
            <Input
              defaultValue={profile?.default_currency ?? "PHP"}
              id="onboarding-account-currency"
              maxLength={3}
              name="accountCurrency"
              required
            />
          </Field>
        </FieldGroup>

        <Separator />
        <div className="flex items-center gap-3">
          <Badge variant="secondary">3</Badge>
          <div>
            <h2 className="font-medium">Review default categories</h2>
            <p className="text-sm text-muted-foreground">
              MoneyLau prepared {categories.length} income and expense categories. You can customize
              them later.
            </p>
          </div>
        </div>
        <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-md border p-3">
          {categories.slice(0, 24).map((category) => (
            <Badge key={category.id} variant="outline">
              {category.name}
            </Badge>
          ))}
        </div>

        <Separator />
        <div className="flex items-center gap-3">
          <Badge variant="secondary">4</Badge>
          <div>
            <h2 className="font-medium">Optional first transaction</h2>
            <p className="text-sm text-muted-foreground">
              Skip this when you only want to establish the opening balance.
            </p>
          </div>
        </div>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="onboarding-transaction-type">
              <ReceiptText />
              Transaction
            </FieldLabel>
            <NativeSelect
              className="w-full"
              id="onboarding-transaction-type"
              name="firstTransactionType"
              onChange={(event) =>
                setTransactionType(event.target.value as "none" | "income" | "expense")
              }
              value={transactionType}
            >
              <NativeSelectOption value="none">Skip for now</NativeSelectOption>
              <NativeSelectOption value="income">Income</NativeSelectOption>
              <NativeSelectOption value="expense">Expense</NativeSelectOption>
            </NativeSelect>
          </Field>
          {transactionType !== "none" ? (
            <>
              <Field>
                <FieldLabel htmlFor="onboarding-first-amount">Amount</FieldLabel>
                <Input
                  id="onboarding-first-amount"
                  min="0.01"
                  name="firstAmount"
                  required
                  step="0.01"
                  type="number"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="onboarding-first-category">Category</FieldLabel>
                <NativeSelect
                  className="w-full"
                  id="onboarding-first-category"
                  name="firstCategoryId"
                  required
                >
                  <NativeSelectOption value="">Select category</NativeSelectOption>
                  {matchingCategories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="onboarding-first-description">Description</FieldLabel>
                <Input
                  id="onboarding-first-description"
                  name="firstDescription"
                  placeholder="Optional note"
                />
              </Field>
            </>
          ) : (
            <Field>
              <FieldDescription>
                You can add your first transaction from the dashboard or Transactions page.
              </FieldDescription>
            </Field>
          )}
        </FieldGroup>

        <Button className="w-fit" type="submit">
          <CheckCircle2 data-icon="inline-start" />
          Finish setup and open dashboard
        </Button>
      </FieldGroup>
    </form>
  );
}
