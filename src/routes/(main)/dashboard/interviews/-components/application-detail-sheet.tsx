"use client";

import * as React from "react";

import { ExternalLink, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type {
  AppStatus,
  CreateRoundBody,
  InterviewApplicationWithRounds,
  InterviewRound,
  WorkType,
} from "@/lib/api/interviews";

import {
  APP_STATUS_LABEL,
  APP_STATUS_ORDER,
  PRIORITY_LABEL,
  ROUND_OUTCOME_LABEL,
  ROUND_TYPE_LABEL,
  WORK_TYPE_LABEL,
} from "./interview-constants";
import {
  appRounds,
  formatDate,
  formatDateTime,
  formatSalary,
  fromLocalDatetimeInput,
  toLocalDatetimeInput,
} from "./interview-utils";

type ApplicationDetailSheetProps = {
  app: InterviewApplicationWithRounds | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: number, patch: Record<string, unknown>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onCreateRound: (applicationId: number, body: CreateRoundBody) => Promise<void>;
  onUpdateRound: (roundId: number, patch: Record<string, unknown>) => Promise<void>;
  onDeleteRound: (roundId: number) => Promise<void>;
  saving?: boolean;
};

const EMPTY_ROUND: CreateRoundBody = {
  title: "",
  round_type: "technical",
  status: "scheduled",
  outcome: "pending",
};

export function ApplicationDetailSheet({
  app,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onCreateRound,
  onUpdateRound,
  onDeleteRound,
  saving,
}: ApplicationDetailSheetProps) {
  const [notes, setNotes] = React.useState("");
  const [showRoundForm, setShowRoundForm] = React.useState(false);
  const [roundDraft, setRoundDraft] = React.useState<CreateRoundBody>(EMPTY_ROUND);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (app) {
      setNotes(app.notes ?? "");
      setShowRoundForm(false);
      setRoundDraft(EMPTY_ROUND);
      setConfirmDelete(false);
    }
  }, [app]);

  if (!app) return null;

  const rounds = appRounds(app);
  const salary = formatSalary(app);

  async function saveNotes() {
    const trimmed = notes.trim();
    if (trimmed === (app?.notes?.trim() ?? "")) return;
    await onUpdate(app!.id, { notes: trimmed || null });
  }

  async function handleAddRound(e: React.FormEvent) {
    e.preventDefault();
    if (!roundDraft.title.trim()) return;
    await onCreateRound(app!.id, {
      ...roundDraft,
      title: roundDraft.title.trim(),
      scheduled_at: fromLocalDatetimeInput(roundDraft.scheduled_at ?? ""),
    });
    setRoundDraft(EMPTY_ROUND);
    setShowRoundForm(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-4 text-left">
          <SheetTitle className="text-xl">{app.company}</SheetTitle>
          <SheetDescription>{app.role_title}</SheetDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{APP_STATUS_LABEL[app.status]}</Badge>
            {app.work_type !== "unknown" ? <Badge variant="secondary">{WORK_TYPE_LABEL[app.work_type]}</Badge> : null}
            {salary ? <Badge variant="secondary">{salary}</Badge> : null}
          </div>
        </SheetHeader>

        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-3">
            <h3 className="font-medium text-sm">Detail lamaran</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status">
                <Select
                  value={app.status}
                  onValueChange={(v) => void onUpdate(app.id, { status: v as AppStatus })}
                  disabled={saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {APP_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Prioritas">
                <Select
                  value={String(app.priority)}
                  onValueChange={(v) => void onUpdate(app.id, { priority: Number(v) })}
                  disabled={saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map((p) => (
                      <SelectItem key={p} value={String(p)}>
                        {PRIORITY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Tipe kerja">
                <Select
                  value={app.work_type}
                  onValueChange={(v) => void onUpdate(app.id, { work_type: v as WorkType })}
                  disabled={saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(WORK_TYPE_LABEL) as WorkType[]).map((w) => (
                      <SelectItem key={w} value={w}>
                        {WORK_TYPE_LABEL[w]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Lokasi">
                <Input
                  defaultValue={app.location ?? ""}
                  placeholder="Jakarta, Remote, dll."
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (app.location ?? "")) void onUpdate(app.id, { location: v || null });
                  }}
                  disabled={saving}
                />
              </Field>
            </div>

            {app.job_url ? (
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                nativeButton={false}
                render={<a href={app.job_url} target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink className="size-3.5" />
                Buka lowongan
              </Button>
            ) : null}

            {app.applied_at ? (
              <p className="text-muted-foreground text-xs">Melamar: {formatDate(app.applied_at)}</p>
            ) : null}
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-sm">Tahap wawancara</h3>
              <Button variant="outline" size="sm" onClick={() => setShowRoundForm((v) => !v)} disabled={saving}>
                <Plus className="size-3.5" />
                Tambah tahap
              </Button>
            </div>

            {showRoundForm ? (
              <form onSubmit={(e) => void handleAddRound(e)} className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <Field label="Judul tahap">
                  <Input
                    value={roundDraft.title}
                    onChange={(e) => setRoundDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Technical Interview #1"
                    required
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Tipe">
                    <Select
                      value={roundDraft.round_type ?? "technical"}
                      onValueChange={(v) => setRoundDraft((d) => ({ ...d, round_type: v as CreateRoundBody["round_type"] }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROUND_TYPE_LABEL) as Array<keyof typeof ROUND_TYPE_LABEL>).map((k) => (
                          <SelectItem key={k} value={k}>
                            {ROUND_TYPE_LABEL[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Jadwal">
                    <Input
                      type="datetime-local"
                      value={toLocalDatetimeInput(roundDraft.scheduled_at ?? null)}
                      onChange={(e) => setRoundDraft((d) => ({ ...d, scheduled_at: e.target.value }))}
                    />
                  </Field>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={saving}>
                    Simpan tahap
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowRoundForm(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            ) : null}

            <div className="space-y-2">
              {rounds.length === 0 ? (
                <p className="text-muted-foreground text-sm">Belum ada tahap wawancara.</p>
              ) : (
                rounds.map((round) => (
                  <RoundRow
                    key={round.id}
                    round={round}
                    disabled={saving}
                    onUpdate={(patch) => onUpdateRound(round.id, patch)}
                    onDelete={() => onDeleteRound(round.id)}
                  />
                ))
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <Label htmlFor="app-notes">Catatan</Label>
            <Textarea
              id="app-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => void saveNotes()}
              placeholder="Persiapan, kontak HR, hal penting..."
              rows={4}
              disabled={saving}
            />
          </section>

          <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            {!confirmDelete ? (
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} disabled={saving}>
                <Trash2 className="size-3.5" />
                Hapus lamaran
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm">Yakin hapus lamaran ini? Semua tahap ikut terhapus.</p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void onDelete(app.id).then(() => onOpenChange(false))}
                    disabled={saving}
                  >
                    Ya, hapus
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {children}
    </div>
  );
}

function RoundRow({
  round,
  disabled,
  onUpdate,
  onDelete,
}: {
  round: InterviewRound;
  disabled?: boolean;
  onUpdate: (patch: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const schedule = formatDateTime(round.scheduled_at);

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm">{round.title}</p>
          <p className="text-muted-foreground text-xs">
            {ROUND_TYPE_LABEL[round.round_type]}
            {schedule ? ` · ${schedule}` : ""}
          </p>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={() => void onDelete()} disabled={disabled} aria-label="Hapus tahap">
          <Trash2 className="size-3.5 text-muted-foreground" />
        </Button>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Select
          value={round.status}
          onValueChange={(v) => void onUpdate({ status: v })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Terjadwal</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={round.outcome}
          onValueChange={(v) => void onUpdate({ outcome: v })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ROUND_OUTCOME_LABEL) as Array<keyof typeof ROUND_OUTCOME_LABEL>).map((k) => (
              <SelectItem key={k} value={k}>
                {ROUND_OUTCOME_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {round.meeting_url ? (
        <a
          href={round.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-primary text-xs hover:underline"
        >
          <ExternalLink className="size-3" />
          Link meeting
        </a>
      ) : null}
    </div>
  );
}
