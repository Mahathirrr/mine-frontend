"use client";

import { cn } from "cn";
import { Calendar, MapPin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { JobApplicationWithRounds, JobStatus } from "@/lib/api/job-tracker";

function companyInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

type Props = {
  app: JobApplicationWithRounds;
  onClick: () => void;
  isOverlay?: boolean;
};

export function JobApplicationCard({ app, onClick, isOverlay }: Props) {
  const nextRound = app.rounds.find((r) => r.status === "scheduled" && r.scheduled_at);

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
          {companyInitials(app.company_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm leading-tight">{app.company_name}</p>
          <p className="mt-0.5 truncate text-muted-foreground text-xs">{app.role_title}</p>
        </div>
        {app.priority <= 2 ? (
          <Star
            className={cn(
              "size-3.5 shrink-0",
              app.priority === 1 ? "fill-amber-400 text-amber-500" : "text-muted-foreground",
            )}
          />
        ) : null}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {app.location ? (
          <Badge variant="outline" className="gap-0.5 text-[10px]">
            <MapPin className="size-2.5" />
            <span className="max-w-[8rem] truncate">{app.location}</span>
          </Badge>
        ) : null}
        {app.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>
      {nextRound?.scheduled_at ? (
        <p className="mt-2 flex items-center gap-1 text-amber-700 text-xs dark:text-amber-400">
          <Calendar className="size-3 shrink-0" />
          <span className="truncate">{nextRound.title}</span>
        </p>
      ) : null}
    </button>
  );
}

export type JobPipelineBoardState = Record<JobStatus, JobApplicationWithRounds[]>;
