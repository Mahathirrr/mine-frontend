"use client";

import * as React from "react";

import { format } from "date-fns";
import { AlignLeft, CalendarDays, ExternalLink, Link2, Pencil, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { calendarFilters, calendarOptions, findGoogleEventColor } from "./calendar-config";
import type { CalendarEventSource } from "./calendar-utils";
import { formatEventRange, parseCalendarDate } from "./calendar-utils";

export type EventPreviewData = {
  id: string;
  source: CalendarEventSource;
  title: string;
  description: string;
  link: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  calendar_slug: string;
  color: string;
  eventId?: number;
  taskId?: number;
  holidayType?: "national" | "joint_leave";
  sourceDoc?: string;
  holidayYear?: number;
};

type EventPreviewPopoverProps = {
  open: boolean;
  anchor: { x: number; y: number } | null;
  event: EventPreviewData | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

function calendarLabel(slug: string): string {
  const fromFilter = calendarFilters.find((item) => item.value === slug);
  if (fromFilter) return fromFilter.label;
  const fromOption = calendarOptions.find((item) => item.value === slug);
  return fromOption?.label ?? slug;
}

function normalizeHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function clampPosition(x: number, y: number, width: number, height: number) {
  const margin = 12;
  const maxX = window.innerWidth - width - margin;
  const maxY = window.innerHeight - height - margin;
  return {
    x: Math.max(margin, Math.min(x, maxX)),
    y: Math.max(margin, Math.min(y, maxY)),
  };
}

export function EventPreviewPopover({ open, anchor, event, onClose, onEdit, onDelete }: EventPreviewPopoverProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  React.useLayoutEffect(() => {
    if (!open || !anchor || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setPosition(clampPosition(anchor.x, anchor.y, rect.width, rect.height));
  }, [open, anchor]);

  if (!open || !event || !anchor) return null;

  const isHoliday = event.source === "holiday";
  const isKanban = event.source === "kanban";
  const color = findGoogleEventColor(event.color).accent;
  const timeLabel = formatEventRange(event.start_at, event.end_at, event.all_day);
  const holidayStart = isHoliday ? parseCalendarDate(event.start_at) : null;
  const holidayDate = holidayStart ? format(holidayStart, "EEEE, d MMMM yyyy") : null;

  return (
    <>
      <button
        type="button"
        aria-label="Close event preview"
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="fixed z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border bg-popover text-popover-foreground shadow-xl"
        style={{ left: position.x, top: position.y }}
        role="dialog"
        aria-label="Event details"
      >
        <div className="flex items-center justify-end gap-0.5 border-b px-2 py-1.5">
          {!isHoliday && onEdit ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={isKanban ? "Edit task" : "Edit event"}
              onClick={onEdit}
            >
              <Pencil />
            </Button>
          ) : null}
          {!isHoliday && !isKanban && onDelete ? (
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Delete event" onClick={onDelete}>
              <Trash2 />
            </Button>
          ) : null}
          <Button type="button" size="icon-sm" variant="ghost" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 size-3 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
            <div className="min-w-0 space-y-1">
              <h3 className="font-semibold text-base leading-snug">{event.title}</h3>
              {isHoliday ? (
                <Badge variant={event.holidayType === "national" ? "destructive" : "secondary"}>
                  {event.holidayType === "national" ? "Libur Nasional" : "Cuti Bersama"}
                </Badge>
              ) : null}
              {isKanban ? <Badge variant="secondary">Task</Badge> : null}
            </div>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p>{isHoliday ? holidayDate : timeLabel}</p>
              {isHoliday && event.holidayYear ? (
                <p className="text-muted-foreground text-xs">Tahun {event.holidayYear}</p>
              ) : null}
            </div>
          </div>

          {event.description.trim() ? (
            <div className="flex items-start gap-3 text-sm">
              <AlignLeft className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          ) : null}

          {event.link.trim() ? (
            <div className="flex items-start gap-3 text-sm">
              <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <a
                href={normalizeHref(event.link.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all text-primary hover:underline"
              >
                {event.link.trim()}
                <ExternalLink className="size-3 shrink-0" />
              </a>
            </div>
          ) : null}

          {!isHoliday ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">{calendarLabel(event.calendar_slug)}</span>
            </div>
          ) : event.sourceDoc ? (
            <div className="flex items-start gap-3 text-sm">
              <AlignLeft className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground text-xs">{event.sourceDoc}</p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
