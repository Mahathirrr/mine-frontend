"use client";

import * as React from "react";

import { cn } from "cn";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type DayData = {
  date: string;
  fasting_hours: number;
  eating_hours: number;
  met_goal: boolean;
};

type Props = {
  days: DayData[];
};

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

type CalendarCell = DayData | null;

function buildCalendarWeeks(days: DayData[]): { month?: string; week: CalendarCell[] }[] {
  if (days.length === 0) return [];

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(sorted.map((d) => [d.date, d]));
  const first = parseISO(sorted[0].date);
  const last = parseISO(sorted[sorted.length - 1].date);
  const start = startOfWeek(first, { weekStartsOn: 0 });

  const cells: CalendarCell[] = [];
  for (let cursor = start; cursor <= last; cursor = addDays(cursor, 1)) {
    const key = format(cursor, "yyyy-MM-dd");
    cells.push(byDate.get(key) ?? { date: key, fasting_hours: 0, eating_hours: 24, met_goal: false });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const result: { month?: string; week: CalendarCell[] }[] = [];
  let lastMonth = "";
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7);
    const firstInWeek = week.find((c) => c != null);
    let month: string | undefined;
    if (firstInWeek) {
      const m = format(parseISO(firstInWeek.date), "MMMM yyyy", { locale: idLocale });
      if (m !== lastMonth) {
        month = m;
        lastMonth = m;
      }
    }
    result.push({ month, week });
  }
  return result;
}

export function FastingConsistencyCalendar({ days }: Props) {
  const weeks = React.useMemo(() => buildCalendarWeeks(days), [days]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-center font-medium text-[11px] text-muted-foreground uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {weeks.map((row, wi) => (
          <React.Fragment key={wi}>
            {row.month && <p className="font-medium text-muted-foreground text-xs">{row.month}</p>}
            <div className="grid grid-cols-7 gap-1.5">
              {row.week.map((cell, ci) =>
                cell ? (
                  <DayCell key={cell.date} cell={cell} />
                ) : (
                  <div key={`e-${wi}-${ci}`} className="aspect-square rounded-xl" />
                ),
              )}
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1 text-muted-foreground text-xs">
        <LegendDot
          className="bg-gradient-to-br from-orange-500/30 to-orange-500/10 ring-1 ring-orange-500/30"
          label="Goal tercapai"
        />
        <LegendDot className="bg-muted/80" label="Ada fast" />
        <LegendDot className="bg-muted/25" label="Kosong" />
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded-md", className)} />
      {label}
    </span>
  );
}

function DayCell({ cell }: { cell: DayData }) {
  const dayNum = Number(cell.date.slice(8));
  const isToday = cell.date === format(new Date(), "yyyy-MM-dd");
  const hasData = cell.fasting_hours > 0;

  return (
    <div
      title={`${cell.date}: ${cell.fasting_hours.toFixed(1)} jam puasa`}
      className={cn(
        "flex aspect-square flex-col items-center justify-center rounded-xl transition-colors",
        cell.met_goal &&
          "bg-gradient-to-br from-orange-500/25 to-orange-500/8 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.25)]",
        !cell.met_goal && hasData && "bg-muted/60",
        !hasData && "bg-muted/20",
        isToday && "ring-2 ring-orange-500/45 ring-offset-1 ring-offset-background",
      )}
    >
      <span className={cn("font-semibold text-sm tabular-nums", isToday && "text-orange-600 dark:text-orange-400")}>
        {dayNum}
      </span>
      <span
        className={cn(
          "mt-0.5 text-[10px] tabular-nums",
          hasData ? "font-medium text-muted-foreground" : "text-muted-foreground/40",
        )}
      >
        {hasData ? `${Math.round(cell.fasting_hours)}h` : "·"}
      </span>
    </div>
  );
}
