import { ArrowUpRight, BarChart3, CreditCard, FolderTree, LayoutDashboard, Plus, ReceiptText } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const navigation = [
  { label: "Overview", icon: LayoutDashboard }, { label: "Transactions", icon: ReceiptText },
  { label: "Accounts", icon: CreditCard }, { label: "Categories", icon: FolderTree }, { label: "Reports", icon: BarChart3 },
];

export function AppShell() {
  return <div className="min-h-screen bg-background">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar lg:flex lg:flex-col">
      <div className="px-5 py-5"><AppLogo /></div><Separator />
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Primary navigation">
        {navigation.map(({ icon: Icon, label }, index) => <div className={index === 0 ? "flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2 text-sm font-medium" : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground"} key={label}><Icon className="size-4" aria-hidden="true" />{label}</div>)}
      </nav>
      <div className="p-3"><ThemeToggle /></div>
    </aside>
    <main className="pb-20 lg:pl-64 lg:pb-0">
      <header className="flex items-center justify-between border-b px-4 py-4 sm:px-6"><div className="lg:hidden"><AppLogo /></div><p className="hidden text-sm text-muted-foreground lg:block">Personal finances</p><ThemeToggle /></header>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div className="flex flex-col gap-1"><p className="text-sm text-muted-foreground">Welcome to MoneyLau</p><h1 className="text-2xl font-semibold">Your financial overview</h1></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><Plus className="size-4" />Add transaction arrives in Phase 4</div></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{["Net worth", "Income", "Expenses"].map((label) => <Card key={label}><CardHeader><CardTitle>{label}</CardTitle><CardDescription>Available once your accounts are connected.</CardDescription></CardHeader><CardContent><Skeleton className="h-8 w-28" /></CardContent></Card>)}</div>
        <Card><CardHeader><CardTitle>Foundation ready</CardTitle><CardDescription>Accounts, transactions, and reports will appear here as the next phases are completed.</CardDescription></CardHeader><CardContent className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpRight className="size-4" aria-hidden="true" />Sign in is staged at /login for Phase 2.</CardContent></Card>
      </section>
    </main>
    <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t bg-background px-2 py-2 lg:hidden" aria-label="Mobile navigation">{navigation.map(({ icon: Icon, label }, index) => <div className={index === 0 ? "flex flex-col items-center gap-1 text-xs font-medium" : "flex flex-col items-center gap-1 text-xs text-muted-foreground"} key={label}><Icon className="size-4" aria-hidden="true" /><span className="truncate">{label}</span></div>)}</nav>
  </div>;
}
