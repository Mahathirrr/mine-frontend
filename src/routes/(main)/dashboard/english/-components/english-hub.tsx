"use client";

import * as React from "react";

import { BookA, ClipboardList, GraduationCap, LayoutDashboard, Settings2, Sparkles } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EnglishOverview } from "@/lib/api/english";
import { englishApi } from "@/lib/api/english";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { EnglishMockPanel } from "./english-mock-panel";
import { EnglishOverviewPanel } from "./english-overview";
import { EnglishPracticePanel } from "./english-practice-panel";
import { EnglishProfilePanel } from "./english-profile-panel";
import { EnglishVocabPanel } from "./english-vocab-panel";

export function EnglishHub() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = React.useState<EnglishOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("overview");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const overview = await englishApi.overview(token);
      setData(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data English tracker");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Gagal memuat English tracker</p>
        <p className="mt-1 text-muted-foreground">{error ?? "Data tidak tersedia"}</p>
      </div>
    );
  }

  const focusLabel =
    data.profile.focus_exam === "both"
      ? "TOEFL iBT + IELTS"
      : data.profile.focus_exam === "toefl"
        ? "TOEFL iBT"
        : "IELTS";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <Sparkles className="size-4 text-primary" />
        <span>
          Fokus: <strong>{focusLabel}</strong> · Streak {data.profile.study_streak} hari · Kesiapan TOEFL{" "}
          {data.stats.readiness_toefl}% / IELTS {data.stats.readiness_ielts}%
        </span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="mocks" className="gap-1.5">
            <ClipboardList className="size-4" />
            Mock Test
          </TabsTrigger>
          <TabsTrigger value="practice" className="gap-1.5">
            <GraduationCap className="size-4" />
            Latihan
          </TabsTrigger>
          <TabsTrigger value="vocab" className="gap-1.5">
            <BookA className="size-4" />
            Vocabulary
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5">
            <Settings2 className="size-4" />
            Profil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <EnglishOverviewPanel data={data} />
        </TabsContent>
        <TabsContent value="mocks" className="mt-4">
          <EnglishMockPanel data={data} token={token!} onRefresh={load} />
        </TabsContent>
        <TabsContent value="practice" className="mt-4">
          <EnglishPracticePanel data={data} token={token!} onRefresh={load} />
        </TabsContent>
        <TabsContent value="vocab" className="mt-4">
          <EnglishVocabPanel data={data} token={token!} onRefresh={load} />
        </TabsContent>
        <TabsContent value="profile" className="mt-4">
          <EnglishProfilePanel data={data} token={token!} onRefresh={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
