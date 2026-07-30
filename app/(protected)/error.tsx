"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <span className="mb-2 flex size-9 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </span>
          <CardTitle>We could not load this page</CardTitle>
          <CardDescription>
            Your data was not changed. Check your connection and try the request
            again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={reset} type="button">
            <RefreshCw data-icon="inline-start" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Return to overview</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
