import { ArchiveRestore, ArrowDown, ArrowUp, Plus, WalletCards } from "lucide-react";
import { AccountEditDialog, AccountForm, type AccountRecord } from "@/components/accounts/account-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { moveAccount, setAccountArchived } from "@/features/accounts/actions";
import { formatMoney } from "@/lib/formatting/money";
import { createClient } from "@/lib/supabase/server";

export default async function AccountsPage() {
  const supabase = await createClient();
  const [{ data: accounts }, { data: balances }, { data: profile }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id,name,institution_name,account_type,opening_balance,currency,account_identifier,icon,color,include_in_total,is_archived,display_order")
      .order("display_order")
      .order("created_at"),
    supabase.from("account_balances").select("id,current_balance"),
    supabase.from("profiles").select("show_archived_accounts").single(),
  ]);
  const balanceById = new Map((balances ?? []).map((balance) => [balance.id, balance.current_balance]));
  const visibleAccounts = (accounts ?? []).filter(
    (account) => profile?.show_archived_accounts || !account.is_archived,
  ) as AccountRecord[];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Cash, banks, cards, and wallets</p>
          <h1 className="text-2xl font-semibold">Accounts</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus data-icon="inline-start" />Add account</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add an account</DialogTitle>
              <DialogDescription>MoneyLau tracks balances manually and never asks for banking credentials.</DialogDescription>
            </DialogHeader>
            <AccountForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><WalletCards />Your accounts</CardTitle>
          <CardDescription>Current balance equals the opening balance plus completed ledger activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {visibleAccounts.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Current balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {account.institution_name || "No institution"}
                          {account.account_identifier ? ` | ending ${account.account_identifier}` : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{account.account_type.replace("_", " ")}</TableCell>
                    <TableCell>{formatMoney(balanceById.get(account.id) ?? account.opening_balance, account.currency)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={account.is_archived ? "outline" : "secondary"}>{account.is_archived ? "Archived" : "Active"}</Badge>
                        {!account.include_in_total ? <Badge variant="outline">Excluded from totals</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <form action={moveAccount}>
                          <input name="id" type="hidden" value={account.id} />
                          <input name="displayOrder" type="hidden" value={account.display_order} />
                          <input name="direction" type="hidden" value="up" />
                          <Button aria-label={`Move ${account.name} up`} size="icon-sm" type="submit" variant="ghost"><ArrowUp /></Button>
                        </form>
                        <form action={moveAccount}>
                          <input name="id" type="hidden" value={account.id} />
                          <input name="displayOrder" type="hidden" value={account.display_order} />
                          <input name="direction" type="hidden" value="down" />
                          <Button aria-label={`Move ${account.name} down`} size="icon-sm" type="submit" variant="ghost"><ArrowDown /></Button>
                        </form>
                        <AccountEditDialog account={account} />
                        <form action={setAccountArchived}>
                          <input name="id" type="hidden" value={account.id} />
                          <input name="archived" type="hidden" value={String(!account.is_archived)} />
                          <Button size="sm" type="submit" variant="outline"><ArchiveRestore data-icon="inline-start" />{account.is_archived ? "Restore" : "Archive"}</Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><WalletCards /></EmptyMedia>
                <EmptyTitle>No accounts to show</EmptyTitle>
                <EmptyDescription>Add an account or enable archived accounts in Settings.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
