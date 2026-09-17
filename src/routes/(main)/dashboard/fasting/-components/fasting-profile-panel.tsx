"use client";

import * as React from "react";

import { cn } from "cn";
import { Save } from "lucide-react";

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
  const [saving, setSaving] = React.useState(false);
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
    setSelected(slug);
    setSaving(true);
    try {
      await fastingApi.updateProfile(token, {
        protocol_slug: slug,
        goal_hours: goal,
        eating_window_hours: eating,
      });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
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
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pilih protocol</CardTitle>
          <CardDescription>Tap untuk ganti goal fasting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.protocols.map((p) => (
              <button
                key={p.slug}
                type="button"
                disabled={saving}
                onClick={() => pickProtocol(p.slug, p.goal_hours, p.eating_hours)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all hover:shadow-md",
                  selected === p.slug && "ring-2 ring-orange-500/50",
                )}
                style={{ backgroundColor: `${p.color}18`, borderColor: `${p.color}40` }}
              >
                <p className="font-medium text-sm">{p.label}</p>
                <p className="mt-2 font-bold text-3xl tabular-nums" style={{ color: p.color }}>
                  {p.goal_hours}
                </p>
                <p className="text-muted-foreground text-xs">jam puasa · eating {p.eating_hours}h</p>
              </button>
            ))}
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
          <Button onClick={saveProfile} disabled={saving} className="w-fit rounded-full">
            <Save className="size-4" />
            {saving ? "Menyimpan..." : "Simpan profil"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
