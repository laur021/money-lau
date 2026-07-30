import { MoneyLauMark } from "@/components/icons/moneylau-mark";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function AppLogo({
  className,
  href = "/dashboard",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      aria-label="MoneyLau overview"
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      href={href}
    >
      <MoneyLauMark aria-hidden="true" className="size-8 shrink-0 text-primary" />
      <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
        MoneyLau
      </span>
    </Link>
  );
}
