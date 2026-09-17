"use client";

import * as React from "react";

import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EnglishOverview } from "@/lib/api/english";
import { englishApi } from "@/lib/api/english";

type Props = {
  data: EnglishOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

const CEFR_LEVELS = ["A2", "B1", "B2", "C1", "C2"];

export function EnglishProfilePanel({ data, token, onRefresh }: Props) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    focus_exam: data.profile.focus_exam,
    toefl_target_total: String(data.profile.toefl_target_total),
    ielts_target_band: String(data.profile.ielts_target_band),
    toefl_exam_date: data.profile.toefl_exam_date?.slice(0, 10) ?? "",
    ielts_exam_date: data.profile.ielts_exam_date?.slice(0, 10) ?? "",
    weekly_hours_goal: String(data.profile.weekly_hours_goal),
    current_cefr: data.profile.current_cefr,
    notes: data.profile.notes,
  });

  React.useEffect(() => {
    setForm({
      focus_exam: data.profile.focus_exam,
      toefl_target_total: String(data.profile.toefl_target_total),
      ielts_target_band: String(data.profile.ielts_target_band),
      toefl_exam_date: data.profile.toefl_exam_date?.slice(0, 10) ?? "",
      ielts_exam_date: data.profile.ielts_exam_date?.slice(0, 10) ?? "",
      weekly_hours_goal: String(data.profile.weekly_hours_goal),
      current_cefr: data.profile.current_cefr,
      notes: data.profile.notes,
    });
  }, [data.profile]);

  async function save() {
    setSaving(true);
    try {
      await englishApi.updateProfile(token, {
        focus_exam: form.focus_exam as "toefl" | "ielts" | "both",
        toefl_target_total: Number(form.toefl_target_total) || 100,
        ielts_target_band: Number(form.ielts_target_band) || 6,
        toefl_exam_date: form.toefl_exam_date || null,
        ielts_exam_date: form.ielts_exam_date || null,
        weekly_hours_goal: Number(form.weekly_hours_goal) || 5,
        current_cefr: form.current_cefr,
        notes: form.notes,
      });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil & target</CardTitle>
        <CardDescription>Atur fokus ujian, target skor, tanggal test, dan jam belajar mingguan</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-2xl gap-4">
        <div className="space-y-2">
          <Label>Fokus utama</Label>
          <Select
            value={form.focus_exam}
            onValueChange={(v) => setForm((f) => ({ ...f, focus_exam: v as typeof form.focus_exam }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">TOEFL + IELTS</SelectItem>
              <SelectItem value="toefl">TOEFL iBT saja</SelectItem>
              <SelectItem value="ielts">IELTS saja</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Target TOEFL (0-120)</Label>
            <Input
              type="number"
              value={form.toefl_target_total}
              onChange={(e) => setForm((f) => ({ ...f, toefl_target_total: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Target IELTS band</Label>
            <Input
              type="number"
              step="0.5"
              value={form.ielts_target_band}
              onChange={(e) => setForm((f) => ({ ...f, ielts_target_band: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Tanggal TOEFL</Label>
            <Input
              type="date"
              value={form.toefl_exam_date}
              onChange={(e) => setForm((f) => ({ ...f, toefl_exam_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Tanggal IELTS</Label>
            <Input
              type="date"
              value={form.ielts_exam_date}
              onChange={(e) => setForm((f) => ({ ...f, ielts_exam_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Jam belajar / minggu</Label>
            <Input
              type="number"
              value={form.weekly_hours_goal}
              onChange={(e) => setForm((f) => ({ ...f, weekly_hours_goal: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Level CEFR saat ini</Label>
            <Select value={form.current_cefr} onValueChange={(v) => setForm((f) => ({ ...f, current_cefr: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CEFR_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Catatan strategi</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={4}
            placeholder="Misal: speaking 3x/minggu dengan partner, writing feedback dari tutor..."
          />
        </div>
        <Button onClick={save} disabled={saving} className="w-fit">
          <Save className="size-4" />
          {saving ? "Menyimpan..." : "Simpan profil"}
        </Button>
      </CardContent>
    </Card>
  );
}
