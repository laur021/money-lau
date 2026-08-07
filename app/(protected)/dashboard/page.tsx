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
import { getBillItems } from "@/features/bills/data";
import type { BillDueState, BillItem } from "@/features/bills/types";
import { getSalaryRuns } from "@/features/salary/data";
import {
  billDueState,
  calculateBillTotals,
  monthFromDate,
  monthLabel,
} from "@/lib/calculations/bills";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  CalendarClock,
  CircleAlert,
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

function dateIsInRange(value: string, range: { from?: Date; to?: Date }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

function dueBadge(state: BillDueState) {
  if (state === "overdue") return <Badge variant="destructive">Overdue</Badge>;
  if (state === "due_soon") return <Badge variant="outline">Due soon</Badge>;
  if (state === "paid") return <Badge>Paid</Badge>;
  return <Badge variant="secondary">Upcoming</Badge>;
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
    ]),
  ).sort();
  const requestedCurrency = parameterValue(parameters.currency).toUpperCase();
  const currency = currencyOptions.includes(requestedCurrency)
    ? requestedCurrency
    : (profile?.default_currency ?? currencyOptions[0] ?? "PHP");
  const range = reportingDateRange(period, new Date(), profile?.week_starts_on ?? 1);
  const plannerMonth = period === "last_month"
    ? monthFromDate(range.from ?? new Date())
    : monthFromDate(new Date());

  let transactionQuery = supabase
    .from("transactions")
    .select(
      "id,transaction_type,account_id,destination_account_id,category_id,amount,currency,status,transaction_date,description,merchant,category:categories!transactions_category_id_fkey(name,color),source_account:accounts!transactions_account_id_fkey(name)",
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

  const [{ data: transactions }, billItems, salaryRuns] = await Promise.all([
    transactionQuery,
    getBillItems(plannerMonth),
    getSalaryRuns(100),
  ]);
  const rows = (transactions ?? []) as unknown as ReportingRow[];
  const totals = reportingTotals(rows, currency);
  const expenseData = categoryPortions(rows, currency);
  const monthlyData = monthlyCashFlow(rows, currency);
  const balanceById = new Map(
    (balances ?? []).map((balance) => [balance.id, Number(balance.current_balance)]),
  );
  const visibleAccounts = (accounts ?? []).filter((account) => account.currency === currency);
  const totalBalance = visibleAccounts
    .filter((account) => account.include_in_total)
    .reduce((sum, account) => sum + (balanceById.get(account.id) ?? 0), 0);
  const net = totals.income - totals.expense;
  const currentBills = billItems.filter((item) => item.currency === currency);
  const billTotals = calculateBillTotals(currentBills);
  const remainingBills = billTotals[currency]?.remaining ?? 0;
  const afterBills = totalBalance - remainingBills;
  const unpaidBills = currentBills
    .filter((item) => !item.transactionId)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  const overdueBills = unpaidBills.filter((item) => billDueState(item) === "overdue");
  const postedSalaryRuns = salaryRuns
    .filter((run) => run.currency === currency && run.transactionId)
    .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate));
  const salaryInPeriod = postedSalaryRuns.filter((run) => dateIsInRange(run.paymentDate, range));
  const latestSalary = salaryInPeriod[0] ?? postedSalaryRuns[0];
  const currentYear = String(new Date().getFullYear());
  const salaryYearToDate = postedSalaryRuns
    .filter((run) => run.paymentDate.startsWith(currentYear))
    .reduce((sum, run) => sum + run.netPay, 0);
  const recent = rows.slice(0, 6);
  const recentIds = recent.map((row) => row.id).filter((id): id is string => Boolean(id));
  const salaryLinkByTransaction = new Map<string, string>();
  const billLinkByTransaction = new Map<string, string>();
  if (recentIds.length) {
    const [{ data: salaryLinks }, { data: billLinks }] = await Promise.all([
      supabase.from("salary_runs").select("id,transaction_id").in("transaction_id", recentIds),
      supabase.from("bill_items").select("id,transaction_id").in("transaction_id", recentIds),
    ]);
    (salaryLinks ?? []).forEach((link) => {
      if (link.transaction_id) salaryLinkByTransaction.set(link.transaction_id, link.id);
    });
    (billLinks ?? []).forEach((link) => {
      if (link.transaction_id) billLinkByTransaction.set(link.transaction_id, link.id);
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Your financial command center</p>
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

      <AccountRail
        accounts={visibleAccounts}
        balanceById={balanceById}
        currency={currency}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          description="Included active accounts"
          icon={<WalletCards className="size-4 text-muted-foreground" />}
          title="Available balance"
          value={<PrivateFinancialValue>{formatMoney(totalBalance, currency)}</PrivateFinancialValue>}
        />
        <SummaryCard
          className="text-emerald-600 dark:text-emerald-400"
          description="Completed income"
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
        <SummaryCard
          className={afterBills < 0 ? "text-destructive" : undefined}
          description={`${unpaidBills.length} unpaid bill${unpaidBills.length === 1 ? "" : "s"}`}
          icon={<CalendarClock className="size-4 text-muted-foreground" />}
          title="After bills"
          value={<PrivateFinancialValue>{formatMoney(afterBills, currency)}</PrivateFinancialValue>}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
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

        <BillsOutlook
          currency={currency}
          items={currentBills}
          month={plannerMonth}
          overdueCount={overdueBills.length}
          remaining={remainingBills}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Cash-flow trend</CardTitle>
            <CardDescription>Completed income and expense activity</CardDescription>
          </CardHeader>
          <CardContent>
            <PrivateFinancialChart>
              <MonthlyCashFlowChart currency={currency} data={monthlyData} />
            </PrivateFinancialChart>
          </CardContent>
        </Card>

        <SalarySnapshot
          currency={currency}
          latestSalary={latestSalary}
          salaryYearToDate={salaryYearToDate}
        />
      </section>

      <section>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Latest completed and pending entries in this view</CardDescription>
            <CardAction>
              <Button asChild size="sm" variant="ghost">
                <Link href="/transactions">
                  View all <ArrowRight data-icon="inline-end" />
                </Link>
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
              recent.map((row) => {
                const source = row.id && salaryLinkByTransaction.has(row.id)
                  ? "Salary"
                  : row.id && billLinkByTransaction.has(row.id)
                    ? "Bill"
                    : "Manual";
                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-muted/60"
                    key={row.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        {source === "Salary" ? <BadgeDollarSign /> : source === "Bill" ? <CalendarClock /> : <ReceiptText />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{transactionTitle(row)}</p>
                        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {format(new Date(row.transaction_date), "MMM d")}
                          {row.source_account?.name ? <span>{row.source_account.name}</span> : null}
                          <Badge variant="outline">{source}</Badge>
                          {row.status !== "completed" ? <Badge variant="outline">{row.status}</Badge> : null}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-medium tabular-nums",
                        row.transaction_type === "expense" && "text-destructive",
                        row.transaction_type === "income" && "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {row.transaction_type === "expense" ? "-" : row.transaction_type === "income" ? "+" : ""}
                      <PrivateFinancialValue>{formatMoney(row.amount, row.currency)}</PrivateFinancialValue>
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function AccountRail({
  accounts,
  balanceById,
  currency,
}: {
  accounts: { id: string; name: string; account_type: string; color: string | null }[];
  balanceById: Map<string, number>;
  currency: string;
}) {
  return (
    <section className="flex gap-3 overflow-x-auto pb-1" aria-label="Accounts">
      {accounts.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="font-medium">Add your first account</p>
              <p className="text-sm text-muted-foreground">Balances and bill affordability start here.</p>
            </div>
            <Button asChild size="sm">
              <Link href="/accounts">
                <Plus data-icon="inline-start" /> Add account
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        accounts.map((account) => (
          <Card className="min-w-56 shrink-0" key={account.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <Link className="flex min-w-0 items-center gap-3" href={`/transactions?account=${account.id}`}>
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted"
                  style={{ color: account.color ?? undefined }}
                >
                  <Landmark />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{account.name}</span>
                  <span className="block truncate text-xs capitalize text-muted-foreground">
                    {account.account_type.replaceAll("_", " ")}
                  </span>
                </span>
              </Link>
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
                <PrivateFinancialValue>{formatMoney(balanceById.get(account.id) ?? 0, currency)}</PrivateFinancialValue>
              </span>
            </CardContent>
          </Card>
        ))
      )}
    </section>
  );
}

function BillsOutlook({
  currency,
  items,
  month,
  overdueCount,
  remaining,
}: {
  currency: string;
  items: BillItem[];
  month: string;
  overdueCount: number;
  remaining: number;
}) {
  const unpaid = items.filter((item) => !item.transactionId).sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Bills outlook</CardTitle>
        <CardDescription>{monthLabel(month)} planned payments</CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/bills?month=${month}`}>Open Bills</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="mt-1 font-semibold tabular-nums"><PrivateFinancialValue>{formatMoney(remaining, currency)}</PrivateFinancialValue></p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="mt-1 font-semibold tabular-nums">{overdueCount}</p>
          </div>
        </div>
        {unpaid.length ? (
          <div className="grid gap-1">
            {unpaid.slice(0, 4).map((item) => (
              <div className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/60" key={item.id}>
                <div className="flex min-w-0 items-center gap-2">
                  {billDueState(item) === "overdue" ? <CircleAlert className="size-4 shrink-0 text-destructive" /> : <CalendarClock className="size-4 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 truncate text-sm">{item.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {dueBadge(billDueState(item))}
                  <span className="text-sm tabular-nums"><PrivateFinancialValue>{formatMoney(item.plannedAmount, currency)}</PrivateFinancialValue></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No unpaid bills for this month.</p>
        )}
      </CardContent>
    </Card>
  );
}

function SalarySnapshot({
  currency,
  latestSalary,
  salaryYearToDate,
}: {
  currency: string;
  latestSalary?: { netPay: number; paymentDate: string; profileName: string };
  salaryYearToDate: number;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Salary snapshot</CardTitle>
        <CardDescription>Received income from posted salary runs</CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href="/salary">Open Salary</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {latestSalary ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <BadgeDollarSign />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{latestSalary.profileName}</p>
                <p className="text-xs text-muted-foreground">Received {format(new Date(latestSalary.paymentDate), "MMM d, yyyy")}</p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums"><PrivateFinancialValue>{formatMoney(latestSalary.netPay, currency)}</PrivateFinancialValue></span>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">No posted salary in this view.</p>
        )}
        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Net received this year</span>
          <span className="font-semibold tabular-nums"><PrivateFinancialValue>{formatMoney(salaryYearToDate, currency)}</PrivateFinancialValue></span>
        </div>
      </CardContent>
    </Card>
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
      <CardContent className={cn("text-xl font-semibold tabular-nums", className)}>
        {value}
      </CardContent>
    </Card>
  );
}
