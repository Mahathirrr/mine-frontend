"use client";

import * as React from "react";

import { cn } from "cn";
import { Check, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FastingOverview } from "@/lib/api/fasting";
import { fastingApi } from "@/lib/api/fasting";

type Props = {
  data: FastingOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

export function FastingProfilePanel({ data, token, onRefresh }: Props) {
  const [profileSaving, setProfileSaving] = React.useState(false);
  const [savingSlug, setSavingSlug] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState(data.profile.protocol_slug);
  const [form, setForm] = React.useState({
    start_weight_kg: String(data.profile.start_weight_kg || ""),
    target_weight_kg: String(data.profile.target_weight_kg || ""),
    height_cm: String(data.profile.height_cm || ""),
    weekly_goal_days: String(data.profile.weekly_goal_days),
    notes: data.profile.notes,
  });

  React.useEffect(() => {
    setSelected(data.profile.protocol_slug);
    setForm({
      start_weight_kg: String(data.profile.start_weight_kg || ""),
      target_weight_kg: String(data.profile.target_weight_kg || ""),
      height_cm: String(data.profile.height_cm || ""),
      weekly_goal_days: String(data.profile.weekly_goal_days),
      notes: data.profile.notes,
    });
  }, [data.profile]);

  async function pickProtocol(slug: string, goal: number, eating: number) {
    if (slug === selected && !savingSlug) return;

    const previous = selected;
    setSelected(slug);
    setSavingSlug(slug);

    try {
      await fastingApi.updateProfile(token, {
        protocol_slug: slug,
        goal_hours: goal,
        eating_window_hours: eating,
      });
      await onRefresh();
    } catch {
      setSelected(previous);
    } finally {
      setSavingSlug(null);
    }
  }

  async function saveProfile() {
    setProfileSaving(true);
    try {
      await fastingApi.updateProfile(token, {
        start_weight_kg: Number(form.start_weight_kg) || 0,
        target_weight_kg: Number(form.target_weight_kg) || 0,
        height_cm: Number(form.height_cm) || 0,
        weekly_goal_days: Number(form.weekly_goal_days) || 5,
        notes: form.notes,
      });
      await onRefresh();
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pilih protocol</CardTitle>
          <CardDescription>Tap untuk ganti goal fasting default</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {data.protocols.map((p) => {
              const isSelected = selected === p.slug;
              const isSaving = savingSlug === p.slug;

              return (
                <button
                  key={p.slug}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => pickProtocol(p.slug, p.goal_hours, p.eating_hours)}
                  className={cn(
                    "rounded-xl border bg-card px-3.5 py-3 text-left",
                    isSelected
                      ? "border-orange-500/50 bg-orange-500/[0.04] ring-1 ring-orange-500/30"
                      : "border-border/80",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-muted-foreground text-sm leading-snug">{p.label}</p>
                    {isSaving ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                    ) : isSelected ? (
                      <Check className="size-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
                    ) : null}
                  </div>
                  <p className="mt-1.5 font-semibold text-2xl text-foreground tabular-nums leading-none">
                    {Math.round(p.goal_hours)}
                    <span className="ms-1 font-normal text-muted-foreground text-sm">jam</span>
                  </p>
                  <p className="mt-1.5 text-muted-foreground text-sm">eating window {p.eating_hours} jam</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profil & BB awal</CardTitle>
          <CardDescription>Berat sebelum program dan target akhir</CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-2xl gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>BB awal (kg)</Label>
              <Input
                value={form.start_weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, start_weight_kg: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>BB target (kg)</Label>
              <Input
                value={form.target_weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, target_weight_kg: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tinggi (cm)</Label>
              <Input value={form.height_cm} onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Goal hari/minggu</Label>
              <Input
                type="number"
                value={form.weekly_goal_days}
                onChange={(e) => setForm((f) => ({ ...f, weekly_goal_days: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Catatan strategi</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>
          <Button onClick={saveProfile} disabled={profileSaving} className="w-fit rounded-full">
            {profileSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {profileSaving ? "Menyimpan..." : "Simpan profil"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
