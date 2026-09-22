"use client";

import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggleMenuButton } from "@/components/layout/theme-toggle";
import { InsightsSheet } from "@/components/insights/insights-sheet";
import {
  ScreenPrivacyControl,
  ScreenPrivacyProvider,
} from "@/components/privacy/screen-privacy";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BadgeDollarSign,
  CalendarCheck2,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  ReceiptText,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarNavigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ReceiptText },
  { label: "Bills", href: "/bills", icon: CalendarCheck2 },
  { label: "Salary", href: "/salary", icon: BadgeDollarSign },
  { label: "Accounts", href: "/accounts", icon: CreditCard },
  { label: "Categories", href: "/categories", icon: FolderTree },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

const mobileNavigation = sidebarNavigation
  .filter(({ label }) => ["Overview", "Transactions", "Bills", "Salary"].includes(label))
  .map((item) => (item.label === "Transactions" ? { ...item, label: "Activity" } : item));

const mobileMoreNavigation = sidebarNavigation.filter(
  ({ label }) => !["Overview", "Transactions", "Bills", "Salary"].includes(label),
);

type AppShellUser = {
  avatarUrl: string | null;
  defaultCurrency: string;
  displayName: string;
  email: string;
  hasInsightsConsent: boolean;
  insightCurrencies: string[];
};

function userInitials(displayName: string, email: string) {
  const source = displayName.trim() || email.trim() || "MoneyLau";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function MobileMoreMenu({ pathname }: { pathname: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="flex min-w-0 flex-col gap-1 rounded-md px-1 py-1 text-[11px] text-muted-foreground" size="sm" variant="ghost">
          <MoreHorizontal aria-hidden="true" data-icon="inline-start" />
          <span className="w-full truncate text-center">More</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]" side="bottom">
        <SheetHeader className="px-5 pb-3 pt-5 text-left">
          <SheetTitle>More</SheetTitle>
          <SheetDescription>More ways to manage your finances.</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 px-5">
          {mobileMoreNavigation.map(({ icon: Icon, label, href }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <SheetClose asChild key={label}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col justify-center gap-1 rounded-lg border px-3 text-sm font-medium",
                    active ? "border-primary/30 bg-primary/10 text-foreground" : "text-muted-foreground",
                  )}
                  href={href}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </Link>
              </SheetClose>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppShell({
  children,
  user,
}: Readonly<{ children: React.ReactNode; user: AppShellUser }>) {
  const pathname = usePathname();
  const initials = userInitials(user.displayName, user.email);

  return (
    <ScreenPrivacyProvider>
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b p-2">
          <AppLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarNavigation.map(({ icon: Icon, label, href }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`);

                  return (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton asChild isActive={active} tooltip={label}>
                        <Link aria-current={active ? "page" : undefined} href={href} prefetch={href === "/dashboard"}>
                          <Icon aria-hidden="true" />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-auto min-h-12 py-2"
                size="lg"
                tooltip={`${user.displayName}${user.email ? ` - ${user.email}` : ""}`}
              >
                <Link href="/settings">
                  <Avatar className="size-8 rounded-md">
                    <AvatarImage
                      alt={user.displayName}
                      className="rounded-md"
                      src={user.avatarUrl ?? undefined}
                    />
                    <AvatarFallback className="rounded-md bg-primary/10 font-medium text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{user.displayName}</span>
                    <span className="block truncate text-[0.6875rem] text-muted-foreground">
                      {user.email || "Personal workspace"}
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <ThemeToggleMenuButton />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <form action={signOut} className="min-w-0 flex-1">
                <SidebarMenuButton
                  className="w-full text-muted-foreground hover:text-foreground"
                  tooltip="Sign out"
                  type="submit"
                >
                  <LogOut aria-hidden="true" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </form>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="pb-24 md:pb-0">
        <header className="flex min-h-16 items-center justify-between border-b bg-card px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="hidden md:inline-flex" />
            <div className="md:hidden">
              <AppLogo />
            </div>
            <p className="hidden text-sm text-muted-foreground md:block">Personal finances</p>
          </div>
          <div className="flex items-center gap-1">
            <InsightsSheet
              currencies={user.insightCurrencies}
              defaultCurrency={user.defaultCurrency}
              hasConsent={user.hasInsightsConsent}
            />
            <ScreenPrivacyControl />
          </div>
        </header>
        {children}
      </SidebarInset>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background px-1 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 md:hidden"
      >
        {mobileNavigation.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1 text-[11px]",
                active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"
              )}
              href={href}
              key={label}
              prefetch={href === "/dashboard"}
            >
              <Icon aria-hidden="true" className="size-4" />
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          );
        })}
        <MobileMoreMenu pathname={pathname} />
      </nav>
    </SidebarProvider>
    </ScreenPrivacyProvider>
  );
}
