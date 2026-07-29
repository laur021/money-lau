import { ArchiveRestore, Landmark, Plus, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { createAccount, setAccountArchived } from "@/features/accounts/actions";
import { createClient } from "@/lib/supabase/server";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase.from("accounts").select("id,name,account_type,currency,opening_balance,is_archived").order("created_at");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Cash, bank, and wallet balances</p>
        <h1 className="text-2xl font-semibold">Accounts</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="size-4" />Add an account</CardTitle>
          <CardDescription>Opening balances anchor the account totals used throughout MoneyLau.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAccount}>
            <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="account-name">Account name</FieldLabel>
                <Input id="account-name" name="name" placeholder="Main checking" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="account-type">Account type</FieldLabel>
                <NativeSelect className="w-full" id="account-type" name="accountType" defaultValue="bank">
                  <NativeSelectOption value="bank">Bank</NativeSelectOption>
                  <NativeSelectOption value="cash">Cash</NativeSelectOption>
                  <NativeSelectOption value="e_wallet">E-wallet</NativeSelectOption>
                  <NativeSelectOption value="credit_card">Credit card</NativeSelectOption>
                  <NativeSelectOption value="investment">Investment</NativeSelectOption>
                  <NativeSelectOption value="other">Other</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="opening-balance">Opening balance</FieldLabel>
                <Input id="opening-balance" name="openingBalance" type="number" step="0.01" defaultValue="0" />
              </Field>
              <Field>
                <FieldLabel htmlFor="account-currency">Currency</FieldLabel>
                <NativeSelect className="w-full" id="account-currency" name="currency" defaultValue="PHP">
                  <NativeSelectOption value="PHP">PHP</NativeSelectOption>
                  <NativeSelectOption value="USD">USD</NativeSelectOption>
                  <NativeSelectOption value="EUR">EUR</NativeSelectOption>
                  <NativeSelectOption value="SGD">SGD</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Button className="w-fit" type="submit"><Plus data-icon="inline-start" />Add account</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><WalletCards className="size-4" />Your accounts</CardTitle>
          <CardDescription>Archived accounts are retained so historical transactions stay intact.</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts?.length ? (
            <div className="flex flex-col divide-y rounded-lg border">
              {accounts.map((account) => (
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={account.id}>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{account.name}</span><Badge variant={account.is_archived ? "outline" : "secondary"}>{account.is_archived ? "Archived" : "Active"}</Badge></div>
                    <span className="text-sm text-muted-foreground">{account.account_type.replace("_", " ")} | {Number(account.opening_balance).toFixed(2)} {account.currency}</span>
                  </div>
                  <form action={setAccountArchived}>
                    <input type="hidden" name="id" value={account.id} />
                    <input type="hidden" name="archived" value={String(!account.is_archived)} />
                    <Button size="sm" type="submit" variant="outline"><ArchiveRestore data-icon="inline-start" />{account.is_archived ? "Restore" : "Archive"}</Button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyHeader><EmptyMedia variant="icon"><Landmark /></EmptyMedia><EmptyTitle>No accounts yet</EmptyTitle><EmptyDescription>Add your first account to begin tracking balances.</EmptyDescription></EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
