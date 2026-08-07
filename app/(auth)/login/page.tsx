import { AppLogo } from "@/components/layout/app-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { signInWithGoogle } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig, readPublicEnv } from "@/lib/validation/env";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  ChartPie,
  Landmark,
  LockKeyhole,
  LogIn,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const messages: Record<string, string> = {
  configuration:
    "Supabase is not configured. Add the public project URL and anon key before signing in.",
  oauth_start:
    "Google sign-in could not be started. Check the provider and redirect URL configuration.",
  oauth_callback: "Google sign-in could not be completed. Please try again.",
  missing_code: "The sign-in response did not include an authorization code. Please try again.",
};

const expenseCategories = [
  { name: "Home", amount: "17,335.00", portion: "42%" },
  { name: "Food", amount: "10,000.00", portion: "24%" },
  { name: "Transport", amount: "7,440.00", portion: "18%" },
  { name: "Other", amount: "6,500.00", portion: "16%" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const env = readPublicEnv();
  const configured = hasSupabaseConfig(env);
  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect("/dashboard");
  }

  const errorMessage =
    error && messages[error]
      ? messages[error]
      : !configured
        ? messages.configuration
        : null;

  return (
    <main className="min-h-svh bg-background lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(36rem,1.18fr)]">
      <section className="flex min-h-svh flex-col px-6 py-6 sm:px-10 lg:px-12 xl:px-16">
        <header className="flex items-center justify-between gap-4">
          <AppLogo className="w-fit" href="/" />
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center py-12">
          <div className="mx-auto flex w-full max-w-md flex-col gap-8">
            <div className="flex flex-col gap-3">
              <Badge className="w-fit" variant="secondary">
                Personal finance, kept personal
              </Badge>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold sm:text-4xl">
                  Understand where your money goes.
                </h1>
                <p className="max-w-prose text-sm/relaxed text-muted-foreground sm:text-base/relaxed">
                  Track accounts, income, expenses, and transfers in one private workspace, then
                  turn your transaction history into clear spending insights.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-medium">Sign in to MoneyLau</h2>
                <p className="text-sm text-muted-foreground">
                  Continue with the Google account you want linked to your workspace.
                </p>
              </div>

              {errorMessage ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Sign-in unavailable</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <form action={signInWithGoogle}>
                <Button className="w-full" disabled={!configured} size="lg" type="submit">
                  <LogIn data-icon="inline-start" />
                  Continue with Google
                </Button>
              </form>

              <div className="flex items-start gap-3 text-xs/relaxed text-muted-foreground">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>
                  Google handles authentication securely. Your Google password is never shared
                  with MoneyLau.
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <WalletCards aria-hidden="true" className="size-4 shrink-0 text-foreground" />
                <span>Multiple accounts</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ReceiptText aria-hidden="true" className="size-4 shrink-0 text-foreground" />
                <span>Complete ledger</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ChartPie aria-hidden="true" className="size-4 shrink-0 text-foreground" />
                <span>Spending reports</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>MoneyLau</span>
          <span aria-hidden="true">|</span>
          <Link className="underline-offset-4 hover:text-foreground hover:underline" href="/privacy">
            Privacy
          </Link>
          <Link className="underline-offset-4 hover:text-foreground hover:underline" href="/terms">
            Terms
          </Link>
        </footer>
      </section>

      <section
        aria-label="Example MoneyLau financial workspace"
        className="hidden min-h-svh items-center border-l bg-muted/30 p-8 lg:flex xl:p-12"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="flex max-w-xl flex-col gap-3">
            <Badge className="w-fit" variant="outline">
              <LockKeyhole data-icon="inline-start" />
              Example workspace
            </Badge>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold">A clear view of your financial activity.</h2>
              <p className="text-sm/relaxed text-muted-foreground">
                Record transactions manually, compare account balances, and see how each category
                shapes your spending.
              </p>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <div>
                <CardTitle>Overview</CardTitle>
                <CardDescription>July 2026 | All accounts | PHP</CardDescription>
              </div>
              <CardAction>
                <Badge variant="secondary">Sample data</Badge>
              </CardAction>
            </CardHeader>

            <CardContent className="flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[0.6875rem] text-muted-foreground">Available balance</span>
                  <span className="text-lg font-semibold tabular-nums">124,850.00</span>
                  <span className="text-[0.6875rem] text-muted-foreground">PHP</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[0.6875rem] text-muted-foreground">Income</span>
                  <span className="flex items-center gap-1 text-lg font-semibold tabular-nums">
                    68,500.00
                    <ArrowUpRight aria-hidden="true" className="size-4 text-primary" />
                  </span>
                  <span className="text-[0.6875rem] text-muted-foreground">PHP</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[0.6875rem] text-muted-foreground">Expenses</span>
                  <span className="flex items-center gap-1 text-lg font-semibold tabular-nums">
                    41,275.00
                    <ArrowDownRight aria-hidden="true" className="size-4 text-muted-foreground" />
                  </span>
                  <span className="text-[0.6875rem] text-muted-foreground">PHP</span>
                </div>
              </div>

              <Separator />

              <div className="grid items-center gap-6 xl:grid-cols-[13rem_1fr]">
                <div className="relative mx-auto flex size-48 items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "conic-gradient(var(--color-primary) 0 42%, var(--color-chart-1) 42% 66%, var(--color-chart-3) 66% 84%, var(--color-muted-foreground) 84% 100%)",
                    }}
                  />
                  <div className="absolute inset-8 rounded-full bg-card" />
                  <div className="relative flex flex-col items-center gap-1 text-center">
                    <span className="text-[0.6875rem] text-muted-foreground">Expenses</span>
                    <strong className="text-lg tabular-nums">41,275.00</strong>
                    <span className="text-[0.6875rem] text-muted-foreground">PHP</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  {expenseCategories.map((category, index) => (
                    <div
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b py-3 last:border-b-0"
                      key={category.name}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "size-2.5 rounded-sm",
                          index === 0
                            ? "bg-primary"
                            : index === 1
                              ? "bg-chart-1"
                              : index === 2
                                ? "bg-chart-3"
                                : "bg-muted-foreground",
                        ].join(" ")}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{category.name}</p>
                        <p className="text-[0.6875rem] text-muted-foreground">
                          {category.portion} of expenses
                        </p>
                      </div>
                      <span className="text-xs tabular-nums">{category.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="gap-2 border-t text-muted-foreground">
              <Landmark aria-hidden="true" className="size-4 shrink-0" />
              <span>Manual tracking keeps you in control of every financial record.</span>
            </CardFooter>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            The preview uses illustrative figures and does not represent a connected bank account.
          </p>
        </div>
      </section>
    </main>
  );
}
