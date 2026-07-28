import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLogo({ className }: { className?: string }) {
  return <div className={cn("flex items-center gap-2 font-semibold", className)}><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Landmark aria-hidden="true" className="size-4" /></span><span>MoneyLau</span></div>;
}
