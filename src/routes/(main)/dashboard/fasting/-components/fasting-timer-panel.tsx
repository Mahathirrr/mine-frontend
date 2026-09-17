"use client";

import * as React from "react";

import { format } from "date-fns";
import { Flame, Pause, Pencil, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FastingOverview } from "@/lib/api/fasting";
import { fastingApi } from "@/lib/api/fasting";

import { FastingEndFastDialog } from "./fasting-end-fast-dialog";
import { FastingGoalPresets } from "./fasting-goal-presets";
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
  const [endOpen, setEndOpen] = React.useState(false);
  const [editStartOpen, setEditStartOpen] = React.useState(false);
  const [editGoalOpen, setEditGoalOpen] = React.useState(false);
  const [startInput, setStartInput] = React.useState("");

  React.useEffect(() => {
    if (!data.timer.is_fasting) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [data.timer.is_fasting]);

  const active = data.active_session;
  const goalHours = active?.goal_hours ?? data.profile.goal_hours;
  const elapsed = active ? sessionDurationHours(active, now) : 0;
  const progress = goalHours > 0 ? Math.min(1, elapsed / goalHours) : 0;
  const goalEnd = active ? new Date(new Date(active.started_at).getTime() + goalHours * 3600000) : null;

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

  async function saveEndFast(startedIso: string, endedIso: string) {
    if (!active) return;
    setBusy(true);
    try {
      await fastingApi.updateSession(token, active.id, { started_at: startedIso });
      await fastingApi.endSession(token, active.id, { ended_at: endedIso });
      setEndOpen(false);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteEndFast() {
    if (!active) return;
    setBusy(true);
    try {
      await fastingApi.deleteSession(token, active.id);
      setEndOpen(false);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveStartEdit() {
    if (!active || !startInput) return;
    setBusy(true);
    try {
      await fastingApi.updateSession(token, active.id, {
        started_at: new Date(startInput).toISOString(),
      });
      setEditStartOpen(false);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  const protocol = data.protocols.find((p) => p.slug === (active?.protocol_slug ?? data.profile.protocol_slug));
  const zone = data.zone?.zone;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-visible rounded-3xl border-0 bg-gradient-to-br from-orange-50 via-background to-background shadow-none dark:from-orange-950/20 [&_[data-slot=card-content]]:overflow-visible">
          <CardHeader className="pb-0 text-center sm:text-left">
            <CardTitle className="flex items-center justify-center gap-2 sm:justify-start">
              <Flame className="size-5 text-orange-500" />
              {data.timer.is_fasting ? "Sedang fasting" : "Siap mulai fast?"}
            </CardTitle>
            <CardDescription>
              {protocol?.label ?? data.profile.protocol_slug} · target {Math.round(goalHours)} jam puasa
            </CardDescription>
          </CardHeader>
          <CardContent className="flex w-full flex-col items-center gap-8 overflow-visible px-4 pt-4 pb-14 sm:px-8">
            <div className="flex w-full justify-center overflow-visible py-2">
              <FastingTimerRing
                progress={progress}
                elapsedHours={elapsed}
                goalHours={goalHours}
                label={formatDuration(elapsed)}
                sublabel={`Elapsed time ${Math.round(progress * 100)}%`}
                zoneLabel={zone?.label}
                zoneIcon={zone ? (zoneIcons[zone.icon] ?? "⏱") : undefined}
                allZones={data.zone?.all_zones}
              />
            </div>

            <div className="grid w-full max-w-md grid-cols-2 gap-3">
              <EditableTile
                label="Started"
                value={active ? formatDateTime(active.started_at) : "Belum mulai"}
                canEdit={Boolean(active)}
                onEdit={() => {
                  if (!active) return;
                  const d = new Date(active.started_at);
                  const pad = (n: number) => String(n).padStart(2, "0");
                  setStartInput(
                    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
                  );
                  setEditStartOpen(true);
                }}
              />
              <EditableTile
                label="Goal"
                value={goalEnd ? format(goalEnd, "EEE d, h:mm a") : `${Math.round(goalHours)}h target`}
                canEdit={Boolean(active)}
                onEdit={() => setEditGoalOpen(true)}
              />
            </div>

            {data.timer.is_fasting ? (
              <Button
                size="lg"
                className="h-12 rounded-full bg-foreground px-10 text-background shadow-lg hover:bg-foreground/90"
                onClick={() => setEndOpen(true)}
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
          {data.insights.slice(0, 2).map((ins) => (
            <div key={ins.title} className="rounded-2xl border border-orange-500/10 bg-orange-500/[0.04] p-4 text-sm">
              <p className="font-medium">{ins.title}</p>
              <p className="mt-1 text-muted-foreground">{ins.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {active && (
        <FastingEndFastDialog
          open={endOpen}
          onOpenChange={setEndOpen}
          session={active}
          elapsedHours={elapsed}
          zone={zone ?? null}
          busy={busy}
          onSave={saveEndFast}
          onDelete={deleteEndFast}
        />
      )}

      <Dialog open={editStartOpen} onOpenChange={setEditStartOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit waktu mulai</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Started fasting</Label>
            <Input type="datetime-local" value={startInput} onChange={(e) => setStartInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStartOpen(false)}>
              Batal
            </Button>
            <Button disabled={busy} onClick={saveStartEdit}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editGoalOpen} onOpenChange={setEditGoalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change fast goal</DialogTitle>
          </DialogHeader>
          <FastingGoalPresets
            data={data}
            token={token}
            onRefresh={async () => {
              await onRefresh();
              setEditGoalOpen(false);
            }}
            compact
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditableTile({
  label,
  value,
  canEdit,
  onEdit,
}: {
  label: string;
  value: string;
  canEdit: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-orange-500/10 bg-card/90 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">{label}</p>
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 text-orange-600"
            onClick={onEdit}
            aria-label={`Edit ${label}`}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>
      <p className="mt-2 font-medium text-sm leading-snug">{value}</p>
    </div>
  );
}
