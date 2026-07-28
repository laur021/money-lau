import { AppLogo } from "@/components/layout/app-logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithGoogle } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig, readPublicEnv } from "@/lib/validation/env";
import { AlertCircle, Globe2 } from "lucide-react";
import { redirect } from "next/navigation";

const messages: Record<string, string> = {
  configuration:
    "Supabase is not configured. Add the public project URL and anon key before signing in.",
  oauth_start:
    "Google sign-in could not be started. Check the provider and redirect URL configuration.",
  oauth_callback: "Google sign-in could not be completed. Please try again.",
  missing_code: "The sign-in response did not include an authorization code. Please try again.",
};

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
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4">
          <AppLogo />
          <div className="flex flex-col gap-1">
            <CardTitle>Sign in to MoneyLau</CardTitle>
            <CardDescription>
              Keep your financial workspace organized in one private place.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && messages[error] ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Sign-in unavailable</AlertTitle>
              <AlertDescription>{messages[error]}</AlertDescription>
            </Alert>
          ) : null}
          <form action={signInWithGoogle}>
            <Button
              className="w-full"
              disabled={!configured}
              size="lg"
              type="submit"
              variant="outline"
            >
              <Globe2 data-icon="inline-start" />
              Continue with Google
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Your Google password is never shared with MoneyLau.
        </CardFooter>
      </Card>
    </main>
  );
}
