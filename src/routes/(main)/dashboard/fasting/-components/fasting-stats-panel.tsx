"use client";

import * as React from "react";

import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const CHART_INNER_H = 140;
const CHART_BOTTOM = 28;
const CHART_TOP = 12;

export function FastingStatsPanel({ data, token, onRefresh }: Props) {
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
        <CardContent className="pt-6">
          <FastingGoalPresets data={data} token={token} onRefresh={onRefresh} />
        </CardContent>
      </Card>

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

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-lg">Fasting & eating charts</h3>
            <p className="text-muted-foreground text-sm">{dateRange} · ketuk bar untuk detail · ↺ = fast multi-hari</p>
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
        </div>
        <PillChart title="Fasting time" data={chartData} dataKey="fasting_hours" max={24} accent />
        <PillChart title="Eating window" data={chartData} dataKey="eating_hours" max={24} />
      </div>

      <div className="max-w-sm space-y-2">
        <div>
          <h3 className="font-semibold text-base">Fasting calendar</h3>
          <p className="text-muted-foreground text-xs">30 hari · orange = goal</p>
        </div>
        <FastingConsistencyCalendar days={data.calendar_heatmap} />
      </div>

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
      <p
        className={`mt-1 font-semibold text-2xl tabular-nums ${highlight ? "text-orange-600 dark:text-orange-400" : ""}`}
      >
        {value}
      </p>
    </div>
  );
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

function dayDetailLines(row: FastingDayChartPoint, kind: "fasting" | "eating") {
  const d = format(parseISO(row.date), "EEEE, d MMM yyyy", { locale: idLocale });
  const lines = [
    d,
    `${kind === "fasting" ? "Puasa" : "Eating window"}: ${formatDurationShort(kind === "fasting" ? row.fasting_hours : row.eating_hours)}`,
  ];
  if (row.started_here) lines.push("Fast dimulai hari ini");
  if (row.ended_here) lines.push("Fast berakhir hari ini");
  if (row.continued) lines.push("Lanjutan fast multi-hari — bagian dari fast lebih panjang (mis. 48–72 jam)");
  if (row.capped_full_day) lines.push("24 jam penuh di hari ini — fast masih lanjut ke hari berikutnya");
  if (row.met_goal) lines.push("Goal harian tercapai");
  return lines;
}

function PillChart({
  title,
  data,
  dataKey,
  max,
  accent,
}: {
  title: string;
  data: FastingDayChartPoint[];
  dataKey: "fasting_hours" | "eating_hours";
  max: number;
  accent?: boolean;
}) {
  const gridLines = [max, max / 2, 0];
  const chartHeight = CHART_INNER_H + CHART_BOTTOM + CHART_TOP;

  return (
    <div>
      <p className="mb-3 font-medium">{title}</p>
      <div className="relative px-1" style={{ height: chartHeight }}>
        {gridLines.map((h) => {
          const y = CHART_BOTTOM + (h / max) * CHART_INNER_H;
          return (
            <div
              key={h}
              className="pointer-events-none absolute right-3 left-10 flex items-center"
              style={{ bottom: y }}
            >
              <span className="w-7 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">{h}h</span>
              <div className="ms-2 h-px flex-1 bg-border/60" />
            </div>
          );
        })}

        <div
          className="absolute right-3 left-3 flex items-end justify-between gap-1 pl-10"
          style={{ bottom: CHART_BOTTOM, height: CHART_INNER_H }}
        >
          {data.map((row) => {
            const val = row[dataKey];
            const barPx = val > 0 ? Math.max(6, (val / max) * CHART_INNER_H) : 2;
            const tooltipLines = dayDetailLines(row, dataKey === "fasting_hours" ? "fasting" : "eating");
            const showContinued = (row.continued || row.capped_full_day) && dataKey === "fasting_hours";

            return (
              <Popover key={row.date}>
                <PopoverTrigger
                  className="group flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-end border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
                  style={{ height: CHART_INNER_H }}
                  render={
                    <button
                      type="button"
                      aria-label={`${tooltipLines[0]} — ${tooltipLines[1]}`}
                      className="flex h-full w-full flex-col items-center justify-end border-0 bg-transparent p-0"
                    />
                  }
                >
                  {showContinued && (
                    <span className="mb-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">
                      <Link2 className="size-2.5" />
                    </span>
                  )}
                  <div
                    className={`w-full max-w-[2.25rem] shrink-0 rounded-full transition-all duration-300 group-hover:brightness-110 group-active:scale-[0.98] ${
                      accent
                        ? "bg-gradient-to-t from-orange-600 to-orange-400 shadow-[0_2px_10px_rgba(249,115,22,0.3)]"
                        : "bg-muted-foreground/35"
                    }`}
                    style={{ height: barPx }}
                  />
                </PopoverTrigger>
                <PopoverContent side="top" className="w-64 rounded-xl px-3 py-2.5 text-xs">
                  <div className="space-y-1">
                    {tooltipLines.map((line) => (
                      <p key={line} className={line === tooltipLines[0] ? "font-semibold" : "text-muted-foreground"}>
                        {line}
                      </p>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        <div className="absolute right-3 left-3 flex justify-between gap-1 pl-10" style={{ bottom: 6 }}>
          {data.map((row) => (
            <span
              key={`lbl-${row.date}`}
              className="min-w-0 flex-1 text-center font-medium text-[11px] text-muted-foreground"
            >
              {format(parseISO(row.date), "EEEEE", { locale: idLocale })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
