"use client";

import * as React from "react";

import { Link } from "@tanstack/react-router";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { ExternalLink, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { calendarColors, calendarOptions } from "./calendar-config";
import type { CalendarEventSource } from "./calendar-utils";
import {
  combineDatetimeLocal,
  defaultEndFromStart,
  isoFromFormValues,
  parseCalendarDate,
  splitDatetimeLocal,
  toDatetimeLocalValue,
} from "./calendar-utils";

const linkSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\/.+/i.test(value) || /^[\w.-]+\.[a-z]{2,}/i.test(value), {
    message: "Enter a valid URL",
  });

const formSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    link: linkSchema,
    start_at: z.string().min(1),
    end_at: z.string(),
    all_day: z.boolean(),
    calendar_slug: z.string(),
  })
  .refine(
    (values) => {
      if (!values.end_at.trim()) return true;
      const start = values.all_day ? `${values.start_at.slice(0, 10)}T00:00:00` : values.start_at;
      const end = values.all_day ? `${values.end_at.slice(0, 10)}T23:59:59` : values.end_at;
      return new Date(end).getTime() >= new Date(start).getTime();
    },
    { message: "End must be after start", path: ["end_at"] },
  );

export type EventFormValues = {
  title: string;
  description: string;
  link: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  calendar_slug: string;
};

function normalizeHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function linkLabel(url: string): string {
  try {
    return new URL(normalizeHref(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type EventFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  source?: CalendarEventSource;
  taskId?: number;
  saving: boolean;
  defaultStart?: string;
  defaultEnd?: string;
  defaultAllDay?: boolean;
  initial?: {
    title: string;
    description: string;
    link: string;
    start_at: string;
    end_at: string | null;
    all_day: boolean;
    calendar_slug: string;
  } | null;
  onSubmit: (values: EventFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function EventFormDialog({
  open,
  onOpenChange,
  mode,
  source = "event",
  taskId,
  saving,
  defaultStart,
  defaultEnd,
  defaultAllDay = false,
  initial,
  onSubmit,
  onDelete,
}: EventFormDialogProps) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const isKanban = source === "kanban";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      link: "",
      start_at: "",
      end_at: "",
      all_day: false,
      calendar_slug: "work",
    },
  });

  const allDay = form.watch("all_day");
  const startAt = form.watch("start_at");
  const endAt = form.watch("end_at");
  const linkValue = form.watch("link");
  const calendarSlug = form.watch("calendar_slug");

  React.useEffect(() => {
    if (allDay || isKanban) return;
    const start = form.getValues("start_at");
    if (!start.trim() || start.length <= 10) {
      const timedStart = combineDatetimeLocal(start, "09:00");
      form.setValue("start_at", timedStart);
      const end = form.getValues("end_at");
      if (!end.trim() || end.length <= 10) {
        form.setValue("end_at", defaultEndFromStart(timedStart, false));
      }
    }
  }, [allDay, isKanban, form]);

  React.useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initial) {
      const startAt = toDatetimeLocalValue(initial.start_at, initial.all_day);
      const endAt = initial.end_at
        ? toDatetimeLocalValue(initial.end_at, initial.all_day)
        : initial.all_day
          ? ""
          : defaultEndFromStart(startAt, false);
      form.reset({
        title: initial.title,
        description: initial.description,
        link: initial.link,
        start_at: startAt,
        end_at: endAt,
        all_day: initial.all_day,
        calendar_slug: initial.calendar_slug,
      });
      return;
    }

    const start = defaultStart ?? new Date().toISOString().slice(0, 16);
    form.reset({
      title: "",
      description: "",
      link: "",
      start_at: start,
      end_at: defaultEnd ?? defaultEndFromStart(start, defaultAllDay),
      all_day: defaultAllDay,
      calendar_slug: "work",
    });
  }, [open, mode, initial, defaultStart, defaultEnd, defaultAllDay, form]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const payload = isoFromFormValues(values.start_at, values.end_at, values.all_day);
    await onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      link: values.link.trim(),
      start_at: payload.start_at,
      end_at: payload.end_at,
      all_day: values.all_day,
      calendar_slug: values.calendar_slug,
    });
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!onDelete) return;
    await onDelete();
    setDeleteOpen(false);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl" showCloseButton={false}>
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="shrink-0"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X />
            </Button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
              {isKanban ? <Badge variant="secondary">Task</Badge> : null}
              <span className="truncate text-muted-foreground text-sm">
                {mode === "edit" ? (isKanban ? "Edit task" : "Edit event") : "Create event"}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {mode === "edit" && onDelete && !isKanban ? (
                <Button type="button" variant="outline" onClick={() => setDeleteOpen(true)} disabled={saving}>
                  Delete
                </Button>
              ) : null}
              <Button type="submit" form="calendar-event-form" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <form id="calendar-event-form" noValidate onSubmit={form.handleSubmit(handleSubmit)} className="px-6 pb-5">
            <FieldGroup className="gap-6">
              <Controller
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="pt-4">
                    <Input
                      {...field}
                      placeholder="Add title"
                      aria-invalid={fieldState.invalid}
                      className="h-auto rounded-none border-0 border-input border-b px-0 py-2.5 font-normal text-2xl leading-tight shadow-none focus-visible:ring-0"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {!isKanban && !allDay ? (
                <div className="space-y-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground w-10 shrink-0">Start</span>
                    <Controller
                      control={form.control}
                      name="start_at"
                      render={({ field, fieldState }) => {
                        const { date, time } = splitDatetimeLocal(field.value);
                        return (
                          <>
                            <Input
                              type="date"
                              value={date}
                              aria-invalid={fieldState.invalid}
                              className="w-auto"
                              onChange={(e) => field.onChange(combineDatetimeLocal(e.target.value, time))}
                            />
                            <Input
                              type="time"
                              value={time}
                              step={300}
                              aria-invalid={fieldState.invalid}
                              className="w-auto"
                              onChange={(e) => field.onChange(combineDatetimeLocal(date, e.target.value))}
                            />
                          </>
                        );
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground w-10 shrink-0">End</span>
                    <Controller
                      control={form.control}
                      name="end_at"
                      render={({ field, fieldState }) => {
                        const { date, time } = splitDatetimeLocal(field.value);
                        return (
                          <>
                            <Input
                              type="date"
                              value={date}
                              aria-invalid={fieldState.invalid}
                              className="w-auto"
                              onChange={(e) => field.onChange(combineDatetimeLocal(e.target.value, time))}
                            />
                            <Input
                              type="time"
                              value={time}
                              step={300}
                              aria-invalid={fieldState.invalid}
                              className="w-auto"
                              onChange={(e) => field.onChange(combineDatetimeLocal(date, e.target.value))}
                            />
                          </>
                        );
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Controller
                    control={form.control}
                    name="start_at"
                    render={({ field, fieldState }) => (
                      <Input {...field} type="date" aria-invalid={fieldState.invalid} className="w-auto" />
                    )}
                  />
                  {!isKanban && allDay ? (
                    <>
                      <span className="text-muted-foreground">to</span>
                      <Controller
                        control={form.control}
                        name="end_at"
                        render={({ field, fieldState }) => (
                          <Input {...field} type="date" aria-invalid={fieldState.invalid} className="w-auto" />
                        )}
                      />
                    </>
                  ) : null}
                </div>
              )}

              {!isKanban ? (
                <Controller
                  control={form.control}
                  name="all_day"
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id="calendar-all-day"
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                      <FieldContent>
                        <FieldLabel htmlFor="calendar-all-day" className="font-normal">
                          All day
                        </FieldLabel>
                      </FieldContent>
                    </Field>
                  )}
                />
              ) : null}

              {!allDay && !isKanban && startAt && endAt ? (
                <p className="text-muted-foreground text-xs">
                  {(() => {
                    const range = isoFromFormValues(startAt, endAt, false);
                    const start = parseCalendarDate(range.start_at);
                    const end = range.end_at ? parseCalendarDate(range.end_at) : null;
                    if (!start || !end) return null;
                    return `Duration: ${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
                  })()}
                </p>
              ) : null}

              <Separator />

              {!isKanban ? (
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Add description</FieldLabel>
                      <Textarea {...field} rows={4} placeholder="Notes, location, details..." />
                    </Field>
                  )}
                />
              ) : null}

              <Controller
                control={form.control}
                name="link"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Add link</FieldLabel>
                    <Input {...field} type="url" placeholder="https://..." aria-invalid={fieldState.invalid} />
                    {linkValue.trim() ? (
                      <a
                        href={normalizeHref(linkValue.trim())}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        {linkLabel(linkValue.trim())}
                      </a>
                    ) : null}
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {!isKanban ? (
                <Controller
                  control={form.control}
                  name="calendar_slug"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Calendar</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full max-w-xs">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: calendarColors[field.value] }}
                          />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {calendarOptions.map((cal) => (
                            <SelectItem key={cal.value} value={cal.value}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="size-2.5 rounded-full"
                                  style={{ backgroundColor: calendarColors[cal.value] }}
                                />
                                {cal.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">
                        Color: {calendarColors[calendarSlug] ?? calendarColors.work}
                      </p>
                    </Field>
                  )}
                />
              ) : null}
            </FieldGroup>

            {isKanban && taskId ? (
              <div className="mt-6 border-t pt-4">
                <Button type="button" variant="outline" render={<Link to="/dashboard/kanban" />}>
                  <ExternalLink data-icon="inline-start" />
                  Open tasks
                </Button>
              </div>
            ) : null}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>This event will be permanently removed from your calendar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={saving}>
              Delete event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
