"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CategoryPortion } from "@/lib/calculations/reporting";
import { formatAmount, formatMoney } from "@/lib/formatting/money";

const chartConfig = {
  value: {
    label: "Expense",
  },
} satisfies ChartConfig;

export function ExpenseDonutChart({
  data,
  currency,
}: {
  data: CategoryPortion[];
  currency: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map((item) => ({ ...item, fill: item.color }));

  if (data.length === 0) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3">
        <div className="flex size-52 items-center justify-center rounded-full border-[28px] border-muted">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-xl font-semibold">{formatMoney(0, currency)}</p>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Add a completed expense to see its category portion.
        </p>
      </div>
    );
  }

  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(18rem,1fr)_minmax(14rem,0.8fr)]">
      <ChartContainer
        className="mx-auto h-80 w-full max-w-md aspect-auto"
        config={chartConfig}
        initialDimension={{ width: 400, height: 320 }}
      >
        <PieChart accessibilityLayer>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatMoney(Number(value), currency)}
                hideLabel
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={82}
            nameKey="name"
            outerRadius={126}
            paddingAngle={2}
            strokeWidth={0}
          >
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                return (
                  <text
                    dominantBaseline="middle"
                    textAnchor="middle"
                    x={viewBox.cx}
                    y={viewBox.cy}
                  >
                    <tspan
                      className="fill-muted-foreground text-xs"
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) - 12}
                    >
                      Expenses
                    </tspan>
                    <tspan
                      className="fill-foreground text-lg font-semibold"
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 14}
                    >
                      {formatAmount(total)}
                    </tspan>
                    <tspan
                      className="fill-muted-foreground text-[10px]"
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 32}
                    >
                      {currency}
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="grid max-h-80 gap-1 overflow-y-auto pr-1">
        {data.map((item) => (
          <div
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
            key={item.id}
          >
            <span
              aria-hidden="true"
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.percentage.toFixed(1)}% of expenses
              </p>
            </div>
            <span className="text-right text-sm tabular-nums">
              {formatAmount(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
