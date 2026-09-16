import { endOfDay, format, parseISO, subMilliseconds } from "date-fns";

import type { CalendarEventRecord, HolidayCalendarEvent, TaskCalendarEvent } from "@/lib/api/tasks";

import { calendarColors } from "./calendar-config";

export type CalendarEventSource = "event" | "kanban" | "holiday";

export type CalendarUiEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  editable: boolean;
  durationEditable: boolean;
  extendedProps: {
    source: CalendarEventSource;
    calendar_slug: string;
    description: string;
    link: string;
    eventId?: number;
    taskId?: number;
    columnId?: string;
    holidayType?: "national" | "joint_leave";
    sourceDoc?: string;
    holidayYear?: number;
  };
};

export function mapApiEvents(
  events: CalendarEventRecord[],
  taskEvents: TaskCalendarEvent[],
  holidayEvents: HolidayCalendarEvent[] = [],
): CalendarUiEvent[] {
  return [
    ...events.map((event) => ({
      id: String(event.id),
      title: event.title,
      start: event.start_at,
      end: event.end_at ?? undefined,
      allDay: event.all_day,
      backgroundColor: event.color,
      borderColor: event.color,
      textColor: "#ffffff",
      editable: true,
      durationEditable: !event.all_day,
      extendedProps: {
        source: "event" as const,
        calendar_slug: event.calendar_slug,
        description: event.description,
        link: event.link ?? "",
        eventId: event.id,
      },
    })),
    ...taskEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: calendarColors.kanban,
      borderColor: calendarColors.kanban,
      textColor: "#ffffff",
      editable: true,
      durationEditable: false,
      extendedProps: {
        source: "kanban" as const,
        calendar_slug: "kanban",
        description: "",
        link: event.link ?? "",
        taskId: event.task_id,
        columnId: event.column_id,
      },
    })),
    ...holidayEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      allDay: true,
      backgroundColor: event.color,
      borderColor: event.color,
      textColor: "#ffffff",
      editable: false,
      durationEditable: false,
      extendedProps: {
        source: "holiday" as const,
        calendar_slug: "holidays",
        description: event.description,
        link: "",
        holidayType: event.holiday_type,
        sourceDoc: event.source_doc,
        holidayYear: event.year,
      },
    })),
  ];
}

export function parseCalendarDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  const normalized = trimmed.length <= 10 ? `${trimmed.slice(0, 10)}T00:00:00` : trimmed;
  const parsed = parseISO(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const fallback = new Date(normalized);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function toDatetimeLocalValue(iso: string, allDay: boolean): string {
  const date = parseCalendarDate(iso) ?? new Date();
  if (allDay) return format(date, "yyyy-MM-dd");
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function splitDatetimeLocal(value: string): { date: string; time: string } {
  if (!value.trim()) {
    const now = new Date();
    return { date: format(now, "yyyy-MM-dd"), time: format(now, "HH:mm") };
  }
  if (value.length <= 10) return { date: value.slice(0, 10), time: "09:00" };
  return { date: value.slice(0, 10), time: value.slice(11, 16) };
}

export function combineDatetimeLocal(date: string, time: string): string {
  const safeDate = date.trim() || format(new Date(), "yyyy-MM-dd");
  const safeTime = time.trim() || "09:00";
  return `${safeDate}T${safeTime}`;
}

export function defaultTimedStart(date = new Date()): string {
  const rounded = new Date(date);
  rounded.setMinutes(0, 0, 0);
  if (rounded.getHours() < 9) rounded.setHours(9);
  return format(rounded, "yyyy-MM-dd'T'HH:mm");
}

export function formatEventRange(startIso: string, endIso: string | null | undefined, allDay: boolean): string {
  const start = parseCalendarDate(startIso);
  if (!start) return "Date unavailable";

  if (allDay) {
    if (endIso) {
      const end = parseCalendarDate(endIso);
      if (end && format(start, "yyyy-MM-dd") !== format(end, "yyyy-MM-dd")) {
        return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
      }
    }
    return format(start, "EEEE, MMM d, yyyy");
  }

  if (endIso) {
    const end = parseCalendarDate(endIso);
    if (end) {
      if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
        return `${format(start, "EEEE, MMM d")} · ${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
      }
      return `${format(start, "MMM d, h:mm a")} – ${format(end, "MMM d, h:mm a")}`;
    }
  }

  return `${format(start, "EEEE, MMM d")} · ${format(start, "h:mm a")}`;
}

export function isoFromFormValues(
  start: string,
  end: string,
  allDay: boolean,
): { start_at: string; end_at: string | null } {
  const startAt = allDay ? `${start.slice(0, 10)}T00:00:00` : start;
  const endAt = end.trim() === "" ? null : allDay ? `${end.slice(0, 10)}T23:59:59` : end;

  return {
    start_at: new Date(startAt).toISOString(),
    end_at: endAt ? new Date(endAt).toISOString() : null,
  };
}

export type ClearScope = "day" | "week" | "month" | "year";

export type VisibleRange = { start: Date; end: Date };

export function resolveClearScope(viewType: string): ClearScope {
  switch (viewType) {
    case "timeGridDay":
      return "day";
    case "timeGridWeek":
    case "listWeek":
      return "week";
    case "multiMonthYear":
      return "year";
    default:
      return "month";
  }
}

export function visibleRangeEndInclusive(range: VisibleRange) {
  return subMilliseconds(range.end, 1);
}

export function bulkDeleteRange(range: VisibleRange) {
  const endInclusive = visibleRangeEndInclusive(range);
  return {
    start: range.start,
    end: endOfDay(endInclusive),
  };
}

export function clearScopeTitle(scope: ClearScope) {
  switch (scope) {
    case "day":
      return "Hapus event hari ini";
    case "week":
      return "Hapus event minggu ini";
    case "month":
      return "Hapus event bulan ini";
    case "year":
      return "Hapus event tahun ini";
  }
}

export function clearScopeDescription(scope: ClearScope, range: VisibleRange) {
  const endInclusive = visibleRangeEndInclusive(range);
  switch (scope) {
    case "day":
      return format(range.start, "EEEE, d MMMM yyyy");
    case "week":
      return `${format(range.start, "d MMM")} – ${format(endInclusive, "d MMM yyyy")}`;
    case "month":
      return format(range.start, "MMMM yyyy");
    case "year":
      return format(range.start, "yyyy");
  }
}

export function countClearableEvents(events: CalendarUiEvent[], range: VisibleRange) {
  const { start, end } = bulkDeleteRange(range);
  return events.filter((event) => {
    if (event.extendedProps.source === "holiday") return false;
    const eventStart = parseCalendarDate(event.start);
    if (!eventStart) return false;
    return eventStart >= start && eventStart <= end;
  }).length;
}

export function defaultEndFromStart(start: string, allDay: boolean): string {
  const date = parseCalendarDate(start) ?? new Date();
  if (allDay) {
    return format(date, "yyyy-MM-dd");
  }
  const end = new Date(date);
  end.setHours(end.getHours() + 1);
  return format(end, "yyyy-MM-dd'T'HH:mm");
}
