import { ExpenseDonutChart } from "@/components/charts/expense-donut-chart";
import { MonthlyCashFlowChart } from "@/components/charts/monthly-cash-flow-chart";
import {
  PrivateFinancialChart,
  PrivateFinancialValue,
} from "@/components/privacy/screen-privacy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  PERIOD_LABELS,
  REPORTING_PERIODS,
  isReportingPeriod,
  reportingDateRange,
} from "@/lib/calculations/periods";
import {
  categoryPortions,
  monthlyCashFlow,
  reportingTotals,
  type ReportingRow,
} from "@/lib/calculations/reporting";
import { formatMoney } from "@/lib/formatting/money";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Plus,
  ReceiptText,
  Scale,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parameterValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function transactionTitle(row: ReportingRow) {
  return row.merchant || row.description || row.category?.name || "Transaction";
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const parameters = await searchParams;
  const supabase = await createClient();
  const [{ data: profile }, { data: accounts }, { data: balances }] = await Promise.all([
    supabase
      .from("profiles")
      .select("default_currency,default_dashboard_period,week_starts_on")
      .maybeSingle(),
    supabase
      .from("accounts")
      .select("id,name,currency,account_type,include_in_total,is_archived,color")
      .eq("is_archived", false)
      .order("display_order")
      .order("name"),
    supabase.from("account_balances").select("id,currency,current_balance"),
  ]);

  const requestedPeriod = parameterValue(parameters.period);
  const configuredPeriod = profile?.default_dashboard_period ?? "this_month";
  const period = isReportingPeriod(requestedPeriod)
    ? requestedPeriod
    : isReportingPeriod(configuredPeriod)
      ? configuredPeriod
      : "this_month";
  const currencyOptions = Array.from(
    new Set([
      profile?.default_currency ?? "PHP",
      ...(accounts ?? []).map((account) => account.currency),
    ])
  ).sort();
  const requestedCurrency = parameterValue(parameters.currency).toUpperCase();
  const currency = currencyOptions.includes(requestedCurrency)
    ? requestedCurrency
    : (profile?.default_currency ?? currencyOptions[0] ?? "PHP");
  const range = reportingDateRange(period, new Date(), profile?.week_starts_on ?? 1);

  let transactionQuery = supabase
    .from("transactions")
    .select(
      "id,transaction_type,account_id,destination_account_id,category_id,amount,currency,status,transaction_date,description,merchant,category:categories!transactions_category_id_fkey(name,color),source_account:accounts!transactions_account_id_fkey(name)"
    )
    .eq("currency", currency)
    .order("transaction_date", { ascending: false })
    .limit(1000);
  if (range.from) {
    transactionQuery = transactionQuery.gte("transaction_date", range.from.toISOString());
  }
  if (range.to) {
    transactionQuery = transactionQuery.lte("transaction_date", range.to.toISOString());
  }

  const { data: transactions } = await transactionQuery;
  const rows = (transactions ?? []) as unknown as ReportingRow[];
  const totals = reportingTotals(rows, currency);
  const expenseData = categoryPortions(rows, currency);
  const monthlyData = monthlyCashFlow(rows, currency);
  const balanceById = new Map(
    (balances ?? []).map((balance) => [balance.id, Number(balance.current_balance)])
  );
  const visibleAccounts = (accounts ?? []).filter((account) => account.currency === currency);
  const totalBalance = visibleAccounts
    .filter((account) => account.include_in_total)
    .reduce((sum, account) => sum + (balanceById.get(account.id) ?? 0), 0);
  const net = totals.income - totals.expense;
  const recent = rows.slice(0, 6);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            {PERIOD_LABELS[period]} financial activity
          </p>
          <h1 className="text-2xl font-semibold">Overview</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex items-center gap-2">
            <NativeSelect aria-label="Dashboard period" defaultValue={period} name="period">
              {REPORTING_PERIODS.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {PERIOD_LABELS[value]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect aria-label="Dashboard currency" defaultValue={currency} name="currency">
              {currencyOptions.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {value}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button size="sm" type="submit" variant="outline">
              Apply
            </Button>
          </form>
          <Button asChild size="sm">
            <Link href="/transactions">
              <Plus data-icon="inline-start" />
              Add transaction
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          description="Included accounts"
          icon={<WalletCards className="size-4 text-muted-foreground" />}
          title="Total balance"
          value={<PrivateFinancialValue>{formatMoney(totalBalance, currency)}</PrivateFinancialValue>}
        />
        <SummaryCard
          className="text-emerald-600 dark:text-emerald-400"
          description="Completed entries"
          icon={<ArrowUpRight className="size-4 text-emerald-500" />}
          title="Income"
          value={<PrivateFinancialValue>{formatMoney(totals.income, currency)}</PrivateFinancialValue>}
        />
        <SummaryCard
          className="text-destructive"
          description={`${totals.count} completed entries`}
          icon={<ArrowDownRight className="size-4 text-destructive" />}
          title="Expenses"
          value={<PrivateFinancialValue>{formatMoney(totals.expense, currency)}</PrivateFinancialValue>}
        />
        <SummaryCard
          className={net < 0 ? "text-destructive" : undefined}
          description="Income minus expenses"
          icon={<Scale className="size-4 text-muted-foreground" />}
          title="Net cash flow"
          value={<PrivateFinancialValue>{formatMoney(net, currency)}</PrivateFinancialValue>}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Where your money went</CardTitle>
            <CardDescription>
              Expense portions by category for {PERIOD_LABELS[period].toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PrivateFinancialChart>
              <ExpenseDonutChart currency={currency} data={expenseData} />
            </PrivateFinancialChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Accounts</CardTitle>
            <CardDescription>Current balances in {currency}</CardDescription>
            <CardAction>
              <Button asChild size="sm" variant="ghost">
                <Link href="/accounts">Manage</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-1">
            {visibleAccounts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No active {currency} accounts.
              </p>
            ) : (
              visibleAccounts.map((account) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-muted/60"
                  key={account.id}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted"
                      style={{ color: account.color ?? undefined }}
                    >
                      <Landmark className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{account.name}</span>
                      <span className="block text-xs capitalize text-muted-foreground">
                        {account.account_type.replaceAll("_", " ")}
                      </span>
                    </span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    <PrivateFinancialValue>
                      {formatMoney(balanceById.get(account.id) ?? 0, currency)}
                    </PrivateFinancialValue>
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Monthly cash flow</CardTitle>
            <CardDescription>Completed income and expense activity</CardDescription>
          </CardHeader>
          <CardContent>
            <PrivateFinancialChart>
              <MonthlyCashFlowChart currency={currency} data={monthlyData} />
            </PrivateFinancialChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest entries in this view</CardDescription>
            <CardAction>
              <Button asChild size="sm" variant="ghost">
                <Link href="/transactions">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-1">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <ReceiptText className="size-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No activity in this period.</p>
              </div>
            ) : (
              recent.map((row) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
                  key={row.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{transactionTitle(row)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(row.transaction_date), "MMM d")}
                      {row.status !== "completed" ? (
                        <Badge className="ml-2" variant="outline">
                          {row.status}
                        </Badge>
                      ) : null}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium tabular-nums ${
                      row.transaction_type === "expense"
                        ? "text-destructive"
                        : row.transaction_type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : ""
                    }`}
                  >
                    {row.transaction_type === "expense"
                      ? "-"
                      : row.transaction_type === "income"
                        ? "+"
                        : ""}
                    <PrivateFinancialValue>{formatMoney(row.amount, row.currency)}</PrivateFinancialValue>
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function SummaryCard({
  title,
  description,
  value,
  icon,
  className,
}: {
  title: string;
  description: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>{icon}</CardAction>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={`text-xl font-semibold tabular-nums ${className ?? ""}`}>
        {value}
      </CardContent>
    </Card>
  );
}
