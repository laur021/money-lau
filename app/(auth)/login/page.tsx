import { Globe2 } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return <main className="flex min-h-screen items-center justify-center p-4"><Card className="w-full max-w-md"><CardHeader className="gap-4"><AppLogo /><div className="flex flex-col gap-1"><CardTitle>Sign in to MoneyLau</CardTitle><CardDescription>Keep your financial workspace organized in one private place.</CardDescription></div></CardHeader><CardContent><Button className="w-full" disabled size="lg" variant="outline"><Globe2 data-icon="inline-start" />Continue with Google</Button></CardContent><CardFooter className="text-sm text-muted-foreground">Google sign-in will be enabled in Phase 2.</CardFooter></Card></main>;
}

