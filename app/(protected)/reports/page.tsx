import { ExpenseDonutChart } from "@/components/charts/expense-donut-chart";
import { MonthlyCashFlowChart } from "@/components/charts/monthly-cash-flow-chart";
import {
  PrivateFinancialChart,
  PrivateFinancialValue,
} from "@/components/privacy/screen-privacy";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PERIOD_LABELS,
  REPORTING_PERIODS,
  isReportingPeriod,
  reportingDateRange,
} from "@/lib/calculations/periods";
import {
  categoryPortions,
  largestActivity,
  monthlyCashFlow,
  reportingTotals,
  type ReportingRow,
} from "@/lib/calculations/reporting";
import { formatMoney } from "@/lib/formatting/money";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Download, Scale } from "lucide-react";
import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parameterValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const parameters = await searchParams;
  const supabase = await createClient();
  const [{ data: profile }, { data: accounts }, { data: categories }] = await Promise.all([
    supabase.from("profiles").select("default_currency,week_starts_on").maybeSingle(),
    supabase.from("accounts").select("id,name,currency").order("display_order").order("name"),
    supabase
      .from("categories")
      .select("id,name,transaction_type")
      .order("transaction_type")
      .order("display_order")
      .order("name"),
  ]);

  const requestedPeriod = parameterValue(parameters.period);
  const period = isReportingPeriod(requestedPeriod) ? requestedPeriod : "this_year";
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
  const account = parameterValue(parameters.account);
  const category = parameterValue(parameters.category);
  const status = parameterValue(parameters.status);
  const range = reportingDateRange(period, new Date(), profile?.week_starts_on ?? 1);

  let query = supabase
    .from("transactions")
    .select(
      "id,transaction_type,account_id,destination_account_id,category_id,amount,currency,status,transaction_date,description,merchant,category:categories!transactions_category_id_fkey(name,color),source_account:accounts!transactions_account_id_fkey(name)"
    )
    .eq("currency", currency)
    .order("transaction_date", { ascending: false })
    .limit(2000);
  if (range.from) query = query.gte("transaction_date", range.from.toISOString());
  if (range.to) query = query.lte("transaction_date", range.to.toISOString());
  if (account) {
    query = query.or(`account_id.eq.${account},destination_account_id.eq.${account}`);
  }
  if (category) query = query.eq("category_id", category);
  if (["completed", "pending", "cancelled"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data: transactions } = await query;
  const rows = (transactions ?? []) as unknown as ReportingRow[];
  const totals = reportingTotals(rows, currency);
  const expenses = categoryPortions(rows, currency, "expense");
  const income = categoryPortions(rows, currency, "income");
  const monthly = monthlyCashFlow(rows, currency);
  const largestExpenses = largestActivity(rows, currency, "expense");
  const largestIncome = largestActivity(rows, currency, "income");
  const net = totals.income - totals.expense;
  const exportParameters = new URLSearchParams();
  Object.entries({ period, currency, account, category, status }).forEach(([key, value]) => {
    if (value) exportParameters.set(key, value);
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            Explore completed activity and category distribution
          </p>
          <h1 className="text-2xl font-semibold">Reports</h1>
        </div>
        <Button asChild variant="outline">
          <a href={`/api/reports/transactions.csv?${exportParameters.toString()}`}>
            <Download data-icon="inline-start" />
            Export filtered CSV
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Report filters</CardTitle>
          <CardDescription>
            Transfer activity is listed in exports but excluded from income and expense summaries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <FieldGroup className="contents">
              <FilterSelect label="Period" name="period" value={period}>
                {REPORTING_PERIODS.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {PERIOD_LABELS[value]}
                  </NativeSelectOption>
                ))}
              </FilterSelect>
              <FilterSelect label="Currency" name="currency" value={currency}>
                {currencyOptions.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {value}
                  </NativeSelectOption>
                ))}
              </FilterSelect>
              <FilterSelect label="Account" name="account" value={account}>
                <NativeSelectOption value="">All accounts</NativeSelectOption>
                {(accounts ?? []).map((item) => (
                  <NativeSelectOption key={item.id} value={item.id}>
                    {item.name}
                  </NativeSelectOption>
                ))}
              </FilterSelect>
              <FilterSelect label="Category" name="category" value={category}>
                <NativeSelectOption value="">All categories</NativeSelectOption>
                {(categories ?? []).map((item) => (
                  <NativeSelectOption key={item.id} value={item.id}>
                    {item.name}
                  </NativeSelectOption>
                ))}
              </FilterSelect>
              <FilterSelect label="Status" name="status" value={status}>
                <NativeSelectOption value="">All statuses</NativeSelectOption>
                <NativeSelectOption value="completed">Completed</NativeSelectOption>
                <NativeSelectOption value="pending">Pending</NativeSelectOption>
                <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
              </FilterSelect>
            </FieldGroup>
            <div className="flex gap-2 sm:col-span-2 xl:col-span-5">
              <Button type="submit">Apply filters</Button>
              <Button asChild variant="ghost">
                <Link href="/reports">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-3 sm:grid-cols-3">
        <ReportTotal
          className="text-emerald-600 dark:text-emerald-400"
          icon={<ArrowUpRight className="size-4 text-emerald-500" />}
          label="Income"
          value={<PrivateFinancialValue>{formatMoney(totals.income, currency)}</PrivateFinancialValue>}
        />
        <ReportTotal
          className="text-destructive"
          icon={<ArrowDownRight className="size-4 text-destructive" />}
          label="Expenses"
          value={<PrivateFinancialValue>{formatMoney(totals.expense, currency)}</PrivateFinancialValue>}
        />
        <ReportTotal
          className={net < 0 ? "text-destructive" : undefined}
          icon={<Scale className="size-4 text-muted-foreground" />}
          label="Net cash flow"
          value={<PrivateFinancialValue>{formatMoney(net, currency)}</PrivateFinancialValue>}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Expense distribution</CardTitle>
            <CardDescription>{PERIOD_LABELS[period]} category portions</CardDescription>
          </CardHeader>
          <CardContent>
            <PrivateFinancialChart>
              <ExpenseDonutChart currency={currency} data={expenses} />
            </PrivateFinancialChart>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Income sources</CardTitle>
            <CardDescription>Completed income by category</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1">
            {income.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No completed income in this report.
              </p>
            ) : (
              income.map((item) => (
                <div
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-2 py-2"
                  key={item.id}
                >
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </span>
                  <PrivateFinancialValue className="text-sm">
                    {formatMoney(item.value, currency)}
                  </PrivateFinancialValue>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Cash-flow trend</CardTitle>
          <CardDescription>Income and expenses grouped by month</CardDescription>
        </CardHeader>
        <CardContent>
          <PrivateFinancialChart>
            <MonthlyCashFlowChart currency={currency} data={monthly} />
          </PrivateFinancialChart>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActivityTable currency={currency} rows={largestExpenses} title="Largest expenses" />
        <ActivityTable currency={currency} rows={largestIncome} title="Largest income" />
      </section>
    </main>
  );
}

function FilterSelect({
  label,
  name,
  value,
  children,
}: {
  label: string;
  name: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`report-${name}`}>{label}</FieldLabel>
      <NativeSelect className="w-full" defaultValue={value} id={`report-${name}`} name={name}>
        {children}
      </NativeSelect>
    </Field>
  );
}

function ReportTotal({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardAction>{icon}</CardAction>
      </CardHeader>
      <CardContent className={`text-xl font-semibold tabular-nums ${className ?? ""}`}>
        {value}
      </CardContent>
    </Card>
  );
}

function ActivityTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: ReportingRow[];
  currency: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>Top completed entries in this report</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="h-20 text-center text-muted-foreground" colSpan={3}>
                  No completed activity.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="block max-w-56 truncate font-medium">
                      {row.merchant || row.description || row.category?.name || "Transaction"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {row.category?.name ?? row.source_account?.name ?? "Uncategorized"}
                    </span>
                  </TableCell>
                  <TableCell>{format(new Date(row.transaction_date), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    <PrivateFinancialValue>{formatMoney(row.amount, currency)}</PrivateFinancialValue>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
