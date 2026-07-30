import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { SalaryRunForm } from "@/components/salary/salary-run-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getSalaryOptions, getSalaryProfiles } from "@/features/salary/data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parameterValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewSalaryPage({ searchParams }: { searchParams: SearchParams }) {
  const parameters = await searchParams;
  const [profiles, options] = await Promise.all([
    getSalaryProfiles(),
    getSalaryOptions(),
  ]);
  const profileId = parameterValue(parameters.profile);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button asChild aria-label="Back to salary" size="icon-sm" variant="ghost">
          <Link href="/salary">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Create a reviewable payslip draft</p>
          <h1 className="text-2xl font-semibold">Calculate salary</h1>
        </div>
      </div>

      {profiles.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Pay details</CardTitle>
            <CardDescription>
              Saving keeps this run independent from future profile changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalaryRunForm
              accounts={options.accounts}
              categories={options.categories}
              initialProfileId={profileId}
              profiles={profiles}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BriefcaseBusiness />
                </EmptyMedia>
                <EmptyTitle>Create a salary profile first</EmptyTitle>
                <EmptyDescription>
                  A profile provides the employer, pay frequency, receiving account, and defaults.
                </EmptyDescription>
              </EmptyHeader>
              <Button asChild variant="outline">
                <Link href="/salary">Return to Salary</Link>
              </Button>
            </Empty>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
