import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";
import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b p-4 sm:px-6">
        <AppLogo />
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-lg bg-muted">
            <FileQuestion className="size-6 text-muted-foreground" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Page not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The MoneyLau page you requested does not exist or may have moved.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft data-icon="inline-start" />
              Return to overview
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
