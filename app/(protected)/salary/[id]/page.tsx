import { format } from "date-fns";
import { ArrowLeft, BadgeDollarSign, RotateCcw, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SalaryRunForm } from "@/components/salary/salary-run-form";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  deleteSalaryDraft,
  postSalaryRun,
  unpostSalaryRun,
} from "@/features/salary/actions";
import {
  getSalaryOptions,
  getSalaryProfiles,
  getSalaryRun,
} from "@/features/salary/data";
import { formatMoney } from "@/lib/formatting/money";

type PageParams = Promise<{ id: string }>;

export default async function SalaryRunPage({ params }: { params: PageParams }) {
  const { id } = await params;
  const [run, profiles, options] = await Promise.all([
    getSalaryRun(id),
    getSalaryProfiles({ includeArchived: true }),
    getSalaryOptions({ includeArchived: true }),
  ]);
  if (!run) notFound();

  const posted = Boolean(run.transactionId);
  const account = options.accounts.find((item) => item.id === run.accountId);
  const category = options.categories.find((item) => item.id === run.incomeCategoryId);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild aria-label="Back to salary" size="icon-sm" variant="ghost">
            <Link href="/salary">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{run.profileName}</h1>
              <Badge variant={posted ? "default" : "secondary"}>
                {posted ? "Posted" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {run.employerName}
              {run.jobTitle ? ` - ${run.jobTitle}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {posted ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RotateCcw data-icon="inline-start" />
                  Unpost salary
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unpost this salary?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The linked net-income transaction will be removed and this record will return
                    to an editable draft.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <form action={unpostSalaryRun}>
                    <input name="id" type="hidden" value={run.id} />
                    <AlertDialogAction type="submit">Unpost salary</AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Trash2 data-icon="inline-start" />
                    Delete draft
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this salary draft?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the saved calculation. No ledger transaction has
                      been created yet.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <form action={deleteSalaryDraft}>
                      <input name="id" type="hidden" value={run.id} />
                      <AlertDialogAction type="submit" variant="destructive">
                        Delete draft
                      </AlertDialogAction>
                    </form>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={run.netPay <= 0}>
                    <Send data-icon="inline-start" />
                    Post net pay
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Post this salary to the ledger?</AlertDialogTitle>
                    <AlertDialogDescription>
                      MoneyLau will create one completed income transaction for{" "}
                      {formatMoney(run.netPay, run.currency)} in {account?.name ?? "the selected account"}.
                      Gross pay and deductions remain only in this salary record.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <form action={postSalaryRun}>
                      <input name="id" type="hidden" value={run.id} />
                      <AlertDialogAction type="submit">Post salary</AlertDialogAction>
                    </form>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {posted ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Gross pay</CardDescription>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {formatMoney(run.grossPay, run.currency)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Deductions</CardDescription>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {formatMoney(run.totalDeductions, run.currency)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Net received</CardDescription>
              </CardHeader>
              <CardContent className="text-xl font-semibold tabular-nums">
                {formatMoney(run.netPay, run.currency)}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeDollarSign />
                Posted salary record
              </CardTitle>
              <CardDescription>
                This record is read-only while its income transaction is posted.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">Payment date</dt>
                  <dd className="font-medium">
                    {format(new Date(`${run.paymentDate}T12:00:00`), "MMM d, yyyy")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Pay period</dt>
                  <dd className="font-medium">
                    {format(new Date(`${run.payPeriodStart}T12:00:00`), "MMM d")} -{" "}
                    {format(new Date(`${run.payPeriodEnd}T12:00:00`), "MMM d, yyyy")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Receiving account</dt>
                  <dd className="font-medium">{account?.name ?? "Account"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Income category</dt>
                  <dd className="font-medium">{category?.name ?? "Salary"}</dd>
                </div>
              </dl>
              <Separator />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Calculation</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {run.components.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-medium">{component.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{component.kind}</Badge>
                      </TableCell>
                      <TableCell>{component.calculationType.replaceAll("_", " ")}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(component.calculatedAmount, run.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {run.notes ? (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{run.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Edit salary draft</CardTitle>
            <CardDescription>
              Save changes before posting the final net amount to the ledger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalaryRunForm
              accounts={options.accounts}
              categories={options.categories}
              profiles={profiles}
              run={run}
            />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
