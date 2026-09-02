import { cn } from "cn";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { getDueDateMeta } from "./due-date-utils";

type DueDateIndicatorProps = {
  dueDateRaw: string | null;
  displayDate: string;
  isDone?: boolean;
  showBadge?: boolean;
  className?: string;
};

export function DueDateIndicator({
  dueDateRaw,
  displayDate,
  isDone = false,
  showBadge = true,
  className,
}: DueDateIndicatorProps) {
  const meta = getDueDateMeta(dueDateRaw, isDone, displayDate);

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      {showBadge && meta.badge ? (
        <Badge variant="secondary" className={cn("shrink-0 rounded-md px-2 font-medium text-xs", meta.badgeClassName)}>
          {meta.badge}
        </Badge>
      ) : null}
      <span className={cn("truncate text-sm", meta.textClassName)}>{meta.label}</span>
      <CalendarDays className={cn("size-3 shrink-0", meta.textClassName)} />
    </div>
  );
}

export function DueDateStatusBar({
  dueDateRaw,
  isDone = false,
  className,
}: {
  dueDateRaw: string | null;
  isDone?: boolean;
  className?: string;
}) {
  const meta = getDueDateMeta(dueDateRaw, isDone, "");
  if (!meta.barClassName) return null;

  return <div aria-hidden className={cn("absolute inset-x-0 top-0 h-1 rounded-t-xl", meta.barClassName, className)} />;
}
