"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export function CashFlowChart({
  data,
}: {
  data: { currency: string; income: number; expense: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="currency" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="income" fill="var(--chart-2)" radius={4} />
          <Bar dataKey="expense" fill="var(--destructive)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
