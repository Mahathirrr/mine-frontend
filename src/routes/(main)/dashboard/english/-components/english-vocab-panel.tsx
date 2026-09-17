"use client";

import * as React from "react";

import { BookMarked, Plus, RotateCcw, Trash2 } from "lucide-react";

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

import { masteryColor, masteryLabels } from "./english-utils";

type Props = {
  data: EnglishOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

export function EnglishVocabPanel({ data, token, onRefresh }: Props) {
  const [filter, setFilter] = React.useState<string>("all");
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState({
    word: "",
    meaning: "",
    example_sentence: "",
    part_of_speech: "noun",
    exam_tag: "both",
    topic: "",
    mastery: "new",
  });

  const filtered = data.vocab.filter((v) => filter === "all" || v.mastery === filter);
  const masteryStats = data.vocab_mastery ?? {};

  async function submit() {
    if (!form.word.trim()) return;
    setSaving(true);
    try {
      await englishApi.createVocab(token, form);
      setOpen(false);
      setForm({
        word: "",
        meaning: "",
        example_sentence: "",
        part_of_speech: "noun",
        exam_tag: "both",
        topic: "",
        mastery: "new",
      });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Word bank</CardTitle>
              <CardDescription>Kosakata akademik untuk TOEFL & IELTS</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-36" size="sm">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {Object.entries(masteryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                Kata baru
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ItemGroup>
              {filtered.map((v) => (
                <Item key={v.id} variant="outline">
                  <ItemContent>
                    <ItemTitle className="flex flex-wrap items-center gap-2">
                      <BookMarked className="size-4 text-primary" />
                      {v.word}
                      <Badge className={masteryColor[v.mastery] ?? ""}>{masteryLabels[v.mastery] ?? v.mastery}</Badge>
                      {v.exam_tag !== "both" && <Badge variant="outline">{v.exam_tag.toUpperCase()}</Badge>}
                    </ItemTitle>
                    <ItemDescription>{v.meaning}</ItemDescription>
                    {v.example_sentence && (
                      <p className="mt-1 text-xs italic text-muted-foreground">&ldquo;{v.example_sentence}&rdquo;</p>
                    )}
                    {v.topic && <p className="mt-1 text-xs text-muted-foreground">Topik: {v.topic}</p>}
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Review (naikkan mastery)"
                      onClick={async () => {
                        await englishApi.reviewVocab(token, v.id);
                        await onRefresh();
                      }}
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(v.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </ItemActions>
                </Item>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Kosong. Tambah dari reading/listening atau import manual.
                </p>
              )}
            </ItemGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mastery breakdown</CardTitle>
            <CardDescription>Progress word bank</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(masteryLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span>{label}</span>
                <Badge variant="secondary">{masteryStats[key] ?? 0}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah kosakata</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Kata</Label>
              <Input value={form.word} onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Arti</Label>
              <Input value={form.meaning} onChange={(e) => setForm((f) => ({ ...f, meaning: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Contoh kalimat</Label>
              <Textarea
                value={form.example_sentence}
                onChange={(e) => setForm((f) => ({ ...f, example_sentence: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>POS</Label>
                <Select
                  value={form.part_of_speech}
                  onValueChange={(v) => setForm((f) => ({ ...f, part_of_speech: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["noun", "verb", "adjective", "adverb", "phrase"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tag ujian</Label>
                <Select value={form.exam_tag} onValueChange={(v) => setForm((f) => ({ ...f, exam_tag: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Keduanya</SelectItem>
                    <SelectItem value="toefl">TOEFL</SelectItem>
                    <SelectItem value="ielts">IELTS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Topik</Label>
              <Input
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                placeholder="environment, campus, health..."
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
            <AlertDialogTitle>Hapus kata?</AlertDialogTitle>
            <AlertDialogDescription>Kata ini akan dihapus dari word bank.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId == null) return;
                await englishApi.deleteVocab(token, deleteId);
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
