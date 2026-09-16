import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { formatIDR } from "./mine-finance-utils";

type CashFlowChartRow = {
  month: string;
  income: number;
  expenses: number;
};

type CashFlowOverviewProps = {
  chartData: CashFlowChartRow[];
  totalIncome: number;
  totalExpense: number;
};

const chartConfig = {
  income: {
    label: "Pemasukan",
    color: "var(--chart-1)",
  },
  expenses: {
    label: "Pengeluaran",
    color: "var(--chart-2)",
  },
} as ChartConfig;

export function CashFlowOverview({ chartData, totalIncome, totalExpense }: CashFlowOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
        <CardDescription>Pemasukan & pengeluaran bulanan dengan net impact.</CardDescription>
        <CardAction>
          <Select defaultValue="last-6-months">
            <SelectTrigger size="sm" className="w-37">
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="last-6-months">6 bulan terakhir</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Separator />
        <div className="flex items-start justify-between gap-2 py-5 md:items-stretch md:gap-0">
          <div className="flex flex-1 items-center justify-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-chart-1">
              <ArrowDownLeft className="size-6 stroke-background" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Pemasukan</p>
              <p className="font-medium tabular-nums">{formatIDR(totalIncome)}</p>
            </div>
          </div>
          <Separator orientation="vertical" className="h-auto! self-stretch" />
          <div className="flex flex-1 items-center justify-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-chart-2">
              <ArrowUpRight className="size-6 stroke-background" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Pengeluaran</p>
              <p className="font-medium tabular-nums">{formatIDR(totalExpense)}</p>
            </div>
          </div>
        </div>
        <Separator />
        {chartData.length === 0 ? (
          <p className="flex h-72 items-center justify-center text-muted-foreground text-sm">
            Belum ada data cash flow.
          </p>
        ) : (
          <ChartContainer className="max-h-72 w-full" config={chartConfig}>
            <BarChart
              stackOffset="sign"
              margin={{ left: -25, right: 0, top: 25, bottom: 0 }}
              accessibilityLayer
              data={chartData}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const abs = Math.abs(Number(value));
                  const formatted =
                    abs >= 1_000_000 ? `${abs / 1_000_000}jt` : abs >= 1000 ? `${abs / 1000}k` : `${abs}`;
                  return Number(value) < 0 ? `-${formatted}` : formatted;
                }}
              />
              <ChartTooltip
                content={<ChartTooltipContent hideLabel formatter={(value) => formatIDR(Math.abs(Number(value)))} />}
              />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Bar dataKey="income" stackId="a" fill={chartConfig.income.color} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" stackId="a" fill={chartConfig.expenses.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
