import { format } from "date-fns";
import { BadgeDollarSign, CalendarCheck2, Pencil, Plus, ReceiptText, Search, Tags, Trash2 } from "lucide-react";
import Link from "next/link";
import { TransactionForm, type TransactionFormValue } from "@/components/transactions/transaction-form";
import { ReceiptScanDialog } from "@/components/transactions/receipt-scan-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { PrivateFinancialValue } from "@/components/privacy/screen-privacy";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createTag, deleteTag, deleteTransaction } from "@/features/transactions/actions";
import { formatMoney } from "@/lib/formatting/money";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type TransactionRow = TransactionFormValue & {
  source_account: { name: string } | null;
  destination_account: { name: string } | null;
  category: { name: string } | null;
  transaction_tags: { tags: { id: string; name: string } | null }[];
};

function parameterValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function statusVariant(status: string) {
  if (status === "cancelled") return "destructive" as const;
  if (status === "pending") return "warning" as const;
  return "success" as const;
}

function formatTransactionAmount(transaction: Pick<TransactionRow, "amount" | "currency" | "transaction_type">) {
  const amount = formatMoney(Math.abs(Number(transaction.amount) || 0), transaction.currency);
  if (transaction.transaction_type === "income") return `+${amount}`;
  if (transaction.transaction_type === "expense") return `-${amount}`;
  return amount;
}

function transactionAmountClass(transactionType: TransactionRow["transaction_type"]) {
  if (transactionType === "income") return "text-emerald-600 dark:text-emerald-400";
  if (transactionType === "expense") return "text-red-600 dark:text-red-400";
  return undefined;
}

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const parameters = await searchParams;
  const search = parameterValue(parameters.search).replace(/[,%()]/g, "").trim();
  const type = parameterValue(parameters.type);
  const status = parameterValue(parameters.status);
  const account = parameterValue(parameters.account);
  const category = parameterValue(parameters.category);
  const currency = parameterValue(parameters.currency).toUpperCase();
  const from = parameterValue(parameters.from);
  const to = parameterValue(parameters.to);
  const page = Math.max(1, Number.parseInt(parameterValue(parameters.page) || "1", 10) || 1);
  const supabase = await createClient();

  let transactionQuery = supabase
    .from("transactions")
    .select(
      "id,transaction_type,account_id,destination_account_id,category_id,amount,currency,status,transaction_date,description,merchant,reference_number,source_account:accounts!transactions_account_id_fkey(name),destination_account:accounts!transactions_destination_account_id_fkey(name),category:categories!transactions_category_id_fkey(name),transaction_tags(tags(id,name))",
      { count: "exact" },
    )
    .order("transaction_date", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (search) transactionQuery = transactionQuery.or(`description.ilike.%${search}%,merchant.ilike.%${search}%,reference_number.ilike.%${search}%`);
  if (["income", "expense", "transfer"].includes(type)) transactionQuery = transactionQuery.eq("transaction_type", type);
  if (["completed", "pending", "cancelled"].includes(status)) transactionQuery = transactionQuery.eq("status", status);
  if (account) transactionQuery = transactionQuery.or(`account_id.eq.${account},destination_account_id.eq.${account}`);
  if (category) transactionQuery = transactionQuery.eq("category_id", category);
  if (currency.length === 3) transactionQuery = transactionQuery.eq("currency", currency);
  if (from) transactionQuery = transactionQuery.gte("transaction_date", from);
  if (to) transactionQuery = transactionQuery.lte("transaction_date", `${to}T23:59:59.999Z`);

  const [
    { data: transactions, count },
    { data: accounts },
    { data: categories },
    { data: tags },
    { data: profile },
  ] = await Promise.all([
    transactionQuery,
    supabase.from("accounts").select("id,name,currency,is_archived").order("display_order").order("name"),
    supabase.from("categories").select("id,name,transaction_type,is_archived").order("display_order").order("name"),
    supabase.from("tags").select("id,name").order("name"),
    supabase.from("profiles").select("receipt_scanning_consent_at").maybeSingle(),
  ]);
  const rows = (transactions ?? []) as unknown as TransactionRow[];
  const transactionIds = rows.map((transaction) => transaction.id);
  const [{ data: salaryLinks }, { data: billLinks }] = transactionIds.length
    ? await Promise.all([
        supabase
          .from("salary_runs")
          .select("id,transaction_id")
          .in("transaction_id", transactionIds),
        supabase
          .from("bill_items")
          .select("id,transaction_id")
          .in("transaction_id", transactionIds),
      ])
    : [{ data: [] }, { data: [] }];
  const salaryRunByTransaction = new Map(
    (salaryLinks ?? []).map((salaryRun) => [salaryRun.transaction_id, salaryRun.id]),
  );
  const billItemByTransaction = new Map(
    (billLinks ?? []).map((billItem) => [billItem.transaction_id, billItem.id]),
  );
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const pageHref = (targetPage: number) => {
    const next = new URLSearchParams();
    Object.entries(parameters).forEach(([key, value]) => {
      const resolved = parameterValue(value);
      if (resolved && key !== "page") next.set(key, resolved);
    });
    next.set("page", String(targetPage));
    return `/transactions?${next.toString()}`;
  };
  const activeAccounts = (accounts ?? []).filter((item) => !item.is_archived);
  const activeCategories = (categories ?? []).filter((item) => !item.is_archived);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        description="Search, manage, and review your financial activity."
        title="Transactions"
        actions={<>
          <Dialog>
            <DialogTrigger asChild><Button variant="outline"><Tags data-icon="inline-start" />Manage tags</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Manage tags</DialogTitle><DialogDescription>Tags can be reused across transactions and removed without deleting activity.</DialogDescription></DialogHeader>
              <ActionFeedbackForm action={createTag} className="flex gap-2" successMessage="Tag added">
                <Input aria-label="New tag name" name="name" placeholder="reimbursable" required />
                <Button type="submit"><Plus data-icon="inline-start" />Add</Button>
              </ActionFeedbackForm>
              <div className="flex flex-wrap gap-2">
                {(tags ?? []).map((tag) => (
                  <ActionFeedbackForm action={deleteTag} key={tag.id} pendingMessage="Deleting tag…" successMessage="Tag deleted">
                    <input name="id" type="hidden" value={tag.id} />
                    <Button size="sm" type="submit" variant="outline">{tag.name}<Trash2 data-icon="inline-end" /></Button>
                  </ActionFeedbackForm>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <ReceiptScanDialog
            accounts={activeAccounts}
            categories={activeCategories as { id: string; name: string; transaction_type: "income" | "expense"; is_archived: boolean }[]}
            hasConsent={Boolean(profile?.receipt_scanning_consent_at)}
          />
          <Dialog>
            <DialogTrigger asChild><Button><Plus data-icon="inline-start" />Add transaction</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
              <DialogHeader><DialogTitle>Add a transaction</DialogTitle><DialogDescription>Completed activity changes balances immediately; pending and cancelled activity does not.</DialogDescription></DialogHeader>
              <TransactionForm accounts={activeAccounts} categories={activeCategories as { id: string; name: string; transaction_type: "income" | "expense"; is_archived: boolean }[]} />
            </DialogContent>
          </Dialog>
        </>}
      />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Search />Find activity</CardTitle><CardDescription>Combine filters to narrow the ledger. Filters are applied on the server.</CardDescription></CardHeader>
        <CardContent>
          <form method="get">
            <FieldGroup className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              <Field className="md:col-span-2"><FieldLabel htmlFor="search">Search</FieldLabel><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" defaultValue={search} id="search" name="search" placeholder="Search merchant, description, note or reference..." /></div></Field>
              <Field><FieldLabel htmlFor="filter-type">Type</FieldLabel><NativeSelect className="w-full" defaultValue={type} id="filter-type" name="type"><NativeSelectOption value="">All types</NativeSelectOption><NativeSelectOption value="income">Income</NativeSelectOption><NativeSelectOption value="expense">Expense</NativeSelectOption><NativeSelectOption value="transfer">Transfer</NativeSelectOption></NativeSelect></Field>
              <Field><FieldLabel htmlFor="filter-status">Status</FieldLabel><NativeSelect className="w-full" defaultValue={status} id="filter-status" name="status"><NativeSelectOption value="">All statuses</NativeSelectOption><NativeSelectOption value="completed">Completed</NativeSelectOption><NativeSelectOption value="pending">Pending</NativeSelectOption><NativeSelectOption value="cancelled">Cancelled</NativeSelectOption></NativeSelect></Field>
              <Field><FieldLabel htmlFor="filter-account">Account</FieldLabel><NativeSelect className="w-full" defaultValue={account} id="filter-account" name="account"><NativeSelectOption value="">All accounts</NativeSelectOption>{(accounts ?? []).map((item) => <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>)}</NativeSelect></Field>
              <Field><FieldLabel htmlFor="filter-category">Category</FieldLabel><NativeSelect className="w-full" defaultValue={category} id="filter-category" name="category"><NativeSelectOption value="">All categories</NativeSelectOption>{(categories ?? []).map((item) => <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>)}</NativeSelect></Field>
              <Field><FieldLabel htmlFor="filter-currency">Currency</FieldLabel><Input defaultValue={currency} id="filter-currency" maxLength={3} name="currency" placeholder="All" /></Field>
              <Field><FieldLabel htmlFor="filter-from">From</FieldLabel><Input defaultValue={from} id="filter-from" name="from" type="date" /></Field>
              <Field><FieldLabel htmlFor="filter-to">To</FieldLabel><Input defaultValue={to} id="filter-to" name="to" type="date" /></Field>
              <Button className="w-fit" type="submit"><Search data-icon="inline-start" />Apply filters</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText />Ledger</CardTitle><CardDescription>{count ?? 0} matching transactions. Transfers are displayed but excluded from income and expense totals.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-4">
          {rows.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Details</TableHead><TableHead>Account</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((transaction) => {
                  const transactionTags = transaction.transaction_tags.map((item) => item.tags).filter((tag): tag is { id: string; name: string } => Boolean(tag));
                  const initialValue: TransactionFormValue = { ...transaction, tags: transactionTags.map((tag) => tag.name) };
                  const salaryRunId = salaryRunByTransaction.get(transaction.id);
                  const billItemId = billItemByTransaction.get(transaction.id);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.transaction_date), "MMM d, yyyy")}</TableCell>
                      <TableCell><div className="flex max-w-64 flex-col gap-1"><span className="font-medium">{transaction.merchant || transaction.description || "No description"}</span><div className="flex flex-wrap gap-1">{salaryRunId ? <Badge><BadgeDollarSign />Salary</Badge> : null}{billItemId ? <Badge><CalendarCheck2 />Bill</Badge> : null}{transactionTags.map((tag) => <Badge key={tag.id} variant="outline">{tag.name}</Badge>)}</div></div></TableCell>
                      <TableCell>{transaction.source_account?.name ?? "Account"}{transaction.destination_account ? ` to ${transaction.destination_account.name}` : ""}</TableCell>
                      <TableCell>{transaction.category?.name ?? (transaction.transaction_type === "transfer" ? "Transfer" : "Uncategorized")}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        <PrivateFinancialValue className={transactionAmountClass(transaction.transaction_type)}>
                          {formatTransactionAmount(transaction)}
                        </PrivateFinancialValue>
                      </TableCell>
                      <TableCell><Badge variant={statusVariant(transaction.status)}>{transaction.status}</Badge></TableCell>
                      <TableCell>{salaryRunId ? <div className="flex justify-end"><Button asChild size="sm" variant="ghost"><Link href={`/salary/${salaryRunId}`}><BadgeDollarSign data-icon="inline-start" />Open salary</Link></Button></div> : billItemId ? <div className="flex justify-end"><Button asChild size="sm" variant="ghost"><Link href="/bills"><CalendarCheck2 data-icon="inline-start" />Open bill</Link></Button></div> : <div className="flex justify-end gap-1"><Dialog><DialogTrigger asChild><Button aria-label="Edit transaction" size="icon-sm" variant="ghost"><Pencil /></Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>Edit transaction</DialogTitle><DialogDescription>Archived references remain available only for this historical record.</DialogDescription></DialogHeader><TransactionForm accounts={accounts ?? []} categories={(categories ?? []) as { id: string; name: string; transaction_type: "income" | "expense"; is_archived: boolean }[]} initialValue={initialValue} /></DialogContent></Dialog><AlertDialog><AlertDialogTrigger asChild><Button aria-label="Delete transaction" size="icon-sm" variant="ghost"><Trash2 /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this transaction?</AlertDialogTitle><AlertDialogDescription>This permanently removes the entry and recalculates affected balances. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><ActionFeedbackForm action={deleteTransaction} pendingMessage="Deleting transaction…" successMessage="Transaction deleted"><input name="id" type="hidden" value={transaction.id} /><AlertDialogAction type="submit" variant="destructive">Delete</AlertDialogAction></ActionFeedbackForm></AlertDialogFooter></AlertDialogContent></AlertDialog></div>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Empty><EmptyHeader><EmptyMedia variant="icon"><ReceiptText /></EmptyMedia><EmptyTitle>No matching transactions</EmptyTitle><EmptyDescription>Add activity or adjust the current filters.</EmptyDescription></EmptyHeader></Empty>
          )}
          {pageCount > 1 ? <Pagination><PaginationContent><PaginationItem><PaginationPrevious aria-disabled={page <= 1} href={pageHref(Math.max(1, page - 1))} /></PaginationItem><PaginationItem><span className="px-3 text-sm text-muted-foreground">Page {page} of {pageCount}</span></PaginationItem><PaginationItem><PaginationNext aria-disabled={page >= pageCount} href={pageHref(Math.min(pageCount, page + 1))} /></PaginationItem></PaginationContent></Pagination> : null}
        </CardContent>
      </Card>
    </main>
  );
}
