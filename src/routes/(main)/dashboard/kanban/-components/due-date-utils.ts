import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";

export type DueDateStatus = "none" | "overdue" | "due-today" | "due-soon" | "upcoming";

export type DueDateMeta = {
  status: DueDateStatus;
  label: string;
  badge: string | null;
  barClassName: string;
  textClassName: string;
  badgeClassName: string;
};

export function getDueDateStatus(dueDateRaw: string | null, isDone: boolean): DueDateStatus {
  if (!dueDateRaw || isDone) return "none";

  const due = startOfDay(parseISO(dueDateRaw));
  const today = startOfDay(new Date());
  const diff = differenceInCalendarDays(due, today);

  if (diff < 0) return "overdue";
  if (diff === 0) return "due-today";
  if (diff <= 3) return "due-soon";
  return "upcoming";
}

export function getDueDateMeta(dueDateRaw: string | null, isDone: boolean, displayDate: string): DueDateMeta {
  const status = getDueDateStatus(dueDateRaw, isDone);

  if (!dueDateRaw) {
    return {
      status: "none",
      label: displayDate,
      badge: null,
      barClassName: "",
      textClassName: "text-muted-foreground",
      badgeClassName: "",
    };
  }

  if (isDone) {
    return {
      status: "none",
      label: displayDate,
      badge: null,
      barClassName: "",
      textClassName: "text-muted-foreground",
      badgeClassName: "",
    };
  }

  const due = startOfDay(parseISO(dueDateRaw));
  const today = startOfDay(new Date());
  const diff = differenceInCalendarDays(due, today);

  switch (status) {
    case "overdue": {
      const days = Math.abs(diff);
      return {
        status,
        label: displayDate,
        badge: days === 1 ? "1d overdue" : `${days}d overdue`,
        barClassName: "bg-destructive",
        textClassName: "font-medium text-destructive",
        badgeClassName: "border-transparent bg-destructive/10 text-destructive",
      };
    }
    case "due-today":
      return {
        status,
        label: displayDate,
        badge: "Due today",
        barClassName: "bg-amber-500",
        textClassName: "font-medium text-amber-700 dark:text-amber-400",
        badgeClassName: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };
    case "due-soon":
      return {
        status,
        label: displayDate,
        badge: diff === 1 ? "Due tomorrow" : `Due in ${diff}d`,
        barClassName: "bg-amber-400/80",
        textClassName: "text-amber-700 dark:text-amber-400",
        badgeClassName: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };
    default:
      return {
        status: "upcoming",
        label: displayDate,
        badge: null,
        barClassName: "",
        textClassName: "text-muted-foreground",
        badgeClassName: "",
      };
  }
}

export function formatDueDateRaw(dueDateRaw: string): string {
  return format(parseISO(dueDateRaw), "MMM d");
}
