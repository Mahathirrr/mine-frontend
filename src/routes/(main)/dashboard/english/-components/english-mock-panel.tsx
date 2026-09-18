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
import type { EnglishMockTest, EnglishOverview } from "@/lib/api/english";
import { englishApi } from "@/lib/api/english";

import { formatIeltsBand, formatSectionScore, formatToeflScore, mockSectionRows, sectionLabel } from "./english-utils";

type Props = {
  data: EnglishOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

export function EnglishMockPanel({ data, token, onRefresh }: Props) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState({
    exam_type: "toefl" as "toefl" | "ielts",
    test_kind: "full",
    test_name: "",
    taken_at: new Date().toISOString().slice(0, 10),
    reading_score: "",
    listening_score: "",
    speaking_score: "",
    writing_score: "",
    duration_min: "120",
    source: "",
    notes: "",
  });

  async function submit() {
    setSaving(true);
    try {
      await englishApi.createMock(token, {
        exam_type: form.exam_type,
        test_kind: form.test_kind,
        test_name: form.test_name || `${form.exam_type.toUpperCase()} ${form.test_kind}`,
        taken_at: form.taken_at,
        reading_score: Number(form.reading_score) || 0,
        listening_score: Number(form.listening_score) || 0,
        speaking_score: Number(form.speaking_score) || 0,
        writing_score: Number(form.writing_score) || 0,
        duration_min: Number(form.duration_min) || 0,
        source: form.source,
        notes: form.notes,
      });
      setOpen(false);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    await englishApi.deleteMock(token, deleteId);
    setDeleteId(null);
    await onRefresh();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Mock test</CardTitle>
            <CardDescription>Full test atau section drill TOEFL iBT & IELTS</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Tambah mock
          </Button>
        </CardHeader>
        <CardContent>
          <ItemGroup>
            {data.mock_tests.map((mock) => (
              <MockRow key={mock.id} mock={mock} onDelete={() => setDeleteId(mock.id)} />
            ))}
            {data.mock_tests.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Belum ada mock. Mulai dengan ETS/BC/IDP atau simulasi sendiri.
              </p>
            )}
          </ItemGroup>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Catat mock test</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ujian</Label>
                <Select
                  value={form.exam_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, exam_type: v as "toefl" | "ielts" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toefl">TOEFL iBT</SelectItem>
                    <SelectItem value="ielts">IELTS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jenis</Label>
                <Select value={form.test_kind} onValueChange={(v) => setForm((f) => ({ ...f, test_kind: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full test</SelectItem>
                    <SelectItem value="section">Section only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama test</Label>
              <Input
                value={form.test_name}
                onChange={(e) => setForm((f) => ({ ...f, test_name: e.target.value }))}
                placeholder="ETS Practice Test 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={form.taken_at}
                  onChange={(e) => setForm((f) => ({ ...f, taken_at: e.target.value }))}
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
              {(["reading", "listening", "speaking", "writing"] as const).map((s) => (
                <div key={s} className="space-y-2">
                  <Label>{sectionLabel[s]}</Label>
                  <Input
                    type="number"
                    step={form.exam_type === "ielts" ? "0.5" : "1"}
                    value={form[`${s}_score` as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [`${s}_score`]: e.target.value }))}
                    placeholder={form.exam_type === "ielts" ? "0-9" : "0-30"}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Sumber</Label>
              <Input
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                placeholder="Official, Magoosh, dll."
              />
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
            <AlertDialogTitle>Hapus mock test?</AlertDialogTitle>
            <AlertDialogDescription>Data skor tidak bisa dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MockRow({ mock, onDelete }: { mock: EnglishMockTest; onDelete: () => void }) {
  const overall =
    mock.exam_type === "ielts" ? formatIeltsBand(mock.overall_score) : formatToeflScore(mock.overall_score);
  const sections = mockSectionRows(mock);

  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle className="flex flex-wrap items-center gap-2">
          {mock.test_name}
          <Badge variant="secondary">{mock.exam_type.toUpperCase()}</Badge>
          <Badge variant="outline">{mock.test_kind === "full" ? "Full" : "Section"}</Badge>
        </ItemTitle>
        <ItemDescription>
          {mock.taken_at.slice(0, 10)} · overall {overall}
          {mock.source ? ` · ${mock.source}` : ""}
        </ItemDescription>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {sections.map((s) => (
            <span key={s.section} className="rounded-md bg-muted px-2 py-0.5">
              {sectionLabel[s.section]} {formatSectionScore(mock.exam_type, s.score)}
            </span>
          ))}
        </div>
      </ItemContent>
      <ItemActions>
        <Button variant="ghost" size="icon-sm" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </ItemActions>
    </Item>
  );
}
