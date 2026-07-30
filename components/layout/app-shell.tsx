"use client";

import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ReceiptText },
  { label: "Accounts", href: "/accounts", icon: CreditCard },
  { label: "Categories", href: "/categories", icon: FolderTree },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

type AppShellUser = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
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

export function AppShell({
  children,
  user,
}: Readonly<{ children: React.ReactNode; user: AppShellUser }>) {
  const pathname = usePathname();
  const initials = userInitials(user.displayName, user.email);

  return (
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
                {navigation.map(({ icon: Icon, label, href }) => {
                  const active = pathname === href;

                  return (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton asChild isActive={active} tooltip={label}>
                        <Link aria-current={active ? "page" : undefined} href={href}>
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
            <SidebarMenuItem className="flex items-center gap-1">
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
              <div className="group-data-[collapsible=icon]:hidden">
                <ThemeToggle />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div className="md:hidden">
              <AppLogo />
            </div>
            <p className="hidden text-sm text-muted-foreground md:block">Personal finances</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={signOut}>
              <Button aria-label="Sign out" size="icon" type="submit" variant="ghost">
                <LogOut aria-hidden="true" />
              </Button>
            </form>
          </div>
        </header>
        {children}
      </SidebarInset>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t bg-background px-1 py-2 md:hidden"
      >
        {navigation.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1 text-[10px]",
                active ? "font-medium text-foreground" : "text-muted-foreground"
              )}
              href={href}
              key={label}
            >
              <Icon aria-hidden="true" className="size-4" />
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          );
        })}
      </nav>
    </SidebarProvider>
  );
}
