"use client";

import { cn } from "cn";

import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";

type PrepProgressSummaryProps = {
  practiced: number;
  total: number;
  label?: string;
  compact?: boolean;
  className?: string;
};

export function PrepProgressSummary({ practiced, total, label, compact, className }: PrepProgressSummaryProps) {
  const pct = total > 0 ? Math.round((practiced / total) * 100) : 0;

  if (compact) {
    return (
      <div className={cn("min-w-[140px] space-y-1.5", className)}>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{label ?? "Progress"}</span>
          <span className="font-medium tabular-nums">
            {practiced}/{total} · {pct}%
          </span>
        </div>
        <Progress value={pct} className="gap-0">
          <ProgressTrack className="h-1.5">
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border px-3 py-2", className)}>
      <div className="min-w-0 text-right">
        {label ? <p className="truncate text-muted-foreground text-xs">{label}</p> : null}
        <p className="font-semibold text-sm tabular-nums">
          {practiced}/{total} dipraktikkan
        </p>
        <p className="text-muted-foreground text-xs">{pct}% siap</p>
      </div>
      <PrepProgressRing pct={pct} />
    </div>
  );
}

export function PrepProgressRing({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className={cn("relative size-11 shrink-0", className)}>
      <svg viewBox="0 0 36 36" className="size-11 -rotate-90" role="img" aria-label={`Progress ${pct}%`}>
        <title>Progress {pct}%</title>
        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          className="stroke-emerald-500"
          strokeWidth="3"
          strokeDasharray={`${pct} 100`}
          strokeLinecap="round"
        />
      </svg>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-semibold text-[10px] tabular-nums">
        {pct}%
      </span>
    </div>
  );
}
