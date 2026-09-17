"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { FastingOverview } from "@/lib/api/fasting";

import { formatDurationShort } from "./fasting-utils";

const fastConfig = { fasting_hours: { label: "Fasting", color: "var(--chart-1)" } } satisfies ChartConfig;
const eatConfig = { eating_hours: { label: "Eating", color: "var(--chart-2)" } } satisfies ChartConfig;

type Props = { data: FastingOverview };

export function FastingStatsPanel({ data }: Props) {
  const cmp = data.week_comparison;
  const fastDelta = cmp.this_week_fasting_hours - cmp.last_week_fasting_hours;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total fasts" value={String(data.stats.total_fasts)} />
        <StatCard label="Longest" value={formatDurationShort(data.stats.longest_hours)} />
        <StatCard label="Avg fast" value={formatDurationShort(data.stats.average_hours)} />
        <StatCard label="Total hours" value={`${Math.round(data.stats.total_hours)}h`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perbandingan minggu</CardTitle>
            <CardDescription>
              {fastDelta >= 0 ? "Fasting minggu ini lebih panjang" : "Fasting minggu ini lebih pendek"} vs minggu lalu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CompareRow label="This week" hours={cmp.this_week_fasting_hours} accent />
            <CompareRow label="Last week" hours={cmp.last_week_fasting_hours} />
            <CompareRow label="Eating window (this week)" hours={cmp.this_week_eating_hours} accent />
            <CompareRow label="Eating window (last week)" hours={cmp.last_week_eating_hours} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Milestone fasting journey</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.badges.map((b) => (
              <Badge key={b.id} variant={b.earned ? "default" : "outline"} className="rounded-full px-3 py-1">
                {b.label}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fasting time (14 hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={fastConfig} className="h-56 w-full">
              <BarChart data={data.fasting_chart}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(8)} />
                <YAxis width={32} domain={[0, 24]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="fasting_hours" fill="var(--color-fasting_hours)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Eating window (14 hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={eatConfig} className="h-56 w-full">
              <BarChart data={data.fasting_chart}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(8)} />
                <YAxis width={32} domain={[0, 24]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="eating_hours" fill="var(--color-eating_hours)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kalender konsistensi</CardTitle>
          <CardDescription>30 hari terakhir · orange = goal tercapai</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 sm:grid-cols-10">
            {data.calendar_heatmap.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.fasting_hours}h fasting`}
                className={`flex aspect-square flex-col items-center justify-center rounded-full text-xs ${heatmapDayClass(d)}`}
              >
                <span className="font-medium">{d.date.slice(8)}</span>
                {d.fasting_hours > 0 && <span className="text-[10px] opacity-70">{Math.round(d.fasting_hours)}h</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function heatmapDayClass(d: { met_goal: boolean; fasting_hours: number }) {
  if (d.met_goal) return "bg-orange-500/20 ring-2 ring-orange-500/60";
  if (d.fasting_hours > 0) return "bg-muted";
  return "bg-muted/40 text-muted-foreground";
}

function CompareRow({ label, hours, accent }: { label: string; hours: number; accent?: boolean }) {
  const pct = Math.min(100, (hours / 24) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{formatDurationShort(hours)}/day</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${accent ? "bg-orange-500" : "bg-muted-foreground/30"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
