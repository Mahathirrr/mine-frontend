"use client";

import * as React from "react";

import { Plus, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EnglishOverview } from "@/lib/api/english";
import { englishApi } from "@/lib/api/english";

import { activityLabels, sectionLabel } from "./english-utils";

type Props = {
  data: EnglishOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

export function EnglishPracticePanel({ data, token, onRefresh }: Props) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState({
    practice_date: new Date().toISOString().slice(0, 10),
    exam_type: "both",
    section: "reading",
    activity_type: "timed_practice",
    duration_min: "45",
    materials: "",
    self_rating: "3",
    words_learned: "0",
    notes: "",
  });

  async function submit() {
    setSaving(true);
    try {
      await englishApi.createPractice(token, {
        practice_date: form.practice_date,
        exam_type: form.exam_type,
        section: form.section,
        activity_type: form.activity_type,
        duration_min: Number(form.duration_min) || 0,
        materials: form.materials,
        self_rating: Number(form.self_rating) || 0,
        words_learned: Number(form.words_learned) || 0,
        notes: form.notes,
      });
      setOpen(false);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Log latihan harian</CardTitle>
            <CardDescription>Timed practice, shadowing, speaking partner, review error log</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Log sesi
          </Button>
        </CardHeader>
        <CardContent>
          <ItemGroup>
            {data.practice_logs.map((log) => (
              <Item key={log.id} variant="outline">
                <ItemContent>
                  <ItemTitle className="flex flex-wrap items-center gap-2">
                    {sectionLabel[log.section] ?? log.section}
                    <Badge variant="outline">{activityLabels[log.activity_type] ?? log.activity_type}</Badge>
                  </ItemTitle>
                  <ItemDescription>
                    {log.practice_date.slice(0, 10)} · {log.duration_min} menit
                    {log.materials ? ` · ${log.materials}` : ""}
                  </ItemDescription>
                  {log.notes && <p className="mt-1 text-xs text-muted-foreground">{log.notes}</p>}
                </ItemContent>
                <ItemActions>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(log.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log sesi belajar</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={form.practice_date}
                  onChange={(e) => setForm((f) => ({ ...f, practice_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Durasi (menit)</Label>
                <Input
                  type="number"
                  value={form.duration_min}
                  onChange={(e) => setForm((f) => ({ ...f, duration_min: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={form.section} onValueChange={(v) => setForm((f) => ({ ...f, section: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sectionLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aktivitas</Label>
                <Select value={form.activity_type} onValueChange={(v) => setForm((f) => ({ ...f, activity_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(activityLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Materi / sumber</Label>
              <Input
                value={form.materials}
                onChange={(e) => setForm((f) => ({ ...f, materials: e.target.value }))}
                placeholder="Cambridge 18 Test 2, TED talk, dll."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Self rating (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.self_rating}
                  onChange={(e) => setForm((f) => ({ ...f, self_rating: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Kata baru</Label>
                <Input
                  type="number"
                  value={form.words_learned}
                  onChange={(e) => setForm((f) => ({ ...f, words_learned: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId != null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus log latihan?</AlertDialogTitle>
            <AlertDialogDescription>Sesi ini akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId == null) return;
                await englishApi.deletePractice(token, deleteId);
                setDeleteId(null);
                await onRefresh();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
