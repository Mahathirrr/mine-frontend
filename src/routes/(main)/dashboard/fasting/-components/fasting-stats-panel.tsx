"use client";

import * as React from "react";

import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FastingOverview } from "@/lib/api/fasting";

import { FastingConsistencyCalendar } from "./fasting-consistency-calendar";
import { formatDurationShort } from "./fasting-utils";

type Props = { data: FastingOverview };

export function FastingStatsPanel({ data }: Props) {
  const [range, setRange] = React.useState<"week" | "month">("week");
  const chartData = range === "week" ? data.fasting_chart.slice(-7) : data.fasting_chart;
  const cmp = data.week_comparison;
  const fastDelta = cmp.this_week_fasting_hours - cmp.last_week_fasting_hours;

  const dateRange =
    chartData.length > 0
      ? `${format(parseISO(chartData[0].date), "d MMM", { locale: idLocale })} – ${format(parseISO(chartData[chartData.length - 1].date), "d MMM yyyy", { locale: idLocale })}`
      : "";

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Ringkasan perjalanan fasting kamu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            <SummaryItem label="Total fasts" value={String(data.stats.total_fasts)} />
            <SummaryItem label="Total time" value={`${Math.round(data.stats.total_hours)}h`} />
            <SummaryItem label="Average fast" value={formatDurationShort(data.stats.average_hours)} />
            <SummaryItem label="Longest fast" value={formatDurationShort(data.stats.longest_hours)} />
            <SummaryItem label="Max streak" value={`${data.stats.longest_streak}d`} />
            <SummaryItem label="Current streak" value={`${data.stats.current_streak}d`} highlight />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ComparisonCard
          title="Fasting time"
          insight={
            fastDelta >= 0
              ? "Fasting minggu ini lebih panjang dibanding minggu lalu."
              : "Fasting minggu ini lebih pendek dibanding minggu lalu."
          }
          thisLabel="Minggu ini"
          thisHours={cmp.this_week_fasting_hours}
          lastLabel="Minggu lalu"
          lastHours={cmp.last_week_fasting_hours}
        />
        <ComparisonCard
          title="Eating window"
          insight={
            cmp.this_week_eating_hours > cmp.last_week_eating_hours
              ? "Eating window minggu ini lebih lebar."
              : "Eating window minggu ini lebih sempit."
          }
          thisLabel="Minggu ini"
          thisHours={cmp.this_week_eating_hours}
          lastLabel="Minggu lalu"
          lastHours={cmp.last_week_eating_hours}
        />
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Fasting & eating charts</CardTitle>
            <CardDescription>{dateRange}</CardDescription>
          </div>
          <Tabs value={range} onValueChange={(v) => v && setRange(v as "week" | "month")}>
            <TabsList className="rounded-full">
              <TabsTrigger value="week" className="rounded-full px-4">
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className="rounded-full px-4">
                Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-8">
          <PillChart title="Fasting time" data={chartData} dataKey="fasting_hours" max={24} accent />
          <PillChart title="Eating window" data={chartData} dataKey="eating_hours" max={24} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Fasting calendar</CardTitle>
          <CardDescription>30 hari terakhir · kotak orange = goal tercapai</CardDescription>
        </CardHeader>
        <CardContent>
          <FastingConsistencyCalendar days={data.calendar_heatmap} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Milestone journey</CardDescription>
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

function SummaryItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={cnValue(highlight, "mt-1 font-semibold text-2xl tabular-nums")}>{value}</p>
    </div>
  );
}

function cnValue(highlight: boolean | undefined, base: string) {
  return highlight ? `${base} text-orange-600 dark:text-orange-400` : base;
}

function ComparisonCard({
  title,
  insight,
  thisLabel,
  thisHours,
  lastLabel,
  lastHours,
}: {
  title: string;
  insight: string;
  thisLabel: string;
  thisHours: number;
  lastLabel: string;
  lastHours: number;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{insight}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <PillCompareRow label={thisLabel} hours={thisHours} accent />
        <PillCompareRow label={lastLabel} hours={lastHours} />
      </CardContent>
    </Card>
  );
}

function PillCompareRow({ label, hours, accent }: { label: string; hours: number; accent?: boolean }) {
  const pct = Math.min(100, (hours / 24) * 100);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-muted-foreground text-xs">{label}</span>
        <span className="font-semibold text-lg tabular-nums">
          {formatDurationShort(hours)}
          <span className="font-normal text-muted-foreground text-sm">/day</span>
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted/50">
        <div
          className={`h-full rounded-full transition-all duration-700 ${accent ? "bg-gradient-to-r from-orange-500 to-orange-400" : "bg-muted-foreground/25"}`}
          style={{ width: `${Math.max(pct, hours > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function PillChart({
  title,
  data,
  dataKey,
  max,
  accent,
}: {
  title: string;
  data: { date: string; fasting_hours: number; eating_hours: number }[];
  dataKey: "fasting_hours" | "eating_hours";
  max: number;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-medium">{title}</p>
        <div className="flex gap-3 text-muted-foreground text-xs tabular-nums">
          <span>0h</span>
          <span>{max / 2}h</span>
          <span>{max}h</span>
        </div>
      </div>
      <div className="flex h-44 items-end justify-between gap-2 sm:gap-3">
        {data.map((row) => {
          const val = row[dataKey];
          const pct = Math.min(100, (val / max) * 100);
          const d = parseISO(row.date);
          const dayLetter = format(d, "EEEEE", { locale: idLocale });
          return (
            <div key={row.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-36 w-full max-w-[2.5rem] items-end justify-center">
                <div
                  title={`${row.date}: ${val.toFixed(1)}h`}
                  className={`w-full min-h-[4px] rounded-full transition-all duration-500 ${
                    accent
                      ? "bg-gradient-to-t from-orange-600 to-orange-400 shadow-[0_2px_8px_rgba(249,115,22,0.25)]"
                      : "bg-muted-foreground/30"
                  }`}
                  style={{ height: `${Math.max(pct, val > 0 ? 6 : 0)}%` }}
                />
              </div>
              <span className="font-medium text-muted-foreground text-xs">{dayLetter}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
