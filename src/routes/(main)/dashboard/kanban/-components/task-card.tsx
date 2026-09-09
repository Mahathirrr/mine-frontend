import { cn } from "cn";
import { ArrowUpRight, BadgeCheck, Flame, Link2, type LucideIcon, Minus, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { tagTones } from "./data";
import { DueDateIndicator, DueDateStatusBar } from "./due-date-indicator";
import type { ColumnId, Task, TaskPriority } from "./types";

const priorityBadgeConfig: Record<
  TaskPriority,
  { icon: LucideIcon; variant: "destructive" | "secondary"; className: string }
> = {
  High: {
    icon: Flame,
    variant: "destructive",
    className: "border-transparent",
  },
  Low: {
    icon: Minus,
    variant: "secondary",
    className: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
  Medium: {
    icon: ArrowUpRight,
    variant: "secondary",
    className: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

function linkLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function normalizeHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function TaskCard({
  task,
  columnId,
  isOverlay = false,
  onEdit,
}: {
  task: Task;
  columnId?: ColumnId;
  isOverlay?: boolean;
  onEdit?: () => void;
}) {
  const isDone = columnId === "done";
  const showProgress = task.progress > 0;
  const PriorityIcon = priorityBadgeConfig[task.priority].icon;
  const hasFooter = Boolean(task.link) || isDone;

  return (
    <article
      className={cn(
        "group/card relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 text-card-foreground shadow-xs",
        isOverlay && "w-68 rotate-1 shadow-lg",
        onEdit && !isOverlay && "cursor-pointer",
      )}
      onClick={onEdit && !isOverlay ? onEdit : undefined}
      onKeyDown={
        onEdit && !isOverlay
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onEdit();
              }
            }
          : undefined
      }
      role={onEdit && !isOverlay ? "button" : undefined}
      tabIndex={onEdit && !isOverlay ? 0 : undefined}
    >
      <DueDateStatusBar dueDateRaw={task.dueDateRaw} isDone={isDone} />

      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate font-medium text-sm leading-none">{task.title}</h3>
          <div className="flex shrink-0 items-center gap-1">
            {onEdit && !isOverlay ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="opacity-0 transition-opacity group-hover/card:opacity-100"
                aria-label={`Edit ${task.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Pencil />
              </Button>
            ) : null}
            <Badge
              variant={priorityBadgeConfig[task.priority].variant}
              className={cn(
                "rounded-md border-transparent px-2 font-medium",
                priorityBadgeConfig[task.priority].className,
              )}
            >
              <PriorityIcon data-icon="inline-start" />
              {task.priority}
            </Badge>
          </div>
        </div>
        <p className="line-clamp-2 text-muted-foreground text-sm leading-5">{task.description}</p>
      </div>

      {!showProgress ? (
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="secondary"
            className={cn("rounded-md border-transparent px-2 font-medium", tagTones[task.team])}
          >
            {task.team}
          </Badge>
          <DueDateIndicator
            dueDateRaw={task.dueDateRaw}
            displayDate={task.dueDate}
            isDone={isDone}
            className="justify-end"
          />
        </div>
      ) : null}

      {showProgress ? (
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span className="leading-none">Progress</span>
              <span className="tabular-nums leading-none">{task.progress}%</span>
            </div>
            <Progress value={task.progress} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground text-sm">Due date</span>
              <DueDateIndicator
                dueDateRaw={task.dueDateRaw}
                displayDate={task.dueDate}
                isDone={isDone}
                className="justify-end"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground text-sm">Team</span>
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-md border-transparent px-2 font-medium",
                  tagTones[task.team as keyof typeof tagTones] ?? "bg-muted text-foreground",
                )}
              >
                {task.team}
              </Badge>
            </div>
          </div>
        </div>
      ) : null}

      {hasFooter ? (
        <>
          <Separator />
          <div className="space-y-2">
            {task.link ? (
              <a
                href={normalizeHref(task.link)}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-1.5 text-primary text-sm hover:underline"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Link2 className="size-3.5 shrink-0" />
                <span className="truncate">{linkLabel(task.link)}</span>
              </a>
            ) : null}
            {isDone ? (
              <div className="flex items-center gap-1 font-medium text-green-700 text-sm dark:text-green-600">
                <BadgeCheck className="size-4" />
                Done
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </article>
  );
}
