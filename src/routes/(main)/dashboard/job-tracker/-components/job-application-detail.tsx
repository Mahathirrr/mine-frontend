"use client";

import * as React from "react";

import { format, parseISO } from "date-fns";
import { ExternalLink, Loader2, Trash2, UserSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type JobApplicationWithRounds,
  type JobStatus,
  jobApplicationRounds,
  jobTrackerApi,
} from "@/lib/api/job-tracker";

import { JOB_STATUS_LABEL, JOB_STATUS_ORDER, PLATFORM_LABEL } from "./job-tracker-constants";

type Props = {
  app: JobApplicationWithRounds | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onUpdated: () => void;
  onDelete: (id: number) => void;
};

export function JobApplicationDetail({ app, open, onOpenChange, token, onUpdated, onDelete }: Props) {
  const [saving, setSaving] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [roundTitle, setRoundTitle] = React.useState("");
  const [roundDate, setRoundDate] = React.useState("");
  const [discovering, setDiscovering] = React.useState(false);
  const [discovered, setDiscovered] = React.useState(0);

  if (!app) return null;

  async function saveField(body: Partial<JobApplicationWithRounds>) {
    setSaving(true);
    try {
      await jobTrackerApi.updateApplication(token, app?.id, body);
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await jobTrackerApi.createEvent(token, app?.id, { title: "Note", body: note.trim(), event_type: "note" });
      setNote("");
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  async function addRound() {
    if (!roundTitle.trim()) return;
    setSaving(true);
    try {
      await jobTrackerApi.createRound(token, app?.id, {
        title: roundTitle.trim(),
        scheduled_at: roundDate ? new Date(roundDate).toISOString() : null,
        round_type: "other",
      });
      setRoundTitle("");
      setRoundDate("");
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{app.role_title}</SheetTitle>
          <SheetDescription>{app.company_name}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">{PLATFORM_LABEL[app.source_platform] ?? app.source_platform}</Badge>
          <Badge>{JOB_STATUS_LABEL[app.status as JobStatus] ?? app.status}</Badge>
          {app.job_url ? (
            <a
              href={app.job_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
            >
              Job posting <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="details">Detail</TabsTrigger>
            <TabsTrigger value="rounds">Interview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            {app.job_url ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={discovering}
                onClick={async () => {
                  setDiscovering(true);
                  try {
                    const list = await jobTrackerApi.discoverContacts(token, app.id);
                    setDiscovered(list.length);
                    onUpdated();
                  } finally {
                    setDiscovering(false);
                  }
                }}
              >
                {discovering ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <UserSearch className="mr-1 size-4" />
                )}
                Cari kontak dari lowongan
              </Button>
            ) : null}
            {discovered > 0 ? (
              <p className="text-emerald-600 text-xs dark:text-emerald-400">{discovered} kontak ditemukan & disimpan</p>
            ) : null}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={app.status} onValueChange={(v) => saveField({ status: v as JobStatus })} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {JOB_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {app.job_description ? (
              <div className="space-y-2">
                <Label>Deskripsi lowongan</Label>
                <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
                  {app.job_description}
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                defaultValue={app.notes ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== (app.notes ?? "")) void saveField({ notes: e.target.value || null });
                }}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Excitement (1-5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                defaultValue={app.excitement_score ?? ""}
                onBlur={(e) => {
                  const n = e.target.value ? Number(e.target.value) : null;
                  void saveField({ excitement_score: n });
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="rounds" className="space-y-4 pt-4">
            {jobApplicationRounds(app).map((r) => (
              <div key={r.id} className="rounded-lg border p-3">
                <p className="font-medium text-sm">{r.title}</p>
                {r.scheduled_at ? (
                  <p className="text-muted-foreground text-xs">
                    {format(parseISO(r.scheduled_at), "dd MMM yyyy, HH:mm")}
                  </p>
                ) : null}
                {r.meeting_url ? (
                  <a
                    href={r.meeting_url}
                    className="text-primary text-xs hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Meeting link
                  </a>
                ) : null}
              </div>
            ))}
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <Label>Tambah interview round</Label>
              <Input
                placeholder="HR Screen, Technical, dll."
                value={roundTitle}
                onChange={(e) => setRoundTitle(e.target.value)}
              />
              <Input type="datetime-local" value={roundDate} onChange={(e) => setRoundDate(e.target.value)} />
              <Button size="sm" onClick={addRound} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Tambah"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3 pt-4">
            {(app.events ?? []).map((ev) => (
              <div key={ev.id} className="rounded-lg border px-3 py-2">
                <p className="font-medium text-sm">{ev.title}</p>
                {ev.body ? <p className="text-muted-foreground text-xs">{ev.body}</p> : null}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {format(parseISO(ev.occurred_at), "dd MMM yyyy HH:mm")}
                </p>
              </div>
            ))}
            <div className="space-y-2">
              <Textarea
                placeholder="Tambah catatan..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
              <Button size="sm" variant="secondary" onClick={addNote} disabled={saving}>
                Simpan catatan
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 border-t pt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete(app.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="mr-1 size-4" /> Hapus lamaran
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
