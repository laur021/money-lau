import { InstitutionLogo } from "@/components/accounts/institution-logo";
import { FinancialMetricCard } from "@/components/finance/financial-metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { PrivateFinancialValue } from "@/components/privacy/screen-privacy";
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
import { reportingTotals, type ReportingRow } from "@/lib/calculations/reporting";
import { formatMoney } from "@/lib/formatting/money";
import { createClient } from "@/lib/supabase/server";
import {
  CalendarClock,
  CircleAlert,
  Plus,
  Scale,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parameterValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
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
      .select("id,name,institution_name,currency,account_type,include_in_total,is_archived,color")
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

  const [{ data: transactions }, billItems] = await Promise.all([
    transactionQuery,
    getBillItems(plannerMonth),
  ]);
  const rows = (transactions ?? []) as unknown as ReportingRow[];
  const totals = reportingTotals(rows, currency);
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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        actions={
          <>
          <form className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <NativeSelect
              aria-label="Dashboard period"
              className="sm:w-auto"
              defaultValue={period}
              name="period"
            >
              {REPORTING_PERIODS.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {PERIOD_LABELS[value]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Dashboard currency"
              className="sm:w-auto"
              defaultValue={currency}
              name="currency"
            >
              {currencyOptions.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {value}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button className="col-span-2 sm:col-auto" size="sm" type="submit" variant="outline">
              Apply
            </Button>
          </form>
          <Button asChild className="w-full sm:w-auto" size="sm">
            <Link href="/transactions">
              <Plus data-icon="inline-start" />
              Add transaction
            </Link>
          </Button>
          </>
        }
        description="Your current position and the commitments that need attention."
        title="Overview"
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <FinancialMetricCard
          description="Included active accounts"
          icon={<WalletCards className="size-4" />}
          label="Available balance"
          value={<PrivateFinancialValue>{formatMoney(totalBalance, currency)}</PrivateFinancialValue>}
        />
        <FinancialMetricCard
          description={
            <>
              <span className="text-primary">In <PrivateFinancialValue>{formatMoney(totals.income, currency)}</PrivateFinancialValue></span>
              <span aria-hidden="true"> · </span>
              <span className="text-destructive">Out <PrivateFinancialValue>{formatMoney(totals.expense, currency)}</PrivateFinancialValue></span>
            </>
          }
          icon={<Scale className="size-4" />}
          label="Net cash flow"
          tone={net < 0 ? "negative" : net > 0 ? "positive" : "default"}
          value={<PrivateFinancialValue>{formatMoney(net, currency)}</PrivateFinancialValue>}
        />
        <FinancialMetricCard
          description={`${unpaidBills.length} unpaid bill${unpaidBills.length === 1 ? "" : "s"}`}
          icon={<CalendarClock className="size-4" />}
          label="After bills"
          tone={afterBills < 0 ? "negative" : "default"}
          value={<PrivateFinancialValue>{formatMoney(afterBills, currency)}</PrivateFinancialValue>}
        />
      </section>

      <BillsOutlook
        currency={currency}
        items={currentBills}
        month={plannerMonth}
        overdueCount={overdueBills.length}
        remaining={remainingBills}
      />

      <AccountRail
        accounts={visibleAccounts}
        balanceById={balanceById}
        currency={currency}
      />
    </main>
  );
}

function AccountRail({
  accounts,
  balanceById,
  currency,
}: {
  accounts: {
    id: string;
    name: string;
    institution_name: string | null;
    account_type: string;
  }[];
  balanceById: Map<string, number>;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Account balances</CardTitle>
        <CardDescription>
          {accounts.length} active account{accounts.length === 1 ? "" : "s"} in {currency}
        </CardDescription>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link href="/accounts">Manage accounts</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
      {accounts.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <div>
            <p className="font-medium">Add your first account</p>
            <p className="text-sm text-muted-foreground">Balances and bill affordability start here.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/accounts">
              <Plus data-icon="inline-start" /> Add account
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {accounts.map((account) => (
            <Link
              className="flex min-w-0 items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-muted"
              href={`/transactions?account=${account.id}`}
              key={account.id}
            >
              <span className="flex min-w-0 items-center gap-3">
                <InstitutionLogo
                  accountType={account.account_type}
                  institutionName={account.institution_name ?? account.name}
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{account.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {account.institution_name ?? account.account_type.replaceAll("_", " ")}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
                <PrivateFinancialValue>{formatMoney(balanceById.get(account.id) ?? 0, currency)}</PrivateFinancialValue>
              </span>
            </Link>
          ))}
        </div>
      )}
      </CardContent>
    </Card>
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
          <Button asChild size="sm" variant={overdueCount > 0 ? "warning" : "secondary"}>
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
