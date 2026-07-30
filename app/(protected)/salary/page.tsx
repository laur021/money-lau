import { format, isSameYear } from "date-fns";
import {
  Archive,
  BadgeDollarSign,
  BriefcaseBusiness,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { PrivateFinancialValue } from "@/components/privacy/screen-privacy";
import { SalaryProfileForm } from "@/components/salary/salary-profile-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setSalaryProfileArchived } from "@/features/salary/actions";
import { getSalaryOptions, getSalaryProfiles, getSalaryRuns } from "@/features/salary/data";
import type { SalaryRun } from "@/features/salary/types";
import { formatMoney } from "@/lib/formatting/money";

function formatFrequency(value: string) {
  return {
    weekly: "Weekly",
    biweekly: "Every two weeks",
    semi_monthly: "Twice a month",
    monthly: "Monthly",
  }[value] ?? value;
}

function totalsByCurrency(runs: SalaryRun[]) {
  return runs.reduce<Record<string, { gross: number; deductions: number; net: number }>>(
    (totals, run) => {
      totals[run.currency] ??= { gross: 0, deductions: 0, net: 0 };
      totals[run.currency].gross += run.grossPay;
      totals[run.currency].deductions += run.totalDeductions;
      totals[run.currency].net += run.netPay;
      return totals;
    },
    {},
  );
}

function CurrencyTotals({
  totals,
  value,
}: {
  totals: ReturnType<typeof totalsByCurrency>;
  value: "gross" | "deductions" | "net";
}) {
  const entries = Object.entries(totals);
  return entries.length ? (
    <div className="flex flex-col gap-1">
      {entries.map(([currency, amount]) => (
        <span className="tabular-nums" key={currency}>
          <PrivateFinancialValue>{formatMoney(amount[value], currency)}</PrivateFinancialValue>
        </span>
      ))}
    </div>
  ) : (
    <PrivateFinancialValue>{formatMoney(0, "PHP")}</PrivateFinancialValue>
  );
}

export default async function SalaryPage() {
  const [profiles, runs, options] = await Promise.all([
    getSalaryProfiles({ includeArchived: true }),
    getSalaryRuns(),
    getSalaryOptions(),
  ]);
  const activeProfiles = profiles.filter((profile) => !profile.isArchived);
  const drafts = runs.filter((run) => !run.transactionId);
  const posted = runs.filter((run) => run.transactionId);
  const ytdTotals = totalsByCurrency(
    posted.filter((run) => isSameYear(new Date(`${run.paymentDate}T12:00:00`), new Date())),
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            Calculate gross pay, deductions, and the net amount received
          </p>
          <h1 className="text-2xl font-semibold">Salary</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BriefcaseBusiness data-icon="inline-start" />
                New profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>Create salary profile</DialogTitle>
                <DialogDescription>
                  Store recurring pay details and defaults for future calculations.
                </DialogDescription>
              </DialogHeader>
              <SalaryProfileForm
                accounts={options.accounts}
                categories={options.categories}
                defaultCurrency={options.defaultCurrency}
              />
            </DialogContent>
          </Dialog>
          <Button asChild disabled={!activeProfiles.length}>
            <Link
              aria-disabled={!activeProfiles.length}
              href={activeProfiles.length ? "/salary/new" : "/salary"}
            >
              <Plus data-icon="inline-start" />
              Calculate salary
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Year-to-date gross</CardDescription>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            <CurrencyTotals totals={ytdTotals} value="gross" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Year-to-date deductions</CardDescription>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            <CurrencyTotals totals={ytdTotals} value="deductions" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Year-to-date net received</CardDescription>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            <CurrencyTotals totals={ytdTotals} value="net" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Pay runs</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4 flex flex-col gap-4" value="runs">
          <Card>
            <CardHeader>
              <CardTitle>Drafts</CardTitle>
              <CardDescription>
                Review and post a draft when the salary reaches your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {drafts.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment date</TableHead>
                      <TableHead>Profile</TableHead>
                      <TableHead>Pay period</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net pay</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drafts.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          {format(new Date(`${run.paymentDate}T12:00:00`), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{run.profileName}</span>
                            <span className="text-xs text-muted-foreground">
                              {run.employerName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(`${run.payPeriodStart}T12:00:00`), "MMM d")} -{" "}
                          {format(new Date(`${run.payPeriodEnd}T12:00:00`), "MMM d")}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <PrivateFinancialValue>
                            {formatMoney(run.grossPay, run.currency)}
                          </PrivateFinancialValue>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <PrivateFinancialValue>
                            {formatMoney(run.totalDeductions, run.currency)}
                          </PrivateFinancialValue>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          <PrivateFinancialValue>
                            {formatMoney(run.netPay, run.currency)}
                          </PrivateFinancialValue>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/salary/${run.id}`}>Review</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BadgeDollarSign />
                    </EmptyMedia>
                    <EmptyTitle>No salary drafts</EmptyTitle>
                    <EmptyDescription>
                      Start a calculation from one of your active salary profiles.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Posted history</CardTitle>
              <CardDescription>
                Posted net pay is included in accounts, dashboard totals, reports, and exports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posted.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment date</TableHead>
                      <TableHead>Profile</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net received</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posted.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          {format(new Date(`${run.paymentDate}T12:00:00`), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{run.profileName}</span>
                            <span className="text-xs text-muted-foreground">
                              {run.employerName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <PrivateFinancialValue>
                            {formatMoney(run.grossPay, run.currency)}
                          </PrivateFinancialValue>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <PrivateFinancialValue>
                            {formatMoney(run.totalDeductions, run.currency)}
                          </PrivateFinancialValue>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          <PrivateFinancialValue>
                            {formatMoney(run.netPay, run.currency)}
                          </PrivateFinancialValue>
                        </TableCell>
                        <TableCell>
                          <Badge>Posted</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/salary/${run.id}`}>Open</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BadgeDollarSign />
                    </EmptyMedia>
                    <EmptyTitle>No posted salary yet</EmptyTitle>
                    <EmptyDescription>
                      Posting a reviewed draft creates its net income transaction.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-4" value="profiles">
          <Card>
            <CardHeader>
              <CardTitle>Salary profiles</CardTitle>
              <CardDescription>
                Reuse employer, pay frequency, account, category, and component defaults.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profiles.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profile</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Base pay</TableHead>
                      <TableHead>Components</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{profile.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {profile.employerName}
                              {profile.jobTitle ? ` - ${profile.jobTitle}` : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatFrequency(profile.payFrequency)}</TableCell>
                        <TableCell className="tabular-nums">
                          <PrivateFinancialValue>
                            {formatMoney(profile.basePay, profile.currency)}
                          </PrivateFinancialValue>
                        </TableCell>
                        <TableCell>{profile.components.length}</TableCell>
                        <TableCell>
                          <Badge variant={profile.isArchived ? "outline" : "secondary"}>
                            {profile.isArchived ? "Archived" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {!profile.isArchived ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    aria-label={`Edit ${profile.name}`}
                                    size="icon-sm"
                                    variant="ghost"
                                  >
                                    <Pencil />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                                  <DialogHeader>
                                    <DialogTitle>Edit salary profile</DialogTitle>
                                    <DialogDescription>
                                      Existing pay runs keep their saved component snapshots.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <SalaryProfileForm
                                    accounts={options.accounts}
                                    categories={options.categories}
                                    defaultCurrency={options.defaultCurrency}
                                    profile={profile}
                                  />
                                </DialogContent>
                              </Dialog>
                            ) : null}
                            <form action={setSalaryProfileArchived}>
                              <input name="id" type="hidden" value={profile.id} />
                              <input
                                name="isArchived"
                                type="hidden"
                                value={profile.isArchived ? "false" : "true"}
                              />
                              <Button
                                aria-label={
                                  profile.isArchived
                                    ? `Restore ${profile.name}`
                                    : `Archive ${profile.name}`
                                }
                                size="icon-sm"
                                type="submit"
                                variant="ghost"
                              >
                                {profile.isArchived ? <RotateCcw /> : <Archive />}
                              </Button>
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
                    <EmptyMedia variant="icon">
                      <BriefcaseBusiness />
                    </EmptyMedia>
                    <EmptyTitle>No salary profiles</EmptyTitle>
                    <EmptyDescription>
                      Create a profile before calculating your first salary.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
