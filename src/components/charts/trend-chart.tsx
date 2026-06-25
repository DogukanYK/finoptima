"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatTL, formatTLCompact, TR_MONTHS } from "@/lib/format";

type Point = { month: string; income: number; expense: number };

function shortMonth(month: string): string {
  const m = Number(month.split("-")[1]) - 1;
  return TR_MONTHS[m]?.slice(0, 3) ?? "";
}

export function TrendChart({ data }: { data: Point[] }) {
  const chartData = data.map((d) => ({ ...d, label: shortMonth(d.month) }));

  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label="Son altı ayın aylık gelir ve gider grafiği"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--app-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--app-accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--app-destructive)"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="var(--app-destructive)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--app-border)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--app-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--app-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => formatTLCompact(v)}
          />
          <Tooltip
            cursor={{ stroke: "var(--app-border)" }}
            contentStyle={{
              background: "var(--app-surface)",
              border: "1px solid var(--app-border)",
              borderRadius: "var(--app-radius)",
              color: "var(--app-text)",
              fontSize: 13,
            }}
            labelStyle={{ color: "var(--app-text)", fontWeight: 600 }}
            formatter={(value, name) => [
              formatTL(Number(value)),
              name === "income" ? "Gelir" : "Gider",
            ]}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="var(--app-accent)"
            strokeWidth={2.5}
            fill="url(#gIncome)"
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="var(--app-destructive)"
            strokeWidth={2.5}
            fill="url(#gExpense)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
