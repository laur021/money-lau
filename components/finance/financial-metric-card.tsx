import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FinancialMetricCardProps = {
  label: string;
  description?: React.ReactNode;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: "default" | "positive" | "negative";
};

const toneClassNames = {
  default: "text-foreground",
  positive: "text-success",
  negative: "text-destructive",
};

/** A compact, scan-friendly financial total with a semantic visual tone. */
export function FinancialMetricCard({
  label,
  description,
  value,
  icon,
  tone = "default",
}: FinancialMetricCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardAction>
          <span className={cn("flex", toneClassNames[tone])}>{icon}</span>
        </CardAction>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn("text-2xl font-bold tracking-tight tabular-nums sm:text-[1.65rem]", toneClassNames[tone])}>
        {value}
      </CardContent>
    </Card>
  );
}
