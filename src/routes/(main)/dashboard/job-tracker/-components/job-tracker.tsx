"use client";

import * as React from "react";

import { cn } from "cn";
import { format, parseISO } from "date-fns";
import {
  BarChart3,
  Building2,
  Clock,
  Kanban,
  Link2,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Rss,
  Search,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type JobApplicationWithRounds,
  type JobCompany,
  type JobStatus,
  type JobTrackerOverview,
  jobTrackerApi,
} from "@/lib/api/job-tracker";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { CompanyDetailSheet } from "./company-detail-sheet";
import { JobApplicationDetail } from "./job-application-detail";
import { JobPipelineBoard } from "./job-pipeline-board";
import {
  CONTACT_SOURCE_LABEL,
  INGESTION_PLATFORMS,
  type IngestionPlatform,
  JOB_STATUS_LABEL,
  PLATFORM_DEFAULT_URL,
  PLATFORM_LABEL,
} from "./job-tracker-constants";
import { ThreadsImportDialog } from "./threads-import-dialog";

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", tone)}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="font-semibold text-2xl tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function JobTracker() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = React.useState<JobTrackerOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<JobApplicationWithRounds | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const [addOpen, setAddOpen] = React.useState(false);
  const [urlPaste, setUrlPaste] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [form, setForm] = React.useState({
    company_name: "",
    role_title: "",
    job_url: "",
    location: "",
    status: "saved" as JobStatus,
    source_platform: "manual",
  });

  const [sourceOpen, setSourceOpen] = React.useState(false);
  const [sourceForm, setSourceForm] = React.useState({
    name: "",
    platform: "linkedin" as IngestionPlatform,
    source_url: PLATFORM_DEFAULT_URL.linkedin ?? "",
    poll_interval_hours: 3,
    keywords: "software engineer",
    location: "Indonesia",
    country_code: "ID",
    site_key: "ID-Main",
    company_name: "",
    max_pages: 2,
  });
  const [runningSource, setRunningSource] = React.useState<number | null>(null);

  const [companyOpen, setCompanyOpen] = React.useState(false);
  const [companyForm, setCompanyForm] = React.useState({ name: "", website: "", industry: "" });

  const [contactOpen, setContactOpen] = React.useState(false);
  const [contactForm, setContactForm] = React.useState({ name: "", email: "", role_title: "", channel: "linkedin" });
  const [linkedinOpen, setLinkedinOpen] = React.useState(false);
  const [linkedinUrl, setLinkedinUrl] = React.useState("");
  const [savingLinkedin, setSavingLinkedin] = React.useState(false);

  const [selectedCompany, setSelectedCompany] = React.useState<JobCompany | null>(null);
  const [companyDetailOpen, setCompanyDetailOpen] = React.useState(false);
  const [enrichingCompany, setEnrichingCompany] = React.useState(false);
  const [runningAllFeeds, setRunningAllFeeds] = React.useState(false);

  const [threadOpen, setThreadOpen] = React.useState(false);
  const [threadsImportOpen, setThreadsImportOpen] = React.useState(false);
  const [threadForm, setThreadForm] = React.useState({ subject: "", channel: "email", body: "" });
  const [activeThread, setActiveThread] = React.useState<number | null>(null);
  const [replyBody, setReplyBody] = React.useState("");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const overview = await jobTrackerApi.overview(token);
      setData(overview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleStatusChange(appId: number, status: JobStatus) {
    if (!token) return;
    await jobTrackerApi.updateApplication(token, appId, { status });
    await load();
  }

  async function handleParseURL() {
    if (!token || !urlPaste.trim()) return;
    setParsing(true);
    try {
      const job = await jobTrackerApi.parseURL(token, urlPaste.trim());
      setForm({
        company_name: job.company_name || "",
        role_title: job.title || "",
        job_url: job.job_url || urlPaste.trim(),
        location: job.location || "",
        status: "saved",
        source_platform: job.platform || "manual",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal parse URL");
    } finally {
      setParsing(false);
    }
  }

  async function handleCreateApp() {
    if (!token) return;
    await jobTrackerApi.createApplication(token, {
      company_name: form.company_name,
      role_title: form.role_title,
      job_url: form.job_url || null,
      location: form.location || null,
      status: form.status,
      source_platform: form.source_platform as JobApplicationWithRounds["source_platform"],
    });
    setAddOpen(false);
    setForm({
      company_name: "",
      role_title: "",
      job_url: "",
      location: "",
      status: "saved",
      source_platform: "manual",
    });
    setUrlPaste("");
    await load();
  }

  async function handleCreateSource() {
    if (!token) return;
    const { keywords, location, country_code, site_key, company_name, max_pages, ...base } = sourceForm;
    const config: Record<string, string | number> = {};
    if (
      [
        "linkedin",
        "glints",
        "jobstreet",
        "kalibrr",
        "dealls",
        "loker",
        "indeed",
        "magenta_magang",
        "magenta_kerja",
      ].includes(base.platform)
    ) {
      if (keywords) config.keywords = keywords;
      if (location) config.location = location;
      if (country_code) config.country_code = country_code;
      if (site_key) config.site_key = site_key;
      if (max_pages) config.max_pages = max_pages;
    }
    if (["greenhouse", "lever", "workable", "ashby"].includes(base.platform) && company_name) {
      config.company_name = company_name;
    }
    await jobTrackerApi.createSource(token, { ...base, config });
    setSourceOpen(false);
    setSourceForm({
      name: "",
      platform: "linkedin",
      source_url: PLATFORM_DEFAULT_URL.linkedin ?? "",
      poll_interval_hours: 3,
      keywords: "software engineer",
      location: "Indonesia",
      country_code: "ID",
      site_key: "ID-Main",
      company_name: "",
      max_pages: 2,
    });
    await load();
  }

  async function handleRunSource(id: number) {
    if (!token) return;
    setRunningSource(id);
    try {
      await jobTrackerApi.runSource(token, id);
      await load();
    } finally {
      setRunningSource(null);
    }
  }

  async function handleRunAllFeeds() {
    if (!token || !data?.sources.length) return;
    setRunningAllFeeds(true);
    try {
      for (const src of data.sources) {
        if (src.enabled) await jobTrackerApi.runSource(token, src.id);
      }
      await load();
    } finally {
      setRunningAllFeeds(false);
    }
  }

  async function handleEnrichCompany() {
    if (!token || !selectedCompany) return;
    setEnrichingCompany(true);
    try {
      const updated = await jobTrackerApi.enrichCompany(token, selectedCompany.id);
      setSelectedCompany(updated);
      await load();
    } finally {
      setEnrichingCompany(false);
    }
  }

  async function handleSaveLinkedInContact() {
    if (!token || !linkedinUrl.trim()) return;
    setSavingLinkedin(true);
    try {
      await jobTrackerApi.saveLinkedInContact(token, linkedinUrl.trim());
      setLinkedinOpen(false);
      setLinkedinUrl("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal simpan profil LinkedIn");
    } finally {
      setSavingLinkedin(false);
    }
  }

  async function handleImportItem(id: number) {
    if (!token) return;
    await jobTrackerApi.ingestionItemAction(token, id, "import");
    await load();
  }

  async function handleDismissItem(id: number) {
    if (!token) return;
    await jobTrackerApi.ingestionItemAction(token, id, "dismiss");
    await load();
  }

  async function handleCreateCompany() {
    if (!token) return;
    await jobTrackerApi.createCompany(token, {
      name: companyForm.name,
      website: companyForm.website || null,
      industry: companyForm.industry || null,
    });
    setCompanyOpen(false);
    setCompanyForm({ name: "", website: "", industry: "" });
    await load();
  }

  async function handleCreateContact() {
    if (!token) return;
    await jobTrackerApi.createContact(token, {
      name: contactForm.name,
      email: contactForm.email || null,
      role_title: contactForm.role_title || null,
      channel: contactForm.channel,
    });
    setContactOpen(false);
    setContactForm({ name: "", email: "", role_title: "", channel: "linkedin" });
    await load();
  }

  async function handleCreateThread() {
    if (!token) return;
    const thread = await jobTrackerApi.createThread(token, {
      subject: threadForm.subject,
      channel: threadForm.channel,
    });
    if (threadForm.body.trim()) {
      await jobTrackerApi.createThreadMessage(token, thread.id, {
        body: threadForm.body.trim(),
        direction: "outbound",
      });
    }
    setThreadOpen(false);
    setThreadForm({ subject: "", channel: "email", body: "" });
    await load();
  }

  async function handleReplyThread() {
    if (!token || !activeThread || !replyBody.trim()) return;
    await jobTrackerApi.createThreadMessage(token, activeThread, { body: replyBody.trim(), direction: "outbound" });
    setReplyBody("");
    await load();
  }

  const funnelData = React.useMemo(() => {
    if (!data) return [];
    return ["saved", "applied", "screening", "interview", "offer"].map((s) => ({
      stage: JOB_STATUS_LABEL[s as JobStatus] ?? s,
      count: data.stats.by_status[s as JobStatus] ?? 0,
    }));
  }, [data]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button className="mt-4" onClick={load}>
            Coba lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 size-4" /> Tambah lamaran
          </Button>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          </Button>
        </div>
        {stats?.pending_feed ? (
          <Badge variant="secondary" className="gap-1">
            <Rss className="size-3" /> {stats.pending_feed} lowongan baru dari feed
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total lamaran" value={stats?.total ?? 0} icon={Kanban} tone="bg-blue-500/10 text-blue-600" />
        <StatCard label="Aktif" value={stats?.active ?? 0} icon={Zap} tone="bg-violet-500/10 text-violet-600" />
        <StatCard label="Offer" value={stats?.offers ?? 0} icon={Trophy} tone="bg-emerald-500/10 text-emerald-600" />
        <StatCard
          label="Interview mendatang"
          value={stats?.upcoming ?? 0}
          icon={Clock}
          tone="bg-amber-500/10 text-amber-600"
        />
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="feed">Auto Feed</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <JobPipelineBoard
            applications={data?.applications ?? []}
            onOpen={(app) => {
              setSelected(app);
              setDetailOpen(true);
            }}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="feed" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Sumber otomatis (poll tiap 3 jam)</CardTitle>
                <CardDescription>
                  Remotive, We Work Remotely, Jobicy, Arbeitnow — sudah di-seed & worker backend poll berkala.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={handleRunAllFeeds} disabled={runningAllFeeds}>
                  {runningAllFeeds ? <Loader2 className="size-4 animate-spin" /> : <Rss className="mr-1 size-4" />}
                  Sync semua feed
                </Button>
                <Button size="sm" onClick={() => setSourceOpen(true)}>
                  <Plus className="mr-1 size-4" /> Tambah sumber
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.sources ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Belum ada sumber. Tambahkan RSS job alert LinkedIn, URL pencarian Glints/JobStreet, atau halaman karir
                  perusahaan.
                </p>
              ) : (
                (data?.sources ?? []).map((src) => (
                  <div key={src.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{src.name}</p>
                      <p className="truncate text-muted-foreground text-xs">{src.source_url}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline">{PLATFORM_LABEL[src.platform] ?? src.platform}</Badge>
                        <Badge variant="secondary">Setiap {src.poll_interval_hours}j</Badge>
                        {src.last_success_at ? (
                          <span className="text-[10px] text-muted-foreground">
                            OK: {format(parseISO(src.last_success_at), "dd MMM HH:mm")}
                          </span>
                        ) : null}
                        {src.last_error ? <span className="text-[10px] text-destructive">{src.last_error}</span> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={src.enabled}
                        onCheckedChange={async (v) => {
                          if (!token) return;
                          await jobTrackerApi.updateSource(token, src.id, { enabled: v });
                          await load();
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunSource(src.id)}
                        disabled={runningSource === src.id}
                      >
                        {runningSource === src.id ? <Loader2 className="size-4 animate-spin" /> : "Run now"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inbox lowongan baru</CardTitle>
              <CardDescription>Review sebelum import ke pipeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data?.ingestion_items ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">Tidak ada item pending.</p>
              ) : (
                (data?.ingestion_items ?? []).map((item) => (
                  <div key={item.id} className="flex flex-wrap items-start gap-3 rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.company_name ?? "—"} · {PLATFORM_LABEL[item.platform] ?? item.platform}
                      </p>
                      {item.company_website ? (
                        <a
                          href={item.company_website}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-primary text-xs hover:underline"
                        >
                          Website perusahaan
                        </a>
                      ) : null}
                      {(item.description_full ?? item.description_snippet) ? (
                        <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
                          {item.description_full ?? item.description_snippet}
                        </p>
                      ) : null}
                      <a
                        href={item.job_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-primary text-xs"
                      >
                        <Link2 className="size-3" /> Buka posting
                      </a>
                      {(item.contacts?.length ?? 0) > 0 ? (
                        <ul className="mt-2 space-y-1 border-t pt-2">
                          {item.contacts?.slice(0, 5).map((c) => (
                            <li key={`${c.email ?? ""}|${c.linkedin_url ?? ""}|${c.name}`} className="text-xs">
                              <span className="font-medium">{c.name}</span>
                              {c.role_title ? <span className="text-muted-foreground"> · {c.role_title}</span> : null}
                              <div className="flex flex-wrap gap-2">
                                {c.email ? (
                                  <a href={`mailto:${c.email}`} className="text-primary hover:underline">
                                    {c.email}
                                  </a>
                                ) : null}
                                {c.linkedin_url ? (
                                  <a
                                    href={c.linkedin_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    LinkedIn
                                  </a>
                                ) : null}
                                {c.phone ? <span className="text-muted-foreground">{c.phone}</span> : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleImportItem(item.id)}>
                        Import
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDismissItem(item.id)}>
                        Abaikan
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setCompanyOpen(true)}>
              <Building2 className="mr-1 size-4" /> Tambah perusahaan
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.companies ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCompany(c);
                  setCompanyDetailOpen(true);
                }}
                className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/20"
              >
                <div className="flex items-start gap-3">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt="" className="size-10 rounded-lg border bg-white object-contain p-0.5" />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary text-xs">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-muted-foreground text-xs">{c.industry ?? "—"}</p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {[c.city, c.country].filter(Boolean).join(", ") || c.hq_location || "—"}
                    </p>
                  </div>
                </div>
                {c.latitude != null && c.longitude != null ? (
                  <Badge variant="outline" className="mt-3 gap-1 text-[10px]">
                    <MapPin className="size-3" /> Peta tersedia
                  </Badge>
                ) : null}
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <div className="mb-3 flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setLinkedinOpen(true)}>
              <Link2 className="mr-1 size-4" /> Simpan dari LinkedIn
            </Button>
            <Button size="sm" onClick={() => setContactOpen(true)}>
              <Users className="mr-1 size-4" /> Tambah manual
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(data?.contacts ?? []).map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-muted-foreground text-xs">{c.role_title ?? "—"}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.is_hiring_contact ? <Badge variant="secondary">Hiring</Badge> : null}
                      <Badge variant="outline">{CONTACT_SOURCE_LABEL[c.source] ?? c.source}</Badge>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-xs">
                    {c.email ? <p>{c.email}</p> : null}
                    {c.linkedin_url ? (
                      <a
                        href={c.linkedin_url}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        LinkedIn profile
                      </a>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="threads" className="mt-4">
          <div className="mb-3 flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setThreadsImportOpen(true)}>
              <Sparkles className="mr-1 size-4" /> Import Threads
            </Button>
            <Button size="sm" onClick={() => setThreadOpen(true)}>
              <MessageSquare className="mr-1 size-4" /> Thread manual
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              {(data?.threads ?? []).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveThread(t.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent/50",
                    activeThread === t.id && "border-primary bg-accent/30",
                  )}
                >
                  <p className="font-medium text-sm">{t.subject}</p>
                  <p className="text-muted-foreground text-xs">
                    {t.channel === "threads" ? "Meta Threads" : t.channel} · {(t.messages ?? []).length} pesan
                  </p>
                </button>
              ))}
            </div>
            <div className="rounded-lg border p-4">
              {activeThread ? (
                <>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {(data?.threads ?? [])
                      .find((t) => t.id === activeThread)
                      ?.messages?.map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm",
                            m.direction === "outbound" ? "ml-8 bg-primary/10" : "mr-8 bg-muted",
                          )}
                        >
                          <p>{m.body}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {format(parseISO(m.sent_at), "dd MMM HH:mm")}
                          </p>
                        </div>
                      ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Textarea
                      rows={2}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Balas..."
                    />
                    <Button onClick={handleReplyThread}>Kirim</Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Pilih thread untuk melihat percakapan</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="size-4" /> Funnel lamaran
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {(data?.reminders ?? []).length > 0 ? (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Reminder aktif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data?.reminders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="font-medium text-sm">{r.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {format(parseISO(r.remind_at), "dd MMM yyyy HH:mm")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!token) return;
                        await jobTrackerApi.updateReminder(token, r.id, { is_done: true });
                        await load();
                      }}
                    >
                      Selesai
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>

      <JobApplicationDetail
        app={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        token={token ?? ""}
        onUpdated={load}
        onDelete={async (id) => {
          if (!token) return;
          await jobTrackerApi.deleteApplication(token, id);
          await load();
        }}
      />

      <CompanyDetailSheet
        company={selectedCompany}
        open={companyDetailOpen}
        onOpenChange={setCompanyDetailOpen}
        onEnrich={handleEnrichCompany}
        enriching={enrichingCompany}
      />

      <Dialog open={linkedinOpen} onOpenChange={setLinkedinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simpan kontak dari LinkedIn</DialogTitle>
            <DialogDescription>Tempel URL profil recruiter / hiring manager (linkedin.com/in/...)</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="https://www.linkedin.com/in/..."
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={handleSaveLinkedInContact} disabled={savingLinkedin || !linkedinUrl.trim()}>
              {savingLinkedin ? <Loader2 className="size-4 animate-spin" /> : "Simpan kontak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah lamaran</DialogTitle>
            <DialogDescription>Tempel URL job posting untuk auto-fill metadata</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="https://linkedin.com/jobs/..."
                value={urlPaste}
                onChange={(e) => setUrlPaste(e.target.value)}
              />
              <Button variant="secondary" onClick={handleParseURL} disabled={parsing}>
                {parsing ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              </Button>
            </div>
            <div className="grid gap-2">
              <Label>Perusahaan</Label>
              <Input
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Posisi</Label>
              <Input value={form.role_title} onChange={(e) => setForm((f) => ({ ...f, role_title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Lokasi</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Status awal</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as JobStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saved">Saved</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateApp} disabled={!form.company_name || !form.role_title}>
              <Sparkles className="mr-1 size-4" /> Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sourceOpen} onOpenChange={setSourceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah sumber auto-feed</DialogTitle>
            <DialogDescription>Worker mengecek setiap 3 jam (default)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>Nama</Label>
              <Input
                value={sourceForm.name}
                onChange={(e) => setSourceForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="LinkedIn Backend Jobs RSS"
              />
            </div>
            <div className="grid gap-2">
              <Label>Platform</Label>
              <Select
                value={sourceForm.platform}
                onValueChange={(v) => {
                  const platform = v as IngestionPlatform;
                  setSourceForm((f) => ({
                    ...f,
                    platform,
                    source_url: PLATFORM_DEFAULT_URL[platform] ?? f.source_url,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INGESTION_PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {INGESTION_PLATFORMS.find((p) => p.value === sourceForm.platform)?.hint}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>URL</Label>
              <Input
                value={sourceForm.source_url}
                onChange={(e) => setSourceForm((f) => ({ ...f, source_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            {[
              "linkedin",
              "glints",
              "jobstreet",
              "kalibrr",
              "dealls",
              "loker",
              "indeed",
              "magenta_magang",
              "magenta_kerja",
            ].includes(sourceForm.platform) ? (
              <div className="grid gap-3 rounded-lg border p-3">
                <div className="grid gap-2">
                  <Label>Keywords</Label>
                  <Input
                    value={sourceForm.keywords}
                    onChange={(e) => setSourceForm((f) => ({ ...f, keywords: e.target.value }))}
                    placeholder="backend engineer"
                  />
                </div>
                {sourceForm.platform === "linkedin" || sourceForm.platform === "jobstreet" ? (
                  <div className="grid gap-2">
                    <Label>Lokasi</Label>
                    <Input
                      value={sourceForm.location}
                      onChange={(e) => setSourceForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="Indonesia / Jakarta"
                    />
                  </div>
                ) : null}
                {sourceForm.platform === "glints" ? (
                  <div className="grid gap-2">
                    <Label>Country code</Label>
                    <Input
                      value={sourceForm.country_code}
                      onChange={(e) => setSourceForm((f) => ({ ...f, country_code: e.target.value }))}
                      placeholder="ID"
                    />
                  </div>
                ) : null}
                {sourceForm.platform === "jobstreet" ? (
                  <div className="grid gap-2">
                    <Label>Site key</Label>
                    <Input
                      value={sourceForm.site_key}
                      onChange={(e) => setSourceForm((f) => ({ ...f, site_key: e.target.value }))}
                      placeholder="ID-Main"
                    />
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <Label>Max halaman</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={sourceForm.max_pages}
                    onChange={(e) => setSourceForm((f) => ({ ...f, max_pages: Number(e.target.value) || 2 }))}
                  />
                </div>
              </div>
            ) : null}
            {["greenhouse", "lever", "workable", "ashby"].includes(sourceForm.platform) ? (
              <div className="grid gap-2">
                <Label>Nama perusahaan (opsional)</Label>
                <Input
                  value={sourceForm.company_name}
                  onChange={(e) => setSourceForm((f) => ({ ...f, company_name: e.target.value }))}
                  placeholder="Contoh: Stripe"
                />
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label>Interval (jam)</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={sourceForm.poll_interval_hours}
                onChange={(e) => setSourceForm((f) => ({ ...f, poll_interval_hours: Number(e.target.value) || 3 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateSource} disabled={!sourceForm.name || !sourceForm.source_url}>
              Simpan sumber
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={companyOpen} onOpenChange={setCompanyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah perusahaan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nama"
              value={companyForm.name}
              onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Website"
              value={companyForm.website}
              onChange={(e) => setCompanyForm((f) => ({ ...f, website: e.target.value }))}
            />
            <Input
              placeholder="Industri"
              value={companyForm.industry}
              onChange={(e) => setCompanyForm((f) => ({ ...f, industry: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateCompany} disabled={!companyForm.name}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah kontak</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nama"
              value={contactForm.name}
              onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Email"
              value={contactForm.email}
              onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              placeholder="Role"
              value={contactForm.role_title}
              onChange={(e) => setContactForm((f) => ({ ...f, role_title: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateContact} disabled={!contactForm.name}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={threadOpen} onOpenChange={setThreadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thread komunikasi baru</DialogTitle>
            <DialogDescription>Email, LinkedIn, WhatsApp — log manual v1</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Subject"
              value={threadForm.subject}
              onChange={(e) => setThreadForm((f) => ({ ...f, subject: e.target.value }))}
            />
            <Select value={threadForm.channel} onValueChange={(v) => setThreadForm((f) => ({ ...f, channel: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Pesan pertama (opsional)"
              value={threadForm.body}
              onChange={(e) => setThreadForm((f) => ({ ...f, body: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateThread} disabled={!threadForm.subject}>
              Buat thread
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {token ? (
        <ThreadsImportDialog
          open={threadsImportOpen}
          onOpenChange={setThreadsImportOpen}
          token={token}
          onImported={() => void load()}
        />
      ) : null}
    </div>
  );
}
