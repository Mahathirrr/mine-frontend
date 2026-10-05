"use client";

import * as React from "react";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FastingOverview, FastingProtocol } from "@/lib/api/fasting";
import { fastingApi } from "@/lib/api/fasting";

type Props = {
  data: FastingOverview;
  token: string;
  onRefresh: () => Promise<void>;
  compact?: boolean;
};

export function FastingGoalPresets({ data, token, onRefresh, compact }: Props) {
  const [saving, setSaving] = React.useState(false);
  const [customOpen, setCustomOpen] = React.useState<"hours" | "days" | "end" | null>(null);
  const [customHours, setCustomHours] = React.useState("16");
  const [customDays, setCustomDays] = React.useState("3");
  const [customEnd, setCustomEnd] = React.useState("");

  const active = data.active_session;
  const selected = active?.protocol_slug ?? data.profile.protocol_slug;

  const standard = data.protocols.filter((p) => (p.category ?? "standard") === "standard");
  const longer = data.protocols.filter((p) => p.category === "longer");

  async function applyGoal(slug: string, goalHours: number, eatingHours: number) {
    setSaving(true);
    try {
      await fastingApi.updateProfile(token, {
        protocol_slug: slug,
        goal_hours: goalHours,
        eating_window_hours: eatingHours,
      });
      if (active) {
        await fastingApi.updateSession(token, active.id, {
          goal_hours: goalHours,
          protocol_slug: slug,
        });
      }
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function applyCustomHours(hours: number) {
    const h = Math.min(720, Math.max(1, hours));
    const eating = Math.max(0, 24 - (h % 24 || 24));
    await applyGoal("custom", h, h >= 24 ? 0 : eating);
    setCustomOpen(null);
  }

  async function applyEndTime(isoEnd: string) {
    const end = new Date(isoEnd);
    const start = active ? new Date(active.started_at) : new Date();
    const hours = Math.max(1, (end.getTime() - start.getTime()) / 3600000);
    await applyGoal("custom-end", hours, 0);
    setCustomOpen(null);
  }

  return (
    <div className={cn("space-y-6", compact && "space-y-5")}>
      {!compact && (
        <div>
          <h3 className="font-semibold text-base">Change fast goal</h3>
          <p className="mt-1 text-muted-foreground text-sm">
            Goal aktif: {Math.round(active?.goal_hours ?? data.profile.goal_hours)} jam
            {active ? " · bisa diubah saat timer jalan" : ""}
          </p>
        </div>
      )}

      <GoalSection title="Standard goals">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {standard.map((p) => (
            <GoalCard
              key={p.slug}
              preset={p}
              selected={selected === p.slug}
              disabled={saving}
              onSelect={() => applyGoal(p.slug, p.goal_hours, p.eating_hours)}
            />
          ))}
        </div>
      </GoalSection>

      <GoalSection title="Custom goals">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <CustomTile
            title="Pick hours"
            subtitle="1–720 jam"
            disabled={saving}
            onClick={() => {
              setCustomHours(String(Math.round(active?.goal_hours ?? data.profile.goal_hours)));
              setCustomOpen("hours");
            }}
          />
          <CustomTile title="Pick days" subtitle="1+ hari" disabled={saving} onClick={() => setCustomOpen("days")} />
          <CustomTile
            title="End time"
            subtitle="Fast sampai tanggal"
            disabled={saving}
            onClick={() => {
              const d = new Date();
              d.setHours(d.getHours() + 16);
              setCustomEnd(d.toISOString().slice(0, 16));
              setCustomOpen("end");
            }}
          />
        </div>
      </GoalSection>

      {longer.length > 0 && (
        <GoalSection title="Longer fasts">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {longer.map((p) => (
              <GoalCard
                key={p.slug}
                preset={p}
                selected={selected === p.slug}
                disabled={saving}
                onSelect={() => applyGoal(p.slug, p.goal_hours, p.eating_hours)}
              />
            ))}
          </div>
        </GoalSection>
      )}

      <Dialog open={customOpen === "hours"} onOpenChange={(o) => !o && setCustomOpen(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pick hours</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Jam puasa (1–720)</Label>
            <Input
              type="number"
              min={1}
              max={720}
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
            />
            <Button className="w-full" disabled={saving} onClick={() => applyCustomHours(Number(customHours))}>
              Terapkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={customOpen === "days"} onOpenChange={(o) => !o && setCustomOpen(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pick days</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Hari (1+)</Label>
            <Input type="number" min={1} max={30} value={customDays} onChange={(e) => setCustomDays(e.target.value)} />
            <Button className="w-full" disabled={saving} onClick={() => applyCustomHours(Number(customDays) * 24)}>
              Terapkan ({Number(customDays) * 24} jam)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={customOpen === "end"} onOpenChange={(o) => !o && setCustomOpen(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>End time</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Fast sampai</Label>
            <Input type="datetime-local" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            <Button
              className="w-full"
              disabled={saving}
              onClick={() => applyEndTime(new Date(customEnd).toISOString())}
            >
              Terapkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 font-medium text-muted-foreground text-sm">{title}</p>
      {children}
    </div>
  );
}

function GoalCard({
  preset,
  selected,
  disabled,
  onSelect,
}: {
  preset: FastingProtocol;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "rounded-xl border bg-card px-3.5 py-3 text-left",
        selected ? "border-orange-500/50 bg-orange-500/[0.04] ring-1 ring-orange-500/30" : "border-border/80",
      )}
    >
      <p className="text-muted-foreground text-sm leading-snug">{preset.label}</p>
      <p className="mt-1.5 font-semibold text-2xl text-foreground tabular-nums leading-none">
        {Math.round(preset.goal_hours)}
        <span className="ms-1 font-normal text-muted-foreground text-sm">jam</span>
      </p>
    </button>
  );
}

function CustomTile({
  title,
  subtitle,
  disabled,
  onClick,
}: {
  title: string;
  subtitle: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl border border-border/80 bg-card px-3.5 py-3 text-left"
    >
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="mt-1 text-muted-foreground text-sm">{subtitle}</p>
    </button>
  );
}
