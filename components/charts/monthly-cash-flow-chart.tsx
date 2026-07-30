"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactAmount, formatMoney } from "@/lib/formatting/money";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-2)",
  },
  expense: {
    label: "Expenses",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

export function MonthlyCashFlowChart({
  data,
  currency,
}: {
  data: { month: string; label: string; income: number; expense: number }[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No completed cash-flow activity for this period.
      </div>
    );
  }

  return (
    <ChartContainer
      className="h-64 w-full aspect-auto"
      config={chartConfig}
      initialDimension={{ width: 640, height: 256 }}
    >
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={10} />
        <YAxis
          axisLine={false}
          tickFormatter={(value) => formatCompactAmount(Number(value))}
          tickLine={false}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value) => formatMoney(Number(value), currency)} />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="income" fill="var(--color-income)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
