"use client";

import * as React from "react";

import { format } from "date-fns";
import { Flame, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FastingOverview } from "@/lib/api/fasting";
import { fastingApi } from "@/lib/api/fasting";

import { FastingTimerRing } from "./fasting-timer-ring";
import { formatDateTime, formatDuration, sessionDurationHours, zoneIcons } from "./fasting-utils";

type Props = {
  data: FastingOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

export function FastingTimerPanel({ data, token, onRefresh }: Props) {
  const [now, setNow] = React.useState(Date.now());
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!data.timer.is_fasting) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [data.timer.is_fasting]);

  const active = data.active_session;
  const elapsed = active ? sessionDurationHours(active, now) : 0;
  const progress = data.profile.goal_hours > 0 ? Math.min(1, elapsed / data.profile.goal_hours) : 0;
  const goalEnd = active ? new Date(new Date(active.started_at).getTime() + data.profile.goal_hours * 3600000) : null;

  async function startFast() {
    setBusy(true);
    try {
      await fastingApi.startSession(token, {
        protocol_slug: data.profile.protocol_slug,
        goal_hours: data.profile.goal_hours,
      });
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function endFast() {
    if (!active) return;
    setBusy(true);
    try {
      await fastingApi.endSession(token, active.id);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  const protocol = data.protocols.find((p) => p.slug === data.profile.protocol_slug);
  const zone = data.zone?.zone;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-orange-50 via-background to-background shadow-none dark:from-orange-950/20">
        <CardHeader className="pb-0 text-center sm:text-left">
          <CardTitle className="flex items-center justify-center gap-2 sm:justify-start">
            <Flame className="size-5 text-orange-500" />
            {data.timer.is_fasting ? "Sedang fasting" : "Siap mulai fast?"}
          </CardTitle>
          <CardDescription>
            {protocol?.label ?? data.profile.protocol_slug} · target {data.profile.goal_hours} jam puasa
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-8 pb-10 pt-4">
          <div className="relative w-full max-w-[340px] rounded-[2rem] bg-gradient-to-b from-stone-100/90 via-background to-orange-500/[0.03] px-2 py-8 dark:from-stone-900/80 dark:via-background dark:to-orange-950/20">
            <FastingTimerRing
              progress={progress}
              elapsedHours={elapsed}
              goalHours={data.profile.goal_hours}
              label={formatDuration(elapsed)}
              sublabel={`Elapsed time ${Math.round(progress * 100)}%`}
              zoneLabel={zone?.label}
              zoneIcon={zone ? (zoneIcons[zone.icon] ?? "⏱") : undefined}
              allZones={data.zone?.all_zones}
            />
          </div>

          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            <div className="rounded-2xl border border-orange-500/10 bg-card/90 p-4 shadow-sm backdrop-blur-sm">
              <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">Started</p>
              <p className="mt-2 font-medium text-sm leading-snug">
                {active ? formatDateTime(active.started_at) : "Belum mulai"}
              </p>
            </div>
            <div className="rounded-2xl border border-orange-500/10 bg-card/90 p-4 shadow-sm backdrop-blur-sm">
              <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">Goal</p>
              <p className="mt-2 font-medium text-sm leading-snug">
                {goalEnd ? format(goalEnd, "EEE d, h:mm a") : `${data.profile.goal_hours}h target`}
              </p>
            </div>
          </div>

          {data.timer.is_fasting ? (
            <Button
              size="lg"
              className="h-12 rounded-full bg-foreground px-10 text-background shadow-lg hover:bg-foreground/90"
              onClick={endFast}
              disabled={busy}
            >
              <Pause className="size-4" />
              End Fast
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-10 shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700"
              onClick={startFast}
              disabled={busy}
            >
              <Play className="size-4" />
              Start Fast
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Streak</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{data.stats.current_streak} hari</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Terpanjang {data.stats.longest_streak} hari
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Total fasting</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{Math.round(data.stats.total_hours)} jam</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {data.stats.total_fasts} fast · rata-rata {data.stats.average_hours.toFixed(1)} jam
          </CardContent>
        </Card>
        {data.insights.slice(0, 2).map((ins, i) => (
          <div key={i} className="rounded-2xl border border-orange-500/10 bg-orange-500/[0.04] p-4 text-sm">
            <p className="font-medium">{ins.title}</p>
            <p className="mt-1 text-muted-foreground">{ins.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
