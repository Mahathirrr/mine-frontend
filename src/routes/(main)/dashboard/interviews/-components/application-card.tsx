"use client";

import { cn } from "cn";
import { Calendar, MapPin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AppStatus, InterviewApplicationWithRounds } from "@/lib/api/interviews";

import { PRIORITY_LABEL, WORK_TYPE_LABEL } from "./interview-constants";
import { appRounds, companyInitials, formatRelativeSchedule, formatSalary } from "./interview-utils";

type ApplicationCardProps = {
  app: InterviewApplicationWithRounds;
  status: AppStatus;
  onClick: () => void;
  isOverlay?: boolean;
};

export function ApplicationCard({ app, onClick, isOverlay }: ApplicationCardProps) {
  const salary = formatSalary(app);
  const rounds = appRounds(app);
  const nextRound = rounds.find((r) => r.status === "scheduled" && r.scheduled_at);
  const scheduleLabel = nextRound ? formatRelativeSchedule(nextRound.scheduled_at) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30",
        isOverlay && "rotate-1 shadow-lg ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary text-xs">
          {companyInitials(app.company)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm leading-tight">{app.company}</p>
          <p className="mt-0.5 truncate text-muted-foreground text-xs">{app.role_title}</p>
        </div>
        {app.priority <= 2 ? (
          <Star
            className={cn(
              "size-3.5 shrink-0",
              app.priority === 1 ? "fill-amber-400 text-amber-500" : "text-muted-foreground",
            )}
            aria-label={`Prioritas ${PRIORITY_LABEL[app.priority] ?? app.priority}`}
          />
        ) : null}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {app.work_type !== "unknown" ? (
          <Badge variant="outline" className="text-[10px]">
            {WORK_TYPE_LABEL[app.work_type]}
          </Badge>
        ) : null}
        {app.location ? (
          <Badge variant="outline" className="gap-0.5 text-[10px]">
            <MapPin className="size-2.5" />
            <span className="max-w-[8rem] truncate">{app.location}</span>
          </Badge>
        ) : null}
        {salary ? (
          <Badge variant="secondary" className="max-w-full truncate text-[10px]">
            {salary}
          </Badge>
        ) : null}
      </div>

      {scheduleLabel ? (
        <p className="mt-2 flex items-center gap-1 text-amber-700 text-xs dark:text-amber-400">
          <Calendar className="size-3 shrink-0" />
          <span className="truncate">{scheduleLabel}</span>
        </p>
      ) : null}

      {rounds.length > 0 ? (
        <p className="mt-2 text-muted-foreground text-[11px] tabular-nums">
          {rounds.filter((r) => r.outcome === "passed").length}/{rounds.length} tahap selesai
        </p>
      ) : null}
    </button>
  );
}
