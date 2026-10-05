"use client";

import * as React from "react";

import type { DateSelectInfo, EventClickInfo, EventDropInfo, EventResizeDoneInfo } from "@fullcalendar/react";
import { useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Plus, XIcon } from "lucide-react";

import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/api-error";
import { tasksApi } from "@/lib/api/tasks";
import { useAuthStore } from "@/stores/auth/auth-provider";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { CalendarClearMenu } from "./calendar-clear-menu";
import { calendarEventTimeFormat, calendarFilters, calendarViews, timeGridOptions } from "./calendar-config";
import {
  applyThemeToEvents,
  bulkDeleteRange,
  type CalendarUiEvent,
  countClearableEvents,
  defaultEndFromStart,
  defaultTimedStart,
  mapApiEvents,
  resolveClearScope,
  toDatetimeLocalValue,
} from "./calendar-utils";
import { resolveStoredEventColor } from "./event-color-utils";
import { EventFormDialog, type EventFormValues } from "./event-form-dialog";
import { type EventPreviewData, EventPreviewPopover } from "./event-preview-popover";

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];

type EditingEventState = {
  id: string;
  source: "event" | "kanban";
  eventId?: number;
  taskId?: number;
  title: string;
  description: string;
  link: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  calendar_slug: string;
  color: string;
};

export function Calendar() {
  const token = useAuthStore((s) => s.token);
  const resolvedThemeMode = usePreferencesStore((s) => s.resolvedThemeMode);
  const isDark = resolvedThemeMode === "dark";
  const controller = useCalendarController();
  const [events, setEvents] = React.useState<CalendarUiEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [currentView, setCurrentView] = React.useState(calendarViews[0].value);
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [editingEvent, setEditingEvent] = React.useState<EditingEventState | null>(null);
  const [defaultStart, setDefaultStart] = React.useState<string>();
  const [defaultEnd, setDefaultEnd] = React.useState<string>();
  const [defaultAllDay, setDefaultAllDay] = React.useState(false);
  const [selectedCalendar, setSelectedCalendar] = React.useState(calendarFilters[0].value);
  const [range, setRange] = React.useState<{ start: Date; end: Date }>(() => {
    const now = new Date();
    return { start: startOfMonth(now), end: endOfMonth(now) };
  });
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewAnchor, setPreviewAnchor] = React.useState<{ x: number; y: number } | null>(null);
  const [previewEvent, setPreviewEvent] = React.useState<EventPreviewData | null>(null);
  const [dateInfo, setDateInfo] = React.useState(() => {
    const now = new Date();
    return {
      title: format(now, "MMMM yyyy"),
      days: differenceInCalendarDays(endOfMonth(now), startOfMonth(now)) + 1,
    };
  });

  const loadEvents = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await tasksApi.listCalendarEvents(token, range.start.toISOString(), range.end.toISOString());
      setEvents(mapApiEvents(res.events, res.task_events, res.holiday_events, isDark));
    } catch (e) {
      toast.add({
        title: "Failed to load calendar",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [token, range.end, range.start, isDark]);

  React.useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  React.useEffect(() => {
    setEvents((prev) => (prev.length ? applyThemeToEvents(prev, isDark) : prev));
  }, [isDark]);

  const filteredEvents = React.useMemo(() => {
    if (selectedCalendar === "all") return events;
    if (selectedCalendar === "kanban") {
      return events.filter((event) => event.extendedProps.source === "kanban");
    }
    if (selectedCalendar === "holidays") {
      return events.filter((event) => event.extendedProps.source === "holiday");
    }
    return events.filter((event) => event.extendedProps.calendar_slug === selectedCalendar);
  }, [events, selectedCalendar]);

  function openCreateDialog(start?: string, end?: string, allDay = false) {
    setFormMode("create");
    setEditingEvent(null);
    const timedStart = start ?? defaultTimedStart();
    setDefaultStart(allDay ? timedStart.slice(0, 10) : timedStart);
    setDefaultEnd(end ?? (allDay ? undefined : defaultEndFromStart(timedStart, false)));
    setDefaultAllDay(allDay);
    setFormOpen(true);
  }

  function openPreviewFromClick(info: EventClickInfo) {
    const props = info.event.extendedProps as CalendarUiEvent["extendedProps"];
    const source = props.source ?? "event";
    const rect = info.el.getBoundingClientRect();

    setPreviewAnchor({ x: rect.left, y: rect.bottom + 8 });
    setPreviewEvent({
      id: info.event.id,
      source,
      title: info.event.title,
      description: props.description ?? "",
      link: props.link ?? "",
      start_at: info.event.start?.toISOString() ?? new Date().toISOString(),
      end_at: info.event.end?.toISOString() ?? null,
      all_day: info.event.allDay ?? false,
      calendar_slug: props.calendar_slug ?? "work",
      color: props.accentColor ?? info.event.borderColor ?? resolveStoredEventColor("", props.calendar_slug ?? "work"),
      eventId: props.eventId,
      taskId: props.taskId,
      holidayType: props.holidayType,
      sourceDoc: props.sourceDoc,
      holidayYear: props.holidayYear,
    });
    setPreviewOpen(true);
  }

  function openEditFromPreview() {
    if (!previewEvent || previewEvent.source === "holiday") return;
    setPreviewOpen(false);
    setFormMode("edit");
    setEditingEvent({
      id: previewEvent.id,
      source: previewEvent.source,
      eventId: previewEvent.eventId,
      taskId: previewEvent.taskId,
      title: previewEvent.title.replace(/^Cuti Bersama:\s*/, ""),
      description: previewEvent.description,
      link: previewEvent.link,
      start_at: previewEvent.start_at,
      end_at: previewEvent.end_at,
      all_day: previewEvent.all_day,
      calendar_slug: previewEvent.calendar_slug,
      color: previewEvent.color,
    });
    setFormOpen(true);
  }

  async function handleDeleteFromPreview() {
    if (!previewEvent?.eventId || !token) return;
    setPreviewOpen(false);
    setSaving(true);
    try {
      await tasksApi.deleteCalendarEvent(token, previewEvent.eventId);
      await loadEvents();
      toast.add({ title: "Event deleted", type: "success" });
    } catch (e) {
      toast.add({
        title: "Failed to delete event",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateEvent(values: EventFormValues) {
    if (!token) return;
    setSaving(true);
    try {
      await tasksApi.createCalendarEvent(token, {
        ...values,
        color: values.color,
      });
      await loadEvents();
      toast.add({ title: "Event created", type: "success" });
    } catch (e) {
      toast.add({
        title: "Failed to create event",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateEvent(values: EventFormValues) {
    if (!token || !editingEvent) return;
    setSaving(true);
    try {
      if (editingEvent.source === "kanban" && editingEvent.taskId) {
        await tasksApi.update(token, editingEvent.taskId, {
          title: values.title,
          due_date: values.start_at.slice(0, 10),
          link: values.link,
        });
      } else if (editingEvent.eventId) {
        await tasksApi.updateCalendarEvent(token, editingEvent.eventId, {
          title: values.title,
          description: values.description,
          link: values.link,
          start_at: values.start_at,
          end_at: values.end_at,
          all_day: values.all_day,
          calendar_slug: values.calendar_slug,
          color: values.color,
        });
      }
      await loadEvents();
      toast.add({ title: "Event updated", type: "success" });
    } catch (e) {
      toast.add({
        title: "Failed to update event",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  const clearScope = React.useMemo(() => resolveClearScope(currentView), [currentView]);

  const countClearableInView = React.useCallback(async () => {
    if (!token) return 0;
    const res = await tasksApi.listCalendarEvents(token, range.start.toISOString(), range.end.toISOString());
    const scoped = mapApiEvents(res.events, res.task_events, res.holiday_events);
    return countClearableEvents(scoped, range);
  }, [range, token]);

  async function handleBulkClear() {
    if (!token) return;
    const { start, end } = bulkDeleteRange(range);
    setClearing(true);
    try {
      const result = await tasksApi.bulkDeleteCalendarEvents(token, {
        start: start.toISOString(),
        end: end.toISOString(),
        clear_task_due_dates: true,
      });
      await loadEvents();
      toast.add({
        title: "Kalender dibersihkan",
        description: `${result.deleted_events} event dihapus, ${result.cleared_tasks} due date task dihapus.`,
        type: "success",
      });
    } catch (e) {
      toast.add({
        title: "Gagal membersihkan kalender",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
      throw e;
    } finally {
      setClearing(false);
    }
  }

  async function handleDeleteEvent() {
    if (!token || !editingEvent?.eventId) return;
    setSaving(true);
    try {
      await tasksApi.deleteCalendarEvent(token, editingEvent.eventId);
      await loadEvents();
      toast.add({ title: "Event deleted", type: "success" });
    } catch (e) {
      toast.add({
        title: "Failed to delete event",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function persistEventMove(info: EventDropInfo | EventResizeDoneInfo) {
    if (!token) {
      info.revert();
      return;
    }

    const props = info.event.extendedProps as CalendarUiEvent["extendedProps"];
    if (props.source === "holiday") {
      info.revert();
      return;
    }

    const startAt = info.event.start?.toISOString();
    const endAt = info.event.end?.toISOString() ?? null;

    if (!startAt) {
      info.revert();
      return;
    }

    setSaving(true);
    try {
      if (props.source === "kanban" && props.taskId) {
        await tasksApi.update(token, props.taskId, { due_date: startAt.slice(0, 10) });
      } else if (props.eventId) {
        await tasksApi.updateCalendarEvent(token, props.eventId, {
          start_at: startAt,
          end_at: endAt,
          all_day: info.event.allDay ?? false,
        });
      }
      await loadEvents();
      toast.add({ title: "Event updated", type: "success" });
    } catch (e) {
      info.revert();
      toast.add({
        title: "Failed to update event",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDateSelect(info: DateSelectInfo) {
    const spansMultipleDays = info.allDay && info.end && differenceInCalendarDays(info.end, info.start) > 1;

    if (spansMultipleDays) {
      let endStr = info.endStr;
      const endDate = new Date(info.end);
      endDate.setDate(endDate.getDate() - 1);
      endStr = format(endDate, "yyyy-MM-dd");
      openCreateDialog(
        toDatetimeLocalValue(info.startStr, true),
        endStr ? toDatetimeLocalValue(endStr, true) : undefined,
        true,
      );
      return;
    }

    const startDate = info.startStr.slice(0, 10);
    const start = info.startStr.includes("T") ? info.startStr.slice(0, 16) : `${startDate}T09:00`;
    const end = info.endStr?.includes("T") ? info.endStr.slice(0, 16) : defaultEndFromStart(start, false);
    openCreateDialog(start, end, false);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-md border">
      <div className="flex flex-col gap-4 border-b bg-sidebar p-4 text-sidebar-foreground lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 shrink-0 flex-col gap-1">
          <div className="font-medium text-lg leading-none">{dateInfo.title}</div>
          <p className="text-muted-foreground text-sm">
            {dateInfo.days} days · {filteredEvents.length} events
            {loading ? " · loading..." : saving ? " · saving..." : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedCalendar}
            onValueChange={(value) => {
              if (value !== null) setSelectedCalendar(value);
            }}
            items={calendarFilters}
          >
            <SelectTrigger className="w-full sm:w-44">
              <CalendarIcon />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectGroup>
                {calendarFilters.map((calendar) => (
                  <SelectItem key={calendar.value} value={calendar.value}>
                    {calendar.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => controller.today()}>
            Today
          </Button>
          <ButtonGroup>
            <Button size="icon" variant="outline" aria-label="Previous" onClick={() => controller.prev()}>
              <ChevronLeft />
            </Button>
            <Button size="icon" variant="outline" aria-label="Next" onClick={() => controller.next()}>
              <ChevronRight />
            </Button>
          </ButtonGroup>
          <Select
            value={controller.view?.type ?? calendarViews[0].value}
            onValueChange={(value) => {
              if (value !== null) {
                controller.changeView(value);
                setCurrentView(value);
              }
            }}
            items={calendarViews}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectGroup>
                {calendarViews.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <CalendarClearMenu
            scope={clearScope}
            range={range}
            clearing={clearing}
            onClear={handleBulkClear}
            onCount={countClearableInView}
          />
          <Button onClick={() => openCreateDialog()}>
            <Plus />
            Add event
          </Button>
        </div>
      </div>

      <div className="relative min-h-[720px]">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        <EventCalendarViews
          controller={controller}
          initialView={calendarViews[0].value}
          plugins={[...plugins]}
          popoverCloseContent={() => <XIcon className="size-5 text-muted-foreground group-hover:text-foreground" />}
          events={filteredEvents}
          nowIndicator
          editable
          selectable
          selectMirror
          unselectAuto
          dayMaxEvents={4}
          displayEventTime
          displayEventEnd={false}
          eventTimeFormat={calendarEventTimeFormat}
          allDaySlot
          slotEventOverlap={false}
          {...timeGridOptions}
          views={{
            timeGridWeek: { dayHeaderFormat: { weekday: "short", month: "numeric", day: "numeric" } },
            timeGridDay: { dayHeaderFormat: { weekday: "long", month: "long", day: "numeric" } },
            listWeek: { buttonText: "Agenda", noEventsText: "No events scheduled" },
            multiMonthYear: { multiMonthMaxColumns: 3 },
          }}
          dateClick={(info) => {
            const start = info.dateStr.length <= 10 ? `${info.dateStr}T09:00` : info.dateStr.slice(0, 16);
            openCreateDialog(start, defaultEndFromStart(start, false), false);
          }}
          select={handleDateSelect}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            openPreviewFromClick(info);
          }}
          eventDrop={(info) => void persistEventMove(info)}
          eventResize={(info) => void persistEventMove(info)}
          datesSet={(info) => {
            setDateInfo({
              title: info.view.title,
              days: differenceInCalendarDays(info.view.currentEnd, info.view.currentStart),
            });
            setRange({ start: info.start, end: info.end });
            setCurrentView(info.view.type);
          }}
        />
      </div>

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        source={editingEvent?.source}
        taskId={editingEvent?.taskId}
        saving={saving}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        defaultAllDay={defaultAllDay}
        initial={
          editingEvent
            ? {
                title: editingEvent.title,
                description: editingEvent.description,
                link: editingEvent.link,
                start_at: editingEvent.start_at,
                end_at: editingEvent.end_at,
                all_day: editingEvent.all_day,
                calendar_slug: editingEvent.calendar_slug,
                color: editingEvent.color,
              }
            : null
        }
        onSubmit={formMode === "edit" ? handleUpdateEvent : handleCreateEvent}
        onDelete={formMode === "edit" && editingEvent?.source === "event" ? handleDeleteEvent : undefined}
      />

      <EventPreviewPopover
        open={previewOpen}
        anchor={previewAnchor}
        event={previewEvent}
        onClose={() => setPreviewOpen(false)}
        onEdit={openEditFromPreview}
        onDelete={previewEvent?.source === "event" ? () => void handleDeleteFromPreview() : undefined}
      />
    </div>
  );
}
