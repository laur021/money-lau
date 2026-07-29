import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { totalsByCurrency } from "@/lib/calculations/ledger";
import { createClient } from "@/lib/supabase/server";
import { Download, WalletCards } from "lucide-react";
import Link from "next/link";
export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: transactions }, { data: balances }] = await Promise.all([
    supabase
      .from("transactions")
      .select("transaction_type,amount,currency,status,transaction_date,category_id")
      .order("transaction_date", { ascending: false })
      .limit(50),
    supabase.from("account_balances").select("id,currency,current_balance"),
  ]);
  const totals = totalsByCurrency(transactions ?? []);
  const chartData = Object.entries(totals).map(([currency, value]) => ({ currency, ...value }));
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">This month</p>
          <h1 className="text-2xl font-semibold">Financial overview test</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/reports">
            <Download data-icon="inline-start" />
            Export report
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {chartData.map((row) => (
          <Card key={row.currency}>
            <CardHeader>
              <CardTitle>{row.currency}</CardTitle>
              <CardDescription>Completed activity</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <span>Income: {row.income.toFixed(2)}</span>
              <span>Expenses: {row.expense.toFixed(2)}</span>
              <span className="font-medium">Net: {(row.income - row.expense).toFixed(2)}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income and expenses</CardTitle>
            <CardDescription>Completed entries, shown separately by currency.</CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account balances</CardTitle>
            <CardDescription>Opening balance plus completed ledger activity.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {balances?.map((balance) => (
              <div key={balance.id} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <WalletCards className="size-4" />
                  Account
                </span>
                <span>
                  {Number(balance.current_balance).toFixed(2)} {balance.currency}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
