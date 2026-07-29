"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, FolderTree, LayoutDashboard, LogOut, ReceiptText, Settings } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ReceiptText },
  { label: "Accounts", href: "/accounts", icon: CreditCard },
  { label: "Categories", href: "/categories", icon: FolderTree },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar lg:flex lg:flex-col">
        <div className="px-5 py-5"><AppLogo /></div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Primary navigation">
          {navigation.map(({ icon: Icon, label, href }) => {
            const active = pathname === href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}
                href={href}
                key={label}
              >
                <Icon className="size-4" aria-hidden="true" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1 p-3">
          <ThemeToggle />
          <form action={signOut}><Button aria-label="Sign out" size="icon" type="submit" variant="ghost"><LogOut /></Button></form>
        </div>
      </aside>

      <div className="min-h-screen pb-20 lg:pb-0 lg:pl-64">
        <header className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
          <div className="lg:hidden"><AppLogo /></div>
          <p className="hidden text-sm text-muted-foreground lg:block">Personal finances</p>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={signOut}><Button aria-label="Sign out" size="icon" type="submit" variant="ghost"><LogOut /></Button></form>
          </div>
        </header>
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t bg-background px-1 py-2 lg:hidden" aria-label="Mobile navigation">
        {navigation.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link aria-current={active ? "page" : undefined} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1 text-[10px]", active ? "font-medium text-foreground" : "text-muted-foreground")} href={href} key={label}>
              <Icon className="size-4" aria-hidden="true" />
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
