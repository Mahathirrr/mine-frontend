"use client";

import * as React from "react";

import { Link } from "@tanstack/react-router";

import { cn } from "cn";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Sparkles,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomeOverview } from "@/lib/api/home";
import { homeApi } from "@/lib/api/home";
import type { AppPath } from "@/navigation/sidebar/sidebar-items";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { formatModuleMetrics, HOME_MODULE_DEFS } from "./home-module-defs";

function greetingForHour(h: number): string {
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

function alertTone(severity: string) {
  if (severity === "warning") return "border-amber-500/40 bg-amber-500/5";
  if (severity === "success") return "border-emerald-500/40 bg-emerald-500/5";
  return "border-sky-500/40 bg-sky-500/5";
}

export function MineCommandCenter() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const enabled = useAuthStore((s) => s.preferences?.enabled_menu_items ?? []);

  const [data, setData] = React.useState<HomeOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await homeApi.overview(token);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat ringkasan");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const enabledSet = new Set(enabled);
  const modules = HOME_MODULE_DEFS.filter((m) => enabledSet.has(m.menuId));

  const greeting = greetingForHour(new Date().getHours());
  const firstName = user?.name?.split(/\s+/)[0] ?? "there";

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-6 md:gap-8">
      <section className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-primary/10 via-card to-card p-6 shadow-xs md:p-8">
        <div className="pointer-events-none absolute -top-16 right-0 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <LayoutDashboard className="size-4" />
              Command Center
            </div>
            <h1 className="text-3xl tracking-tight md:text-4xl">
              {greeting}, {firstName}.
            </h1>
            <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
              Satu layar untuk memantau LeetCode, lamaran, keuangan, belajar, dan modul Mine lainnya — lalu loncat
              langsung ke detail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Refresh
            </Button>
            <Button size="sm" render={<Link to="/dashboard/settings" />}>
              Atur modul
            </Button>
          </div>
        </div>
        {data?.generated_at ? (
          <p className="relative mt-4 text-muted-foreground text-xs">
            Diperbarui {new Date(data.generated_at).toLocaleString("id-ID")}
          </p>
        ) : null}
      </section>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Bell}
              label="Perlu perhatian"
              value={String(data.summary.attention)}
              hint={data.summary.attention === 0 ? "Semua tenang" : "Lihat alert di bawah"}
            />
            <SummaryCard
              icon={CheckSquare}
              label="Task terbuka"
              value={String(data.summary.tasks_open)}
              hint="Di kanban (non-done)"
            />
            <SummaryCard
              icon={CalendarDays}
              label="Event 7 hari"
              value={String(data.summary.events_week)}
              hint="Kalender + sync task"
            />
            <SummaryCard
              icon={Workflow}
              label="Pipeline aktif"
              value={String(data.summary.active_pipelines)}
              hint="Wawancara + job tracker"
            />
          </div>

          {data.alerts.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4 text-amber-600" />
                  Alert & tindakan
                </CardTitle>
                <CardDescription>Prioritas singkat berdasarkan data live dari akunmu</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.alerts.map((a) => (
                  <Link
                    key={a.id}
                    to={a.href as AppPath}
                    className={cn(
                      "group flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/40",
                      alertTone(a.severity),
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-snug">{a.title}</p>
                      <ArrowRight className="size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{a.body}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex items-center gap-3 pt-6 text-muted-foreground text-sm">
                <Sparkles className="size-4 text-primary" />
                Tidak ada alert kritis — lanjutkan momentum hari ini.
              </CardContent>
            </Card>
          )}

          <div>
            <div className="mb-4 flex items-end justify-between gap-2">
              <div>
                <h2 className="font-semibold text-lg tracking-tight">Modul Mine</h2>
                <p className="text-muted-foreground text-sm">{modules.length} modul aktif · klik kartu untuk masuk</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((mod) => {
                const metrics = formatModuleMetrics(mod.apiKey, data.modules[mod.apiKey]);
                const Icon = mod.icon;
                const hot =
                  mod.apiKey === "job_tracker" && num(data.modules.job_tracker?.pending_feed) > 0
                    ? `${num(data.modules.job_tracker?.pending_feed)} inbox`
                    : mod.apiKey === "kanban" && num(data.modules.kanban?.due_soon) > 0
                      ? `${num(data.modules.kanban?.due_soon)} due`
                      : null;

                return (
                  <Link
                    key={mod.menuId}
                    to={mod.url}
                    className={cn(
                      "group relative flex flex-col rounded-xl border bg-linear-to-br p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md",
                      mod.accent,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl border bg-background/80 shadow-sm">
                        <Icon className="size-5" />
                      </div>
                      {hot ? (
                        <Badge variant="secondary" className="shrink-0">
                          {hot}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="font-semibold leading-none">{mod.title}</p>
                      <p className="text-muted-foreground text-xs">{mod.description}</p>
                    </div>
                    <ul className="mt-3 space-y-0.5 text-sm">
                      {metrics.map((line) => (
                        <li key={line} className="text-muted-foreground leading-snug">
                          {line}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-4 inline-flex items-center gap-1 font-medium text-primary text-xs opacity-0 transition-opacity group-hover:opacity-100">
                      Buka modul <ArrowRight className="size-3" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg border bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </span>
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-semibold text-3xl tabular-nums tracking-tight">{value}</p>
        <p className="mt-1 text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}
