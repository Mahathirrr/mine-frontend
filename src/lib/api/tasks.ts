import { ApiError, friendlyApiMessage } from "@/lib/api/api-error";

function resolveApiUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw !== undefined && raw !== "") return raw.replace(/\/$/, "");
  const fallback = import.meta.env.PROD ? "/api" : "http://localhost:8080/api";
  return fallback.replace(/\/$/, "");
}

const API_URL = resolveApiUrl();

function extractErrorMessage(data: Record<string, unknown>): string {
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  return "";
}

async function request<T>(path: string, token: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    throw new ApiError(friendlyApiMessage(res.status, extractErrorMessage(data)), res.status);
  }
  return data as T;
}

export type ColumnId = string;

export type KanbanColumnRecord = {
  id: ColumnId;
  title: string;
  sort_order: number;
};

export type KanbanTask = {
  id: number;
  user_id: number;
  column_id: ColumnId;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  team: string;
  due_date: string | null;
  progress: number;
  link: string;
  sort_order: number;
  comment_count: number;
  attachment_count: number;
  created_at: string;
  updated_at: string;
};

export type BoardState = Record<ColumnId, KanbanTask[]>;

export type CalendarEventRecord = {
  id: number;
  user_id: number;
  task_id: number | null;
  title: string;
  description: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  calendar_slug: string;
  color: string;
  link: string;
  created_at: string;
  updated_at: string;
};

export type TaskCalendarEvent = {
  id: string;
  task_id: number;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  calendar_slug: string;
  color: string;
  link: string;
  source: "kanban";
  column_id: ColumnId;
};

export type HolidayCalendarEvent = {
  id: string;
  title: string;
  description: string;
  start: string;
  allDay: boolean;
  calendar_slug: "holidays";
  color: string;
  source: "holiday";
  holiday_type: "national" | "joint_leave";
  year: number;
  source_doc: string;
};

export const tasksApi = {
  board(token: string) {
    return request<{ columns: KanbanColumnRecord[]; board: BoardState }>("/tasks/board", token);
  },

  createColumn(token: string, body: { title: string }) {
    return request<{ column: KanbanColumnRecord }>("/tasks/columns", token, { method: "POST", body });
  },

  updateColumn(token: string, slug: ColumnId, body: { title: string }) {
    return request<{ column: KanbanColumnRecord }>(`/tasks/columns/${slug}`, token, { method: "PATCH", body });
  },

  deleteColumn(token: string, slug: ColumnId) {
    return request<{ ok: boolean }>(`/tasks/columns/${slug}`, token, { method: "DELETE" });
  },

  create(
    token: string,
    body: {
      column_id: ColumnId;
      title: string;
      description?: string;
      priority?: string;
      team?: string;
      due_date?: string | null;
      progress?: number;
      link?: string;
    },
  ) {
    return request<{ task: KanbanTask }>("/tasks", token, { method: "POST", body });
  },

  update(
    token: string,
    id: number,
    body: Partial<{
      column_id: ColumnId;
      title: string;
      description: string;
      priority: string;
      team: string;
      due_date: string | null;
      progress: number;
      link: string;
      sort_order: number;
    }>,
  ) {
    return request<{ task: KanbanTask }>(`/tasks/${id}`, token, { method: "PATCH", body });
  },

  move(token: string, id: number, body: { column_id: ColumnId; sort_order: number }) {
    return request<{ task: KanbanTask }>(`/tasks/${id}/move`, token, { method: "PATCH", body });
  },

  delete(token: string, id: number) {
    return request<{ ok: boolean }>(`/tasks/${id}`, token, { method: "DELETE" });
  },

  listCalendarEvents(token: string, start: string, end: string) {
    const params = new URLSearchParams({ start, end });
    return request<{
      events: CalendarEventRecord[];
      task_events: TaskCalendarEvent[];
      holiday_events: HolidayCalendarEvent[];
    }>(`/calendar/events?${params}`, token);
  },

  createCalendarEvent(
    token: string,
    body: {
      title: string;
      description?: string;
      start_at: string;
      end_at?: string | null;
      all_day?: boolean;
      calendar_slug?: string;
      color?: string;
      link?: string;
      task_id?: number;
    },
  ) {
    return request<{ event: CalendarEventRecord }>("/calendar/events", token, { method: "POST", body });
  },

  updateCalendarEvent(
    token: string,
    id: number,
    body: Partial<{
      title: string;
      description: string;
      start_at: string;
      end_at: string | null;
      all_day: boolean;
      calendar_slug: string;
      color: string;
      link: string;
    }>,
  ) {
    return request<{ event: CalendarEventRecord }>(`/calendar/events/${id}`, token, { method: "PATCH", body });
  },

  deleteCalendarEvent(token: string, id: number) {
    return request<{ ok: boolean }>(`/calendar/events/${id}`, token, { method: "DELETE" });
  },

  bulkDeleteCalendarEvents(token: string, body: { start: string; end: string; clear_task_due_dates?: boolean }) {
    return request<{ deleted_events: number; cleared_tasks: number }>("/calendar/events/bulk", token, {
      method: "DELETE",
      body,
    });
  },
};
