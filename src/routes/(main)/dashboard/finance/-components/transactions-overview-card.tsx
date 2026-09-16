import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { DailyFlowPoint } from "./mine-finance-utils";
import { formatIDR } from "./mine-finance-utils";

const chartConfig = {
  expense: {
    color: "var(--chart-4)",
    label: "Pengeluaran",
  },
  income: {
    color: "var(--chart-2)",
    label: "Pemasukan",
  },
} satisfies ChartConfig;

const transactionPeriodItems = [
  { value: "monthly", label: "Bulan ini" },
  { value: "weekly", label: "7 hari" },
] as const;

type TransactionsOverviewCardProps = {
  chartData: DailyFlowPoint[];
  monthKey: string;
};

const dayFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });

function formatDay(value: number) {
  return dayFormatter.format(new Date(value));
}

export function TransactionsOverviewCard({ chartData, monthKey }: TransactionsOverviewCardProps) {
  const activeDays = chartData.filter((row) => row.expense > 0 || row.income > 0);
  const domainStart = chartData[0]?.timestamp ?? Date.now();
  const domainEnd = chartData[chartData.length - 1]?.timestamp ?? Date.now();
  const tickDays = chartData.filter((_, index) => index % Math.max(1, Math.floor(chartData.length / 7)) === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Ringkasan transaksi</CardTitle>
        <CardAction>
          <Select defaultValue="monthly" items={transactionPeriodItems}>
            <SelectTrigger className="w-28" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {transactionPeriodItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent>
        {activeDays.length === 0 ? (
          <p className="flex h-50 items-center justify-center text-muted-foreground text-sm">
            Belum ada transaksi di {monthKey}.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-50 w-full">
            <LineChart accessibilityLayer data={chartData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="timestamp"
                domain={[domainStart, domainEnd]}
                scale="time"
                tickFormatter={formatDay}
                tickLine={false}
                tickMargin={10}
                ticks={tickDays.map((row) => row.timestamp)}
                tick={{ fontSize: 12 }}
                type="number"
              />
              <YAxis hide axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => (
                  <ChartTooltipContent
                    active={active}
                    hideLabel
                    label={label}
                    payload={payload?.map((item) => ({
                      ...item,
                      value: typeof item.value === "number" ? formatIDR(item.value) : item.value,
                    }))}
                  />
                )}
              />
              <Line
                connectNulls
                dataKey="income"
                dot={false}
                stroke="var(--color-income)"
                strokeDasharray="5 5"
                strokeLinecap="round"
                strokeWidth={1}
                type="monotone"
              />
              <Line
                dataKey="expense"
                dot={false}
                stroke="var(--color-expense)"
                strokeLinecap="round"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
