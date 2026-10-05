"use client";

import * as React from "react";

import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FastingDayChartPoint, FastingOverview } from "@/lib/api/fasting";

import { FastingConsistencyCalendar } from "./fasting-consistency-calendar";
import { FastingGoalPresets } from "./fasting-goal-presets";
import { formatDurationShort } from "./fasting-utils";

type Props = {
  data: FastingOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

type ChartRow = FastingDayChartPoint & {
  label: string;
};

const fastingChartConfig = {
  fasting: {
    label: "Puasa",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const eatingChartConfig = {
  eating: {
    label: "Eating window",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function FastingStatsPanel({ data, token, onRefresh }: Props) {
  const [range, setRange] = React.useState<"week" | "month">("week");
  const cmp = data.week_comparison;
  const chartSource = range === "week" ? data.fasting_chart.slice(-7) : data.fasting_chart;

  const chartData: ChartRow[] = chartSource.map((row) => ({
    ...row,
    label: formatAxisDate(row.date, range),
  }));

  const totalFasting = chartData.reduce((sum, row) => sum + row.fasting_hours, 0);
  const totalEating = chartData.reduce((sum, row) => sum + row.eating_hours, 0);
  const fastDelta = cmp.this_week_fasting_hours - cmp.last_week_fasting_hours;
  const eatDelta = cmp.this_week_eating_hours - cmp.last_week_eating_hours;
  const fastDeltaPct = pctChange(cmp.this_week_fasting_hours, cmp.last_week_fasting_hours);
  const eatDeltaPct = pctChange(cmp.this_week_eating_hours, cmp.last_week_eating_hours);

  const dateRange =
    chartData.length > 0
      ? `${format(parseISO(chartData[0].date), "d MMM", { locale: idLocale })} – ${format(parseISO(chartData[chartData.length - 1].date), "d MMM yyyy", { locale: idLocale })}`
      : "";

  const fastingGoalProgress = Math.min(
    100,
    Math.round((cmp.this_week_fasting_hours / Math.max(cmp.last_week_fasting_hours, 1)) * 100),
  );
  const eatingGoalProgress = Math.min(
    100,
    Math.round((cmp.this_week_eating_hours / Math.max(cmp.last_week_eating_hours, 1)) * 100),
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Change fast goal</CardTitle>
          <CardDescription>Pilih protocol default sebelum mulai fast berikutnya</CardDescription>
        </CardHeader>
        <CardContent>
          <FastingGoalPresets data={data} token={token} onRefresh={onRefresh} compact />
        </CardContent>
      </Card>

      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-3xl tracking-tight">Overview</h2>
          <p className="text-muted-foreground text-sm">
            Ringkasan fasting, streak, dan perbandingan minggu ini vs minggu lalu.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Fasting minggu ini"
            value={formatDurationShort(cmp.this_week_fasting_hours)}
            delta={formatDeltaHours(fastDelta)}
            deltaPct={fastDeltaPct}
            compareLabel={`${formatDurationShort(cmp.last_week_fasting_hours)} minggu lalu`}
            positiveIsGood
          />
          <KpiCard
            label="Eating window minggu ini"
            value={formatDurationShort(cmp.this_week_eating_hours)}
            delta={formatDeltaHours(eatDelta)}
            deltaPct={eatDeltaPct}
            compareLabel={`${formatDurationShort(cmp.last_week_eating_hours)} minggu lalu`}
            positiveIsGood={false}
          />
          <KpiCard
            label="Current streak"
            value={`${data.stats.current_streak} hari`}
            compareLabel={`Terpanjang ${data.stats.longest_streak} hari`}
          />
          <KpiCard
            label="Total fasts"
            value={String(data.stats.total_fasts)}
            compareLabel={`${Math.round(data.stats.total_hours)} jam total · rata-rata ${formatDurationShort(data.stats.average_hours)}`}
          />
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Fasting & eating activity</CardTitle>
          <CardAction>
            <Tabs value={range} onValueChange={(v) => v && setRange(v as "week" | "month")}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground text-sm">
            {dateRange} · hover bar untuk detail · ↺ = fast multi-hari
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="space-y-2">
                <p className="font-medium text-sm">Fasting time</p>
                <ChartContainer config={fastingChartConfig} className="h-56 w-full">
                  <BarChart
                    data={chartData}
                    margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                    barSize={range === "week" ? 38 : 16}
                  >
                    <defs>
                      <pattern
                        id="fasting-bar-pattern"
                        width="4"
                        height="4"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                      >
                        <rect width="6" height="6" fill="var(--color-fasting)" fillOpacity="0.15" />
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="6"
                          stroke="var(--color-fasting)"
                          strokeWidth="1.25"
                          strokeOpacity="0.4"
                        />
                      </pattern>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis hide domain={[0, 24]} ticks={[0, 12, 24]} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          hideIndicator
                          labelFormatter={(_, payload) => {
                            const row = payload?.[0]?.payload as ChartRow | undefined;
                            return row ? format(parseISO(row.date), "EEEE, d MMM yyyy", { locale: idLocale }) : "";
                          }}
                          formatter={(value, _name, item) => {
                            const row = item.payload as ChartRow;
                            const lines = [formatDurationShort(Number(value))];
                            if (row.continued) lines.push("Lanjutan fast multi-hari");
                            if (row.capped_full_day) lines.push("24 jam penuh — fast masih lanjut");
                            if (row.met_goal) lines.push("Goal harian tercapai");
                            return lines.join(" · ");
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="fasting_hours"
                      name="fasting"
                      fill="url(#fasting-bar-pattern)"
                      radius={[8, 8, 0, 0]}
                      stroke="var(--color-fasting)"
                      strokeOpacity={0.5}
                      strokeWidth={0.5}
                    />
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">Eating window</p>
                <ChartContainer config={eatingChartConfig} className="h-56 w-full">
                  <BarChart
                    data={chartData}
                    margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                    barSize={range === "week" ? 38 : 16}
                  >
                    <defs>
                      <pattern
                        id="eating-bar-pattern"
                        width="4"
                        height="4"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                      >
                        <rect width="6" height="6" fill="var(--color-eating)" fillOpacity="0.12" />
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="6"
                          stroke="var(--color-eating)"
                          strokeWidth="1.25"
                          strokeOpacity="0.35"
                        />
                      </pattern>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis hide domain={[0, 24]} ticks={[0, 12, 24]} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          hideIndicator
                          labelFormatter={(_, payload) => {
                            const row = payload?.[0]?.payload as ChartRow | undefined;
                            return row ? format(parseISO(row.date), "EEEE, d MMM yyyy", { locale: idLocale }) : "";
                          }}
                          formatter={(value) => formatDurationShort(Number(value))}
                        />
                      }
                    />
                    <Bar
                      dataKey="eating_hours"
                      name="eating"
                      fill="url(#eating-bar-pattern)"
                      radius={[8, 8, 0, 0]}
                      stroke="var(--color-eating)"
                      strokeOpacity={0.45}
                      strokeWidth={0.5}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-4">
              <div className="flex flex-col gap-1">
                <div className="font-medium text-4xl tabular-nums leading-none">
                  {formatDurationShort(totalFasting)}{" "}
                  <span className="font-normal text-lg text-muted-foreground">puasa</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Total waktu puasa dalam rentang {range === "week" ? "7 hari" : "30 hari"} terakhir.
                </p>
              </div>

              <ComparisonPanel
                title="Fasting time"
                thisHours={cmp.this_week_fasting_hours}
                lastHours={cmp.last_week_fasting_hours}
                progress={fastingGoalProgress}
                positiveIsGood
              />

              <ComparisonPanel
                title="Eating window"
                thisHours={cmp.this_week_eating_hours}
                lastHours={cmp.last_week_eating_hours}
                progress={eatingGoalProgress}
                positiveIsGood={false}
              />

              <div className="rounded-lg border border-border/60 p-3">
                <div className="text-[11px] text-muted-foreground uppercase tracking-widest">Summary</div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Longest fast</dt>
                    <dd className="font-medium tabular-nums">{formatDurationShort(data.stats.longest_hours)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Eating total</dt>
                    <dd className="font-medium tabular-nums">{formatDurationShort(totalEating)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Max streak</dt>
                    <dd className="font-medium tabular-nums">{data.stats.longest_streak} hari</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fasting calendar</CardTitle>
          <CardDescription>30 hari · orange = goal tercapai · ketuk tanggal untuk detail</CardDescription>
        </CardHeader>
        <CardContent>
          <FastingConsistencyCalendar days={data.calendar_heatmap} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Milestone perjalanan fasting kamu</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.badges.map((b) => (
            <Badge
              key={b.id}
              variant={b.earned ? "default" : "outline"}
              className="rounded-full px-3.5 py-1.5 font-normal"
            >
              {b.label}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  deltaPct,
  compareLabel,
  positiveIsGood,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaPct?: number;
  compareLabel: string;
  positiveIsGood?: boolean;
}) {
  const showTrend = delta != null && deltaPct != null && Number.isFinite(deltaPct);
  const isUp = (deltaPct ?? 0) >= 0;
  const trendPositive = positiveIsGood ? isUp : !isUp;

  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none tracking-tight tabular-nums">{value}</span>
          {showTrend && (
            <Badge
              variant="outline"
              className={
                trendPositive
                  ? "border-green-200 bg-green-500/10 text-green-700 dark:border-green-900/40 dark:bg-green-500/15 dark:text-green-300"
                  : "border-destructive/20 bg-destructive/10 text-destructive"
              }
            >
              {isUp ? <TrendingUp /> : <TrendingDown />}
              {delta}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{compareLabel}</p>
      </CardContent>
    </Card>
  );
}

function ComparisonPanel({
  title,
  thisHours,
  lastHours,
  progress,
  positiveIsGood,
}: {
  title: string;
  thisHours: number;
  lastHours: number;
  progress: number;
  positiveIsGood: boolean;
}) {
  const delta = thisHours - lastHours;
  const improved = positiveIsGood ? delta >= 0 : delta <= 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
      <div className="text-[11px] text-muted-foreground uppercase tracking-widest">{title}</div>
      <div className="flex flex-col gap-1.5">
        <div className="font-medium text-2xl tabular-nums leading-none">
          {formatDurationShort(thisHours)} <span className="font-normal text-muted-foreground text-sm">minggu ini</span>
        </div>
        <p className="text-muted-foreground text-sm">
          {improved ? "Lebih baik" : "Perlu ditingkatkan"} dibanding {formatDurationShort(lastHours)} minggu lalu.
        </p>
      </div>
      <div className="flex flex-col gap-2 pt-0.5">
        <Progress value={progress} className="h-2.5 bg-chart-1/12 *:data-[slot='progress-indicator']:bg-chart-1" />
        <div className="flex items-center justify-between text-xs">
          <div className="font-medium tabular-nums">{formatDurationShort(thisHours)}</div>
          <div className="text-muted-foreground tabular-nums">{formatDurationShort(lastHours)} lalu</div>
        </div>
      </div>
    </div>
  );
}

function formatAxisDate(date: string, range: "week" | "month") {
  const d = parseISO(date);
  if (range === "week") return format(d, "EEE", { locale: idLocale });
  return format(d, "d MMM", { locale: idLocale });
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatDeltaHours(delta: number) {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}h`;
}
