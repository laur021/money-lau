import Link from "next/link";
import { AppLogo } from "@/components/layout/app-logo";

export const metadata = { title: "Privacy | MoneyLau" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <AppLogo />
      <article className="flex flex-col gap-6 text-sm leading-6 text-muted-foreground">
        <div className="flex flex-col gap-2"><h1 className="text-3xl font-semibold text-foreground">Privacy notice</h1><p>Last updated: July 29, 2026</p></div>
        <section className="flex flex-col gap-2"><h2 className="text-lg font-medium text-foreground">What MoneyLau stores</h2><p>MoneyLau stores the financial accounts, categories, transactions, preferences, and profile details that you choose to enter. Financial records are stored in the connected Supabase project, not in this source repository.</p></section>
        <section className="flex flex-col gap-2"><h2 className="text-lg font-medium text-foreground">Google sign-in</h2><p>Google is used only to authenticate you. MoneyLau receives basic profile information supplied by Google, such as your name, email address, and profile image. It does not receive or store your Google password.</p></section>
        <section className="flex flex-col gap-2"><h2 className="text-lg font-medium text-foreground">Your choices</h2><p>You can export your transaction records from Reports. You can also submit an account-deletion request from Settings. Do not enter bank passwords, PINs, CVVs, one-time passwords, or full bank account numbers in MoneyLau.</p></section>
        <p><Link className="text-foreground underline underline-offset-4" href="/terms">Read the terms of use</Link></p>
      </article>
    </main>
  );
}
