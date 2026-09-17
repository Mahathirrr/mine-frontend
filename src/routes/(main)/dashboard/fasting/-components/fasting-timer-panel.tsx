"use client";

import * as React from "react";

import { format } from "date-fns";
import { Flame, Pause, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-orange-500/10 via-background to-background shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="size-5 text-orange-500" />
            {data.timer.is_fasting ? "Sedang fasting" : "Siap mulai fast?"}
          </CardTitle>
          <CardDescription>
            Protocol {protocol?.label ?? data.profile.protocol_slug} · goal {data.profile.goal_hours} jam
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pb-8">
          <FastingTimerRing
            progress={progress}
            label={formatDuration(elapsed)}
            sublabel={`Progress ${Math.round(progress * 100)}%`}
            accent="#f97316"
          />
          {data.zone?.zone && (
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm">
              {zoneIcons[data.zone.zone.icon] ?? "⏱"} {data.zone.zone.label}
            </Badge>
          )}
          <div className="grid w-full max-w-md grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border bg-card/80 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Started</p>
              <p className="mt-1 font-medium">{active ? formatDateTime(active.started_at) : "Belum mulai"}</p>
            </div>
            <div className="rounded-2xl border bg-card/80 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Goal</p>
              <p className="mt-1 font-medium">
                {goalEnd ? format(goalEnd, "EEE d, h:mm a") : `${data.profile.goal_hours}h target`}
              </p>
            </div>
          </div>
          {data.timer.is_fasting ? (
            <Button size="lg" className="rounded-full px-8" onClick={endFast} disabled={busy}>
              <Pause className="size-4" />
              End Fast
            </Button>
          ) : (
            <Button size="lg" className="rounded-full px-8" onClick={startFast} disabled={busy}>
              <Play className="size-4" />
              Start Fast
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Streak</CardDescription>
            <CardTitle className="text-3xl">{data.stats.current_streak} hari</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Terpanjang {data.stats.longest_streak} hari
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total fasting</CardDescription>
            <CardTitle className="text-3xl">{Math.round(data.stats.total_hours)} jam</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {data.stats.total_fasts} fast · rata-rata {data.stats.average_hours.toFixed(1)} jam
          </CardContent>
        </Card>
        {data.insights.slice(0, 2).map((ins, i) => (
          <div key={i} className="rounded-2xl border bg-muted/30 p-4 text-sm">
            <p className="font-medium">{ins.title}</p>
            <p className="mt-1 text-muted-foreground">{ins.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
