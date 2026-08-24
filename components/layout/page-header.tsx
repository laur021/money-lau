import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Shared page hierarchy for protected screens. Keep primary actions in the
 * actions slot so they remain adjacent to the page context at every breakpoint.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex max-w-2xl flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
