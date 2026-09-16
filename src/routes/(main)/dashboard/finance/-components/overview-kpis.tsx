import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinanceStats } from "@/lib/api/finance";

import { formatIDR, formatPctBadge, pctChange } from "./mine-finance-utils";

type OverviewKpisProps = {
  stats: FinanceStats;
};

export function OverviewKpis({ stats }: OverviewKpisProps) {
  const expenseDelta = pctChange(stats.month_expense, stats.prev_month_expense);
  const incomeDelta = pctChange(stats.month_income, stats.prev_month_income);
  const netDelta = pctChange(stats.month_net, stats.prev_month_income - stats.prev_month_expense);
  const expenseBadge = formatPctBadge(expenseDelta);
  const incomeBadge = formatPctBadge(incomeDelta);
  const netBadge = formatPctBadge(netDelta);

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid grid-cols-1 xl:grid-cols-8">
        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">Total saldo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="font-heading text-3xl leading-none tracking-tight">{formatIDR(stats.total_balance)}</div>
              <p className="text-muted-foreground text-xs">Semua rekening/dompet</p>
            </div>
            {incomeBadge ? (
              <Badge
                className={
                  incomeBadge.positive
                    ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {incomeBadge.label}
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">Pemasukan bulan ini</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="font-heading text-3xl leading-none tracking-tight">{formatIDR(stats.month_income)}</div>
              <p className="text-muted-foreground text-xs">Bulan lalu {formatIDR(stats.prev_month_income)}</p>
            </div>
            {incomeBadge ? (
              <Badge
                className={
                  incomeBadge.positive
                    ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {incomeBadge.label}
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">Pengeluaran bulan ini</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="font-heading text-3xl leading-none tracking-tight">{formatIDR(stats.month_expense)}</div>
              <p className="text-muted-foreground text-xs">Bulan lalu {formatIDR(stats.prev_month_expense)}</p>
            </div>
            {expenseBadge ? (
              <Badge
                variant="destructive"
                className={
                  expenseBadge.positive
                    ? "bg-destructive/10 text-destructive"
                    : "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                }
              >
                {expenseBadge.label}
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">Net & tabungan</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="font-heading text-3xl leading-none tracking-tight">{formatIDR(stats.month_net)}</div>
              <p className="text-muted-foreground text-xs">Tingkat tabungan {Math.round(stats.savings_rate)}%</p>
            </div>
            {netBadge ? (
              <Badge
                className={
                  netBadge.positive
                    ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {netBadge.label}
              </Badge>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
