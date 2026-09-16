import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import type { AccountAllocationRow, CategorySpendingRow } from "./mine-finance-utils";
import { formatIDR } from "./mine-finance-utils";

type BalanceDistributionCardProps = {
  title: string;
  rows: AccountAllocationRow[] | CategorySpendingRow[];
  totalLabel?: string;
};

const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function BalanceDistributionCard({ title, rows, totalLabel = "Total" }: BalanceDistributionCardProps) {
  const chartConfig = rows.reduce<ChartConfig>(
    (acc, row, index) => {
      acc[row.key] = {
        label: row.account,
        color: row.fill ?? palette[index % palette.length],
      };
      return acc;
    },
    { amount: { label: "Nominal" } },
  );

  const chartData = rows.map((row, index) => ({
    ...row,
    fill: row.fill ?? palette[index % palette.length],
  }));

  const totalBalance = rows.reduce((total, item) => total + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{title}</CardTitle>
      </CardHeader>

      <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        {rows.length === 0 ? (
          <p className="col-span-2 py-10 text-center text-muted-foreground text-sm">Belum ada data.</p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-50">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel className="w-52" nameKey="account" />}
                />
                <Pie
                  cornerRadius={6}
                  data={chartData}
                  dataKey="amount"
                  innerRadius={65}
                  nameKey="account"
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (!(viewBox && "cx" in viewBox && "cy" in viewBox)) {
                        return null;
                      }

                      return (
                        <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                          <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy ?? 0) - 8}>
                            {totalLabel}
                          </tspan>
                          <tspan
                            className="fill-foreground font-heading font-medium text-lg tabular-nums"
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 14}
                          >
                            {formatIDR(totalBalance)}
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="flex min-w-0 flex-col gap-3">
              {chartData.map((item) => (
                <div className="grid grid-cols-[1fr_auto] items-end gap-3" key={item.key}>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1">
                      <span
                        aria-hidden="true"
                        className="h-2 w-1 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <p className="truncate text-muted-foreground text-xs">{item.account}</p>
                    </div>
                    <p className="font-medium tabular-nums">{formatIDR(item.amount)}</p>
                  </div>
                  <div className="font-medium tabular-nums">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
