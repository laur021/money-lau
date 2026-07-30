import { format } from "date-fns";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FilePlus2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { BillDuplicateDialog } from "@/components/bills/bill-duplicate-dialog";
import { BillItemForm } from "@/components/bills/bill-item-form";
import { BillPaymentDialog } from "@/components/bills/bill-payment-dialog";
import { BillTemplateForm } from "@/components/bills/bill-template-form";
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
import {
  deleteBillItem,
  generateBillMonth,
  setBillTemplateArchived,
  unpostBillPayment,
} from "@/features/bills/actions";
import { getBillItems, getBillOptions, getBillTemplates } from "@/features/bills/data";
import type { BillDueState, BillItem, BillTotals } from "@/features/bills/types";
import {
  addMonths,
  billDueState,
  calculateBillTotals,
  isAdvanceBill,
  monthFromDate,
  monthLabel,
} from "@/lib/calculations/bills";
import { formatMoney } from "@/lib/formatting/money";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parameterValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function validMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function dueBadge(state: BillDueState) {
  if (state === "paid") return <Badge>Paid</Badge>;
  if (state === "overdue") return <Badge variant="destructive">Overdue</Badge>;
  if (state === "due_soon") return <Badge variant="outline">Due soon</Badge>;
  return <Badge variant="secondary">Upcoming</Badge>;
}

function CurrencyTotals({ totals, value }: { totals: BillTotals; value: "planned" | "paid" | "remaining" }) {
  const entries = Object.entries(totals);
  if (!entries.length) return <PrivateFinancialValue>{formatMoney(0, "PHP")}</PrivateFinancialValue>;
  return (
    <div className="flex flex-col gap-1">
      {entries.map(([currency, total]) => (
        <PrivateFinancialValue key={currency}>{formatMoney(total[value], currency)}</PrivateFinancialValue>
      ))}
    </div>
  );
}

function BillGroup({
  accounts,
  categories,
  defaultCurrency,
  items,
  plannerMonth,
  title,
}: {
  accounts: Awaited<ReturnType<typeof getBillOptions>>["accounts"];
  categories: Awaited<ReturnType<typeof getBillOptions>>["categories"];
  defaultCurrency: string;
  items: BillItem[];
  plannerMonth: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{items.length} planned {items.length === 1 ? "bill" : "bills"}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Due</TableHead>
              <TableHead>Bill</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Planned</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const paid = Boolean(item.transactionId);
              return (
                <TableRow key={item.id}>
                  <TableCell>{format(new Date(`${item.dueDate}T12:00:00`), "MMM d")}</TableCell>
                  <TableCell>
                    <div className="flex max-w-56 flex-col gap-1">
                      <span className="truncate font-medium">{item.name}</span>
                      {item.notes ? <span className="truncate text-xs text-muted-foreground">{item.notes}</span> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <span>{monthLabel(item.coverageMonth.slice(0, 7))}</span>
                      {isAdvanceBill(item) ? <Badge variant="outline">Advance</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <PrivateFinancialValue>{formatMoney(item.plannedAmount, item.currency)}</PrivateFinancialValue>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {item.actualPaidAmount === null ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      <PrivateFinancialValue>{formatMoney(item.actualPaidAmount, item.currency)}</PrivateFinancialValue>
                    )}
                  </TableCell>
                  <TableCell>{dueBadge(billDueState(item))}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {paid ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button aria-label={`Unpay ${item.name}`} size="icon-sm" variant="ghost">
                              <RotateCcw />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mark this bill unpaid?</AlertDialogTitle>
                              <AlertDialogDescription>
                                The linked expense transaction will be removed and the bill will return to the open list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <form action={unpostBillPayment}>
                                <input name="id" type="hidden" value={item.id} />
                                <AlertDialogAction type="submit">Unpay bill</AlertDialogAction>
                              </form>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <>
                          <BillPaymentDialog accounts={accounts} categories={categories} item={item} />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button aria-label={`Edit ${item.name}`} size="icon-sm" variant="ghost">
                                <Pencil />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Edit bill</DialogTitle>
                                <DialogDescription>Update this monthly bill without changing its template.</DialogDescription>
                              </DialogHeader>
                              <BillItemForm
                                accounts={accounts}
                                categories={categories}
                                defaultCurrency={defaultCurrency}
                                item={item}
                                plannerMonth={plannerMonth}
                              />
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button aria-label={`Delete ${item.name}`} size="icon-sm" variant="ghost">
                                <Trash2 />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
                                <AlertDialogDescription>This removes the unpaid planner item only.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <form action={deleteBillItem}>
                                  <input name="id" type="hidden" value={item.id} />
                                  <AlertDialogAction type="submit" variant="destructive">Delete bill</AlertDialogAction>
                                </form>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      <BillDuplicateDialog item={item} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function BillsPage({ searchParams }: { searchParams: SearchParams }) {
  const parameters = await searchParams;
  const requestedMonth = parameterValue(parameters.month);
  const plannerMonth = validMonth(requestedMonth) ? requestedMonth : monthFromDate(new Date());
  const [items, templates, options] = await Promise.all([
    getBillItems(plannerMonth),
    getBillTemplates({ includeArchived: true }),
    getBillOptions(),
  ]);
  const totals = calculateBillTotals(items);
  const groups = new Map<string, BillItem[]>();
  items.forEach((item) => {
    const group = item.categoryName ?? "Uncategorized";
    groups.set(group, [...(groups.get(group) ?? []), item]);
  });
  const activeTemplates = templates.filter((template) => !template.isArchived);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Plan what is due, then post each real payment to your ledger.</p>
          <h1 className="text-2xl font-semibold">Bills</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline"><FilePlus2 data-icon="inline-start" />New template</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create recurring bill template</DialogTitle>
                <DialogDescription>Templates create unpaid monthly bill snapshots when you start a month.</DialogDescription>
              </DialogHeader>
              <BillTemplateForm accounts={options.accounts} categories={options.categories} defaultCurrency={options.defaultCurrency} />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button><Plus data-icon="inline-start" />Add bill</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add one-off bill</DialogTitle>
                <DialogDescription>Create an unpaid expense plan for {monthLabel(plannerMonth)}.</DialogDescription>
              </DialogHeader>
              <BillItemForm accounts={options.accounts} categories={options.categories} defaultCurrency={options.defaultCurrency} plannerMonth={plannerMonth} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button asChild aria-label="Previous month" size="icon-sm" variant="ghost">
            <Link href={`/bills?month=${addMonths(plannerMonth, -1)}`}><ArrowLeft /></Link>
          </Button>
          <div className="min-w-44 text-center text-sm font-medium">{monthLabel(plannerMonth)}</div>
          <Button asChild aria-label="Next month" size="icon-sm" variant="ghost">
            <Link href={`/bills?month=${addMonths(plannerMonth, 1)}`}><ArrowRight /></Link>
          </Button>
        </div>
        <form action={generateBillMonth}>
          <input name="plannerMonth" type="hidden" value={plannerMonth} />
          <Button disabled={!activeTemplates.length} type="submit" variant="outline">
            <CalendarDays data-icon="inline-start" />Add recurring bills
          </Button>
        </form>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card size="sm"><CardHeader><CardTitle>Planned</CardTitle><CardDescription>All scheduled bills</CardDescription></CardHeader><CardContent className="text-xl font-semibold"><CurrencyTotals totals={totals} value="planned" /></CardContent></Card>
        <Card size="sm"><CardHeader><CardTitle>Paid</CardTitle><CardDescription>Posted expense payments</CardDescription></CardHeader><CardContent className="text-xl font-semibold"><CurrencyTotals totals={totals} value="paid" /></CardContent></Card>
        <Card size="sm"><CardHeader><CardTitle>Remaining</CardTitle><CardDescription>Still unpaid this month</CardDescription></CardHeader><CardContent className="text-xl font-semibold"><CurrencyTotals totals={totals} value="remaining" /></CardContent></Card>
      </section>

      <Tabs defaultValue="bills">
        <TabsList>
          <TabsTrigger value="bills">Monthly bills</TabsTrigger>
          <TabsTrigger value="templates">Recurring templates</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4 flex flex-col gap-4" value="bills">
          {items.length ? (
            [...groups.entries()].map(([title, categoryItems]) => (
              <BillGroup
                accounts={options.accounts}
                categories={options.categories}
                defaultCurrency={options.defaultCurrency}
                items={categoryItems}
                key={title}
                plannerMonth={plannerMonth}
                title={title}
              />
            ))
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><WalletCards /></EmptyMedia>
                <EmptyTitle>No bills for {monthLabel(plannerMonth)}</EmptyTitle>
                <EmptyDescription>Add a one-off bill or start this month from your recurring templates.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>
        <TabsContent className="mt-4" value="templates">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Recurring templates</CardTitle>
              <CardDescription>Templates only affect new monthly bill snapshots.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {templates.length ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Bill</TableHead><TableHead>Due</TableHead><TableHead>Default amount</TableHead><TableHead>Default account</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell><div className="flex flex-col"><span className="font-medium">{template.name}</span>{template.notes ? <span className="max-w-56 truncate text-xs text-muted-foreground">{template.notes}</span> : null}</div></TableCell>
                        <TableCell>Day {template.dueDay}</TableCell>
                        <TableCell className="tabular-nums"><PrivateFinancialValue>{formatMoney(template.defaultAmount, template.currency)}</PrivateFinancialValue></TableCell>
                        <TableCell>{options.accounts.find((account) => account.id === template.defaultAccountId)?.name ?? "Choose when paid"}</TableCell>
                        <TableCell><Badge variant={template.isArchived ? "outline" : "secondary"}>{template.isArchived ? "Archived" : "Active"}</Badge></TableCell>
                        <TableCell><div className="flex justify-end gap-1">
                          {!template.isArchived ? <Dialog><DialogTrigger asChild><Button aria-label={`Edit ${template.name}`} size="icon-sm" variant="ghost"><Pencil /></Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Edit recurring bill</DialogTitle><DialogDescription>Past monthly bills keep their saved details.</DialogDescription></DialogHeader><BillTemplateForm accounts={options.accounts} categories={options.categories} defaultCurrency={options.defaultCurrency} template={template} /></DialogContent></Dialog> : null}
                          <form action={setBillTemplateArchived}><input name="id" type="hidden" value={template.id} /><input name="isArchived" type="hidden" value={template.isArchived ? "false" : "true"} /><Button aria-label={template.isArchived ? `Restore ${template.name}` : `Archive ${template.name}`} size="icon-sm" type="submit" variant="ghost">{template.isArchived ? <RotateCcw /> : <Archive />}</Button></form>
                        </div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <Empty><EmptyHeader><EmptyMedia variant="icon"><CalendarDays /></EmptyMedia><EmptyTitle>No recurring templates</EmptyTitle><EmptyDescription>Create a template for a bill you pay regularly.</EmptyDescription></EmptyHeader></Empty>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
