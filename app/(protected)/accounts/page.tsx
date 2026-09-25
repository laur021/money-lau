import {
  AccountEditDialog,
  AccountForm,
  type AccountRecord,
} from "@/components/accounts/account-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
import { Button } from "@/components/ui/button";
import { PrivateFinancialValue } from "@/components/privacy/screen-privacy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { moveAccount, setAccountArchived } from "@/features/accounts/actions";
import { formatMoney } from "@/lib/formatting/money";
import { createClient } from "@/lib/supabase/server";
import { ArchiveRestore, ArrowDown, ArrowUp, Plus, WalletCards } from "lucide-react";

function AccountActions({ account }: { account: AccountRecord }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <ActionFeedbackForm action={moveAccount} pendingMessage="Reordering account…" successMessage="Account order updated">
        <input name="id" type="hidden" value={account.id} />
        <input name="displayOrder" type="hidden" value={account.display_order} />
        <input name="direction" type="hidden" value="up" />
        <Button aria-label={`Move ${account.name} up`} size="icon-sm" type="submit" variant="ghost"><ArrowUp /></Button>
      </ActionFeedbackForm>
      <ActionFeedbackForm action={moveAccount} pendingMessage="Reordering account…" successMessage="Account order updated">
        <input name="id" type="hidden" value={account.id} />
        <input name="displayOrder" type="hidden" value={account.display_order} />
        <input name="direction" type="hidden" value="down" />
        <Button aria-label={`Move ${account.name} down`} size="icon-sm" type="submit" variant="ghost"><ArrowDown /></Button>
      </ActionFeedbackForm>
      <AccountEditDialog account={account} />
      <ActionFeedbackForm action={setAccountArchived} successMessage={account.is_archived ? "Account restored" : "Account archived"}>
        <input name="id" type="hidden" value={account.id} />
        <input name="archived" type="hidden" value={String(!account.is_archived)} />
        <Button size="sm" type="submit" variant="outline"><ArchiveRestore data-icon="inline-start" />{account.is_archived ? "Restore" : "Archive"}</Button>
      </ActionFeedbackForm>
    </div>
  );
}

export default async function AccountsPage() {
  const supabase = await createClient();
  const [{ data: accounts }, { data: balances }, { data: profile }] = await Promise.all([
    supabase
      .from("accounts")
      .select(
        "id,name,institution_name,account_type,opening_balance,currency,account_identifier,icon,color,include_in_total,is_archived,display_order"
      )
      .order("display_order")
      .order("created_at"),
    supabase.from("account_balances").select("id,current_balance"),
    supabase.from("profiles").select("show_archived_accounts").single(),
  ]);
  const balanceById = new Map(
    (balances ?? []).map((balance) => [balance.id, balance.current_balance])
  );
  const visibleAccounts = (accounts ?? []).filter(
    (account) => profile?.show_archived_accounts || !account.is_archived
  ) as AccountRecord[];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        description="Cash, banks, cards, and wallets in one clear view."
        title="Accounts"
        actions={
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Add account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add an account</DialogTitle>
              <DialogDescription>
                MoneyLau tracks balances manually and never asks for banking credentials.
              </DialogDescription>
            </DialogHeader>
            <AccountForm />
          </DialogContent>
        </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletCards />
            Your accounts
          </CardTitle>
          <CardDescription>
            Current balance equals the opening balance plus completed ledger activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibleAccounts.length ? (
            <>
              <div className="flex flex-col gap-3 md:hidden">
                {visibleAccounts.map((account) => (
                  <article className="rounded-xl border bg-card p-4 shadow-sm" key={account.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><h2 className="truncate font-semibold">{account.name}</h2><p className="truncate text-sm text-muted-foreground">{account.institution_name || "No institution"}{account.account_identifier ? ` · ending ${account.account_identifier}` : ""}</p></div>
                      <PrivateFinancialValue className="shrink-0 font-semibold tabular-nums">{formatMoney(balanceById.get(account.id) ?? account.opening_balance, account.currency)}</PrivateFinancialValue>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><span className="capitalize">{account.account_type.replace("_", " ")}</span><Badge variant={account.is_archived ? "outline" : "secondary"}>{account.is_archived ? "Archived" : "Active"}</Badge>{!account.include_in_total ? <Badge variant="outline">Excluded from totals</Badge> : null}</div>
                    <div className="mt-3 border-t pt-2"><AccountActions account={account} /></div>
                  </article>
                ))}
              </div>
            <Table className="hidden md:table">
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
                    <TableCell className="text-right font-semibold tabular-nums">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {account.institution_name || "No institution"}
                          {account.account_identifier
                            ? ` | ending ${account.account_identifier}`
                            : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {account.account_type.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <PrivateFinancialValue>
                        {formatMoney(
                          balanceById.get(account.id) ?? account.opening_balance,
                          account.currency
                        )}
                      </PrivateFinancialValue>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={account.is_archived ? "outline" : "secondary"}>
                          {account.is_archived ? "Archived" : "Active"}
                        </Badge>
                        {!account.include_in_total ? (
                          <Badge variant="outline">Excluded from totals</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AccountActions account={account} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <WalletCards />
                </EmptyMedia>
                <EmptyTitle>No accounts to show</EmptyTitle>
                <EmptyDescription>
                  Add an account or enable archived accounts in Settings.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
