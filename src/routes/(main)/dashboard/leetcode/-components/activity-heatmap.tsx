"use client";

import * as React from "react";

import { cn } from "cn";

import type { ActivityDay } from "@/lib/api/leetcode";

const LEVELS = [
  "bg-muted",
  "bg-emerald-300/80 dark:bg-emerald-900",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-500 dark:bg-emerald-600",
  "bg-emerald-600 dark:bg-emerald-500",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const WEEKDAYS = ["", "Sen", "", "Rab", "", "Jum", ""];

function localDayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildGrid(activity: ActivityDay[]) {
  const map = new Map(activity.map((a) => [a.day, a.count]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay());

  const weeks: { date: Date; count: number }[][] = [];
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let cursor = new Date(start);
  let lastMonth = -1;

  while (cursor <= today) {
    const week: { date: Date; count: number }[] = [];
    if (cursor.getMonth() !== lastMonth) {
      monthLabels.push({ label: MONTHS[cursor.getMonth()], weekIndex: weeks.length });
      lastMonth = cursor.getMonth();
    }
    for (let d = 0; d < 7; d++) {
      const key = localDayKey(cursor);
      week.push({ date: new Date(cursor), count: map.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks, monthLabels };
}

function level(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export function ActivityHeatmap({ activity }: { activity: ActivityDay[] }) {
  const { weeks, monthLabels } = React.useMemo(() => buildGrid(activity), [activity]);
  const total = activity.reduce((s, a) => s + a.count, 0);
  const weekCount = weeks.length || 1;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="flex w-full min-w-0 items-stretch gap-2">
        <div className="hidden w-7 shrink-0 sm:flex sm:flex-col sm:justify-around sm:pt-5">
          {WEEKDAYS.map((label) => (
            <span key={label || "sp"} className="h-0 text-[10px] text-muted-foreground leading-none">
              {label}
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="relative h-4 w-full">
            {monthLabels.map((m) => (
              <span
                key={`${m.label}-${m.weekIndex}`}
                className="absolute text-[10px] text-muted-foreground"
                style={{ left: `${(m.weekIndex / weekCount) * 100}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex w-full gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex min-w-0 flex-1 flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    title={`${day.date.toLocaleDateString("id-ID")}: ${day.count} selesai`}
                    className={cn("aspect-square w-full min-h-[8px] max-h-[14px] rounded-[2px]", LEVELS[level(day.count)])}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-muted-foreground text-xs">
        <span>
          <strong className="text-foreground">{total}</strong> selesai · 12 bulan terakhir
        </span>
        <div className="flex items-center gap-1">
          <span>Sedikit</span>
          {LEVELS.map((c, i) => (
            <span
              key={c}
              className={cn("size-2.5 rounded-[2px] sm:size-3", c, i === 0 && "border border-border")}
            />
          ))}
          <span>Banyak</span>
        </div>
      </div>
    </div>
  );
}
