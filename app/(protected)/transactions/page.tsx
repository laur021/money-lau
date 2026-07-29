import { format } from "date-fns";
import { ReceiptText } from "lucide-react";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { createClient } from "@/lib/supabase/server";

function statusVariant(status: string) {
  if (status === "cancelled") return "destructive" as const;
  if (status === "pending") return "outline" as const;
  return "secondary" as const;
}

export default async function TransactionsPage() {
  const supabase = await createClient();
  const [{ data: accounts }, { data: categories }, { data: transactions }] = await Promise.all([
    supabase.from("accounts").select("id,name,currency").eq("is_archived", false).order("name"),
    supabase.from("categories").select("id,name,transaction_type").eq("is_archived", false).order("display_order"),
    supabase.from("transactions").select("id,transaction_type,amount,currency,status,transaction_date,description,merchant").order("transaction_date", { ascending: false }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">A complete history of financial activity</p>
        <h1 className="text-2xl font-semibold">Transactions</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add a transaction</CardTitle>
          <CardDescription>Transfers stay within a shared currency. Income and expenses require a matching category.</CardDescription>
        </CardHeader>
        <CardContent><TransactionForm accounts={accounts ?? []} categories={(categories ?? []) as { id: string; name: string; transaction_type: "income" | "expense" }[]} /></CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ReceiptText className="size-4" />Recent activity</CardTitle>
          <CardDescription>Pending and cancelled entries do not change balances or cash-flow reports.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions?.length ? (
            <div className="flex flex-col divide-y rounded-lg border">
              {transactions.map((transaction) => (
                <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between" key={transaction.id}>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{transaction.transaction_type}</Badge><Badge variant={statusVariant(transaction.status)}>{transaction.status}</Badge></div>
                    <span className="text-sm text-muted-foreground">{transaction.merchant || transaction.description || "No description"} | {format(new Date(transaction.transaction_date), "MMM d, yyyy")}</span>
                  </div>
                  <span className="font-medium">{Number(transaction.amount).toFixed(2)} {transaction.currency}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty><EmptyHeader><EmptyMedia variant="icon"><ReceiptText /></EmptyMedia><EmptyTitle>No transactions yet</EmptyTitle><EmptyDescription>Add an income, expense, or transfer to start your ledger.</EmptyDescription></EmptyHeader></Empty>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
