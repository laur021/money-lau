import { AppLogo } from "@/components/layout/app-logo";
import Link from "next/link";

export const metadata = { title: "Terms | MoneyLau" };

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <AppLogo />
      <article className="flex flex-col gap-6 text-sm leading-6 text-muted-foreground">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-foreground">Terms of use</h1>
          <p>Last updated: July 29, 2026</p>
        </div>
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium text-foreground">Personal record keeping</h2>
          <p>
            MoneyLau is a manual personal finance tracker. It does not connect to banks, provide
            financial advice, execute payments, or guarantee the accuracy of entries you record.
          </p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium text-foreground">Your responsibility</h2>
          <p>
            Keep access to your Google account secure and review exported records before sharing
            them. Never enter credentials, card security codes, or other sensitive banking secrets
            into MoneyLau.
          </p>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium text-foreground">Availability</h2>
          <p>
            The application may change as it is developed. Back up records using the CSV export
            before requesting deletion or making significant account changes.
          </p>
        </section>
        <p>
          <Link className="text-foreground underline underline-offset-4" href="/privacy">
            Read the privacy notice
          </Link>
        </p>
      </article>
    </main>
  );
}
