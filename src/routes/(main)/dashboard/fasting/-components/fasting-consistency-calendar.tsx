"use client";

import * as React from "react";

import { cn } from "cn";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Link2 } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FastingDayChartPoint } from "@/lib/api/fasting";

import { formatDurationShort } from "./fasting-utils";

type Props = {
  days: FastingDayChartPoint[];
};

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

type CalendarCell = FastingDayChartPoint | null;

function buildCalendarWeeks(days: FastingDayChartPoint[]): { month?: string; week: CalendarCell[] }[] {
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
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-0.5 text-center font-medium text-[9px] text-muted-foreground uppercase">
            {d}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {weeks.map((row) => {
          const weekKey = row.week.map((c) => c?.date ?? "x").join("-");
          return (
            <React.Fragment key={weekKey}>
              {row.month && <p className="font-medium text-[10px] text-muted-foreground">{row.month}</p>}
              <div className="grid grid-cols-7 gap-0.5">
                {row.week.map((cell, ci) =>
                  cell ? (
                    <DayCell key={cell.date} cell={cell} />
                  ) : (
                    <div key={`e-${weekKey}-${WEEKDAYS[ci]}`} className="h-7 rounded-md" />
                  ),
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-muted-foreground">
        <LegendDot
          className="bg-gradient-to-br from-orange-500/30 to-orange-500/10 ring-1 ring-orange-500/30"
          label="Goal tercapai"
        />
        <LegendDot className="bg-muted/80" label="Ada fast" />
        <LegendDot className="bg-muted/25" label="Kosong" />
        <span className="flex items-center gap-1.5">
          <span className="flex size-3 items-center justify-center rounded-md bg-orange-500/15 ring-1 ring-orange-500/30">
            <Link2 className="size-2 text-orange-600" />
          </span>
          Multi-hari
        </span>
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

function DayCell({ cell }: { cell: FastingDayChartPoint }) {
  const dayNum = Number(cell.date.slice(8));
  const isToday = cell.date === format(new Date(), "yyyy-MM-dd");
  const hasData = cell.fasting_hours > 0;
  const dateLabel = format(parseISO(cell.date), "EEEE, d MMM yyyy", { locale: idLocale });

  const detailLines = [
    `${dateLabel}`,
    `Puasa: ${formatDurationShort(cell.fasting_hours)}`,
    `Eating: ${formatDurationShort(cell.eating_hours)}`,
  ];
  if (cell.started_here) detailLines.push("Fast dimulai hari ini");
  if (cell.ended_here) detailLines.push("Fast berakhir hari ini");
  if (cell.continued) detailLines.push("Lanjutan fast multi-hari");
  if (cell.capped_full_day) detailLines.push("24 jam penuh — fast lanjut");

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "relative flex h-7 cursor-pointer flex-col items-center justify-center rounded-md border-0 p-0 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-orange-500/45",
          cell.met_goal &&
            "bg-gradient-to-br from-orange-500/25 to-orange-500/8 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.25)]",
          !cell.met_goal && hasData && "bg-muted/60",
          !hasData && "bg-muted/20",
          isToday && "ring-1 ring-orange-500/50",
        )}
        render={
          <button
            type="button"
            aria-label={`${dateLabel}, ${cell.fasting_hours} jam puasa`}
            className="h-full w-full"
          />
        }
      >
        {(Boolean(cell.continued) || Boolean(cell.capped_full_day)) && (
          <span className="absolute top-0 right-0 flex size-2.5 items-center justify-center rounded-full bg-orange-500/25 text-orange-600">
            <Link2 className="size-1.5" />
          </span>
        )}
        <span
          className={cn(
            "font-semibold text-[10px] tabular-nums leading-none",
            isToday && "text-orange-600 dark:text-orange-400",
          )}
        >
          {dayNum}
        </span>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-56 rounded-xl px-3 py-2 text-xs">
        <div className="space-y-1">
          {detailLines.map((line, i) => (
            <p key={line} className={i === 0 ? "font-semibold" : "text-muted-foreground"}>
              {line}
            </p>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
