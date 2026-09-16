import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { formatIDR } from "./mine-finance-utils";

type SpendingActivityRow = {
  date: string;
  qualified: number;
};

type SpendingActivityCardProps = {
  chartData: SpendingActivityRow[];
  monthExpense: number;
  monthBudgetTotal: number;
  monthBudgetSpent: number;
};

const pipelineChartConfig = {
  qualified: {
    label: "Pengeluaran",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const pipelineRangeItems = [{ value: "last-6-months", label: "6 bulan terakhir" }] as const;

const axisMonthFormatter = new Intl.DateTimeFormat("id-ID", { month: "short" });
const tooltipMonthFormatter = new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" });

export function SpendingActivityCard({
  chartData,
  monthExpense,
  monthBudgetTotal,
  monthBudgetSpent,
}: SpendingActivityCardProps) {
  const totalExpense = chartData.reduce((sum, item) => sum + item.qualified, 0);
  const budgetProgress = monthBudgetTotal > 0 ? Math.round((monthBudgetSpent / monthBudgetTotal) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren pengeluaran</CardTitle>
        <CardAction>
          <Select defaultValue="last-6-months" items={pipelineRangeItems}>
            <SelectTrigger size="sm" className="min-w-40">
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {pipelineRangeItems.map((item) => (
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <ChartContainer config={pipelineChartConfig} className="h-72 w-full lg:col-span-8">
            <BarChart data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }} barSize={38}>
              <defs>
                <pattern
                  id="finance-expense-pattern"
                  width="4"
                  height="4"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="6" height="6" fill="var(--color-qualified)" fillOpacity="0.15" />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="var(--color-qualified)"
                    strokeWidth="1.25"
                    strokeOpacity="0.40"
                  />
                </pattern>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => axisMonthFormatter.format(new Date(String(value)))}
              />
              <YAxis hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(value) => tooltipMonthFormatter.format(new Date(String(value)))}
                    formatter={(value) => formatIDR(Number(value))}
                  />
                }
              />
              <Bar
                dataKey="qualified"
                fill="url(#finance-expense-pattern)"
                radius={[8, 8, 0, 0]}
                stroke="var(--color-qualified)"
                strokeOpacity={0.5}
                strokeWidth={0.5}
              />
            </BarChart>
          </ChartContainer>

          <div className="flex flex-col gap-5 rounded-lg p-4 lg:col-span-4">
            <div className="flex flex-col gap-1">
              <div className="font-medium text-4xl tabular-nums leading-none">
                {formatIDR(totalExpense)} <span className="font-normal text-lg text-muted-foreground">6 bln</span>
              </div>
              <p className="text-muted-foreground text-sm">Total pengeluaran tercatat dalam 6 bulan terakhir.</p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest">Budget bulan ini</div>

              <div className="flex flex-col gap-1.5">
                <div className="font-medium text-2xl tabular-nums leading-none">
                  {formatIDR(monthExpense)} <span className="font-normal text-muted-foreground text-sm">terpakai</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {budgetProgress}% dari total budget {formatIDR(monthBudgetTotal)}.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-0.5">
                <Progress
                  value={Math.min(budgetProgress, 100)}
                  className="h-2.5 bg-chart-2/12 *:data-[slot='progress-indicator']:bg-chart-2"
                />
                <div className="flex items-center justify-between text-xs">
                  <div className="font-medium tabular-nums">{formatIDR(monthBudgetSpent)} budget</div>
                  <div className="text-muted-foreground tabular-nums">{formatIDR(monthBudgetTotal)} limit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
