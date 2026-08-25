"use client";

import * as React from "react";

import { cn } from "cn";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  BookOpen,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Kanban,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type AppStatus,
  type CreateApplicationBody,
  type CreateQuestionBody,
  type InterviewApplicationWithRounds,
  type InterviewOverviewResponse,
  type InterviewQuestion,
  interviewsApi,
  type WorkType,
} from "@/lib/api/interviews";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { ApplicationDetailSheet } from "./application-detail-sheet";
import { ImportPrepDialog } from "./import-prep-dialog";
import {
  APP_STATUS_LABEL,
  APP_STATUS_ORDER,
  APP_STATUS_TONE,
  QUESTION_CATEGORY_LABEL,
  ROUND_TYPE_LABEL,
  WORK_TYPE_LABEL,
} from "./interview-constants";
import { appRounds, formatDate, formatDateTime, formatRelativeSchedule, upcomingRounds } from "./interview-utils";
import { PipelineBoard } from "./pipeline-board";
import { PrepMaterialsPanel } from "./prep-materials-panel";

function normalizeOverview(data: InterviewOverviewResponse): InterviewOverviewResponse {
  return {
    ...data,
    prep_guides: data.prep_guides ?? [],
    applications: data.applications.map((app) => ({
      ...app,
      rounds: appRounds(app),
    })),
  };
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "amber" | "emerald" | "red" | "violet";
}) {
  const tones = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    red: "text-red-600 dark:text-red-400 bg-red-500/10",
    violet: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 text-left">
        <p className="font-bold text-2xl tabular-nums leading-none tracking-tight">{value}</p>
        <p className="mt-1 text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}

const EMPTY_APP: CreateApplicationBody = {
  company: "",
  role_title: "",
  status: "applied",
  work_type: "unknown",
  salary_currency: "IDR",
  priority: 2,
};

const EMPTY_QUESTION: CreateQuestionBody = {
  question: "",
  category: "behavioral",
  is_practiced: false,
};

export function InterviewTracker() {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [data, setData] = React.useState<InterviewOverviewResponse | null>(null);
  const [search, setSearch] = React.useState("");
  const [selectedApp, setSelectedApp] = React.useState<InterviewApplicationWithRounds | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [appDialogOpen, setAppDialogOpen] = React.useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = React.useState(false);
  const [appDraft, setAppDraft] = React.useState<CreateApplicationBody>(EMPTY_APP);
  const [questionDraft, setQuestionDraft] = React.useState<CreateQuestionBody>(EMPTY_QUESTION);
  const [prepImportOpen, setPrepImportOpen] = React.useState(false);
  const [selectedPrepAppId, setSelectedPrepAppId] = React.useState<number | null>(null);

  const reload = React.useCallback(async () => {
    if (!token) return;
    const next = normalizeOverview(await interviewsApi.overview(token));
    setData(next);
    if (selectedApp) {
      const updated = next.applications.find((a) => a.id === selectedApp.id) ?? null;
      setSelectedApp(updated);
    }
  }, [token, selectedApp]);

  React.useEffect(() => {
    if (!token) return;
    setLoading(true);
    void interviewsApi
      .overview(token)
      .then((res) => setData(normalizeOverview(res)))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredApps = React.useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.applications;
    return data.applications.filter(
      (a) =>
        a.company.toLowerCase().includes(q) ||
        a.role_title.toLowerCase().includes(q) ||
        (a.location?.toLowerCase().includes(q) ?? false),
    );
  }, [data, search]);

  const scheduleItems = React.useMemo(() => (data ? upcomingRounds(data.applications) : []), [data]);

  function openApp(app: InterviewApplicationWithRounds) {
    setSelectedApp(app);
    setSheetOpen(true);
  }

  async function withSave(task: () => Promise<void>) {
    if (!token) return;
    setSaving(true);
    try {
      await task();
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(appId: number, status: AppStatus) {
    if (!token || !data) return;
    const prev = data.applications;
    setData({
      ...data,
      applications: prev.map((a) => (a.id === appId ? { ...a, status } : a)),
    });
    setSaving(true);
    try {
      await interviewsApi.updateApplication(token, appId, { status });
      await reload();
    } catch {
      setData({ ...data, applications: prev });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateApp(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !appDraft.company.trim() || !appDraft.role_title.trim()) return;
    await withSave(async () => {
      await interviewsApi.createApplication(token, {
        ...appDraft,
        company: appDraft.company.trim(),
        role_title: appDraft.role_title.trim(),
        applied_at: appDraft.applied_at?.trim() ? appDraft.applied_at : null,
        job_url: appDraft.job_url?.trim() || null,
        location: appDraft.location?.trim() || null,
        notes: appDraft.notes?.trim() || null,
      });
      setAppDraft(EMPTY_APP);
      setAppDialogOpen(false);
    });
  }

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !questionDraft.question.trim()) return;
    await withSave(async () => {
      await interviewsApi.createQuestion(token, {
        ...questionDraft,
        question: questionDraft.question.trim(),
        answer_notes: questionDraft.answer_notes?.trim() || null,
      });
      setQuestionDraft(EMPTY_QUESTION);
      setQuestionDialogOpen(false);
    });
  }

  const prepGuides = data?.prep_guides ?? [];
  const prepAppIds = [...new Set(prepGuides.map((g) => g.application_id))];
  const appsWithPrep = (data?.applications ?? []).filter((a) => prepAppIds.includes(a.id));

  if (loading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  const { stats, questions } = data;
  const activePrepAppId = selectedPrepAppId ?? appsWithPrep[0]?.id ?? null;
  const prepApplication = appsWithPrep.find((a) => a.id === activePrepAppId) ?? null;
  const prepGuidesForApp = prepGuides.filter((g) => g.application_id === activePrepAppId);
  const customQuestions = questions.filter((q) => !q.source_guide);
  const practicedPct =
    customQuestions.length > 0
      ? Math.round((customQuestions.filter((q) => q.is_practiced).length / customQuestions.length) * 100)
      : 0;
  const defaultTab = appsWithPrep.length > 0 ? "prep" : "pipeline";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total lamaran" value={stats.total} icon={Briefcase} tone="blue" />
        <StatCard label="Aktif diproses" value={stats.active} icon={Sparkles} tone="violet" />
        <StatCard label="Jadwal 2 minggu" value={stats.upcoming} icon={CalendarClock} tone="amber" />
        <StatCard label="Offer diterima" value={stats.offers} icon={Trophy} tone="emerald" />
        <StatCard label="Ditolak" value={stats.rejected} icon={XCircle} tone="red" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari perusahaan atau role..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPrepImportOpen(true)}>
            <BookOpen />
            Impor materi
          </Button>
          <Button variant="outline" onClick={() => setQuestionDialogOpen(true)}>
            <ClipboardList />
            Tambah soal
          </Button>
          <Button onClick={() => setAppDialogOpen(true)}>
            <Plus />
            Lamaran baru
          </Button>
        </div>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full flex-wrap sm:w-fit">
          <TabsTrigger value="prep" className="gap-1.5">
            <BookOpen className="size-3.5" />
            Materi persiapan
            {appsWithPrep.length > 0 ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 tabular-nums">
                {appsWithPrep.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-1.5">
            <Kanban className="size-3.5" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5">
            <CalendarClock className="size-3.5" />
            Jadwal
            {stats.upcoming > 0 ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 tabular-nums">
                {stats.upcoming}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-1.5">
            <ClipboardList className="size-3.5" />
            Soal lain
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <Briefcase className="size-3.5" />
            Daftar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prep" className="mt-4">
          {prepApplication && prepGuidesForApp.length > 0 ? (
            <div className="space-y-4">
              {appsWithPrep.length > 1 ? (
                <div className="max-w-md">
                  <Label className="mb-1.5 block text-muted-foreground text-xs">Perusahaan</Label>
                  <Select value={String(activePrepAppId)} onValueChange={(v) => setSelectedPrepAppId(Number(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {appsWithPrep.map((app) => (
                        <SelectItem key={app.id} value={String(app.id)}>
                          {app.company} · {app.role_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <PrepMaterialsPanel
                application={prepApplication}
                guides={prepGuidesForApp}
                questions={questions}
                disabled={saving}
                onTogglePracticed={async (questionId, practiced) => {
                  if (!token) return;
                  await withSave(async () => {
                    await interviewsApi.updateQuestion(token, questionId, { is_practiced: practiced });
                  });
                }}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <BookOpen className="size-10 text-muted-foreground/60" />
                <div>
                  <p className="font-medium">Belum ada materi persiapan</p>
                  <p className="mt-1 max-w-sm text-muted-foreground text-sm">
                    Impor paket materi dari katalog. Tiap perusahaan punya modul persiapan sendiri.
                  </p>
                </div>
                <Button onClick={() => setPrepImportOpen(true)}>
                  <BookOpen />
                  Impor materi
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pipeline lamaran</CardTitle>
              <CardDescription>
                Tarik kartu antar kolom untuk ubah status. Klik kartu untuk detail dan tahap wawancara.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredApps.length === 0 ? (
                <EmptyState onAdd={() => setAppDialogOpen(true)} />
              ) : (
                <PipelineBoard applications={filteredApps} onOpen={openApp} onStatusChange={handleStatusChange} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Jadwal mendatang</CardTitle>
              <CardDescription>Wawancara terjadwal dalam 14 hari ke depan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheduleItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">Belum ada jadwal wawancara terdekat.</p>
              ) : (
                scheduleItems.map(({ round, company, roleTitle }) => (
                  <div
                    key={round.id}
                    className="flex flex-col gap-1 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{round.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {company} · {roleTitle} · {ROUND_TYPE_LABEL[round.round_type]}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium text-amber-700 text-sm dark:text-amber-400">
                        {formatRelativeSchedule(round.scheduled_at)}
                      </p>
                      <p className="text-muted-foreground text-xs">{formatDateTime(round.scheduled_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Soal tambahan</CardTitle>
                  <CardDescription>
                    Soal di luar materi perusahaan. {customQuestions.filter((q) => q.is_practiced).length}/
                    {customQuestions.length} sudah dipraktikkan ({practicedPct}%).
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setQuestionDialogOpen(true)}>
                  <Plus className="size-3.5" />
                  Tambah
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <QuestionBank
                questions={customQuestions}
                applications={data.applications}
                disabled={saving}
                onToggle={async (q, practiced) => {
                  if (!token) return;
                  await withSave(async () => {
                    await interviewsApi.updateQuestion(token, q.id, { is_practiced: practiced });
                  });
                }}
                onDelete={async (id) => {
                  if (!token) return;
                  await withSave(async () => {
                    await interviewsApi.deleteQuestion(token, id);
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Semua lamaran</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Perusahaan</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.id} className="cursor-pointer" onClick={() => openApp(app)}>
                      <TableCell className="font-medium">{app.company}</TableCell>
                      <TableCell>{app.role_title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={APP_STATUS_TONE[app.status]}>
                          {APP_STATUS_LABEL[app.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{WORK_TYPE_LABEL[app.work_type]}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(parseISO(app.updated_at), "d MMM yyyy", { locale: idLocale })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {saving ? (
        <div className="fixed right-4 bottom-4 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-lg">
          <Loader2 className="size-4 animate-spin" />
          Menyimpan...
        </div>
      ) : null}

      <ApplicationDetailSheet
        app={selectedApp}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        saving={saving}
        onUpdate={async (id, patch) => {
          if (!token) return;
          await withSave(async () => {
            await interviewsApi.updateApplication(token, id, patch);
          });
        }}
        onDelete={async (id) => {
          if (!token) return;
          await withSave(async () => {
            await interviewsApi.deleteApplication(token, id);
            setSelectedApp(null);
          });
        }}
        onCreateRound={async (applicationId, body) => {
          if (!token) return;
          await withSave(async () => {
            await interviewsApi.createRound(token, applicationId, body);
          });
        }}
        onUpdateRound={async (roundId, patch) => {
          if (!token) return;
          await withSave(async () => {
            await interviewsApi.updateRound(token, roundId, patch);
          });
        }}
        onDeleteRound={async (roundId) => {
          if (!token) return;
          await withSave(async () => {
            await interviewsApi.deleteRound(token, roundId);
          });
        }}
      />

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lamaran baru</DialogTitle>
            <DialogDescription>Catat perusahaan dan posisi yang kamu lamar atau rencanakan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleCreateApp(e)} className="space-y-4">
            <Field label="Perusahaan">
              <Input
                value={appDraft.company}
                onChange={(e) => setAppDraft((d) => ({ ...d, company: e.target.value }))}
                placeholder="Google, Tokopedia, ..."
                required
              />
            </Field>
            <Field label="Posisi / Role">
              <Input
                value={appDraft.role_title}
                onChange={(e) => setAppDraft((d) => ({ ...d, role_title: e.target.value }))}
                placeholder="Backend Engineer"
                required
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status">
                <Select
                  value={appDraft.status ?? "applied"}
                  onValueChange={(v) => setAppDraft((d) => ({ ...d, status: v as AppStatus }))}
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
              <Field label="Tipe kerja">
                <Select
                  value={appDraft.work_type ?? "unknown"}
                  onValueChange={(v) => setAppDraft((d) => ({ ...d, work_type: v as WorkType }))}
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
            </div>
            <Field label="Lokasi">
              <Input
                value={appDraft.location ?? ""}
                onChange={(e) => setAppDraft((d) => ({ ...d, location: e.target.value }))}
                placeholder="Jakarta, Remote"
              />
            </Field>
            <Field label="Link lowongan">
              <Input
                value={appDraft.job_url ?? ""}
                onChange={(e) => setAppDraft((d) => ({ ...d, job_url: e.target.value }))}
                placeholder="https://..."
                type="url"
              />
            </Field>
            <Field label="Tanggal melamar">
              <Input
                type="date"
                value={typeof appDraft.applied_at === "string" ? appDraft.applied_at : ""}
                onChange={(e) => setAppDraft((d) => ({ ...d, applied_at: e.target.value }))}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAppDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah soal</DialogTitle>
            <DialogDescription>Simpan pertanyaan wawancara untuk latihan atau referensi.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleCreateQuestion(e)} className="space-y-4">
            <Field label="Pertanyaan">
              <Textarea
                value={questionDraft.question}
                onChange={(e) => setQuestionDraft((d) => ({ ...d, question: e.target.value }))}
                rows={3}
                required
              />
            </Field>
            <Field label="Kategori">
              <Select
                value={questionDraft.category ?? "behavioral"}
                onValueChange={(v) =>
                  setQuestionDraft((d) => ({ ...d, category: v as CreateQuestionBody["category"] }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(QUESTION_CATEGORY_LABEL) as Array<keyof typeof QUESTION_CATEGORY_LABEL>).map((k) => (
                    <SelectItem key={k} value={k}>
                      {QUESTION_CATEGORY_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Catatan jawaban">
              <Textarea
                value={questionDraft.answer_notes ?? ""}
                onChange={(e) => setQuestionDraft((d) => ({ ...d, answer_notes: e.target.value }))}
                rows={4}
                placeholder="STAR method, poin penting..."
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setQuestionDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {token ? (
        <ImportPrepDialog open={prepImportOpen} onOpenChange={setPrepImportOpen} token={token} onImported={reload} />
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Briefcase className="size-10 text-muted-foreground/60" />
      <div>
        <p className="font-medium">Belum ada lamaran</p>
        <p className="text-muted-foreground text-sm">Mulai track lamaran kerja dan tahap wawancaramu.</p>
      </div>
      <Button onClick={onAdd}>
        <Plus />
        Tambah lamaran pertama
      </Button>
    </div>
  );
}

function QuestionBank({
  questions,
  applications,
  disabled,
  onToggle,
  onDelete,
}: {
  questions: InterviewQuestion[];
  applications: InterviewApplicationWithRounds[];
  disabled?: boolean;
  onToggle: (q: InterviewQuestion, practiced: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  if (questions.length === 0) {
    return <p className="text-muted-foreground text-sm">Belum ada soal. Tambahkan pertanyaan untuk latihan.</p>;
  }

  const appName = (id: number | null) => {
    if (!id) return null;
    const app = applications.find((a) => a.id === id);
    return app ? `${app.company}` : null;
  };

  return (
    <div className="space-y-2">
      {questions.map((q) => (
        <div key={q.id} className="rounded-xl border p-3">
          <div className="flex items-start gap-3">
            <Switch
              checked={q.is_practiced}
              onCheckedChange={(v) => void onToggle(q, v)}
              disabled={disabled}
              aria-label="Sudah dipraktikkan"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{QUESTION_CATEGORY_LABEL[q.category]}</Badge>
                {appName(q.application_id) ? (
                  <Badge variant="outline" className="text-[10px]">
                    {appName(q.application_id)}
                  </Badge>
                ) : null}
                {q.is_practiced ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 text-xs dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Sudah latihan
                  </span>
                ) : null}
              </div>
              <p className="mt-2 font-medium text-sm leading-snug">{q.question}</p>
              {q.answer_notes ? (
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground text-xs">{q.answer_notes}</p>
              ) : null}
              <p className="mt-2 text-[11px] text-muted-foreground">Diperbarui {formatDate(q.updated_at)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => void onDelete(q.id)}
              disabled={disabled}
              aria-label="Hapus soal"
            >
              <XCircle className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
