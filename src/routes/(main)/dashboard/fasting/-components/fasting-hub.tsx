"use client";

import * as React from "react";

import { BarChart3, Clock, History, LayoutDashboard, Scale, Settings2, Sparkles, UtensilsCrossed } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FastingOverview } from "@/lib/api/fasting";
import { fastingApi } from "@/lib/api/fasting";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { FastingHistoryPanel } from "./fasting-history-panel";
import { FastingMealsPanel } from "./fasting-meals-panel";
import { FastingProfilePanel } from "./fasting-profile-panel";
import { FastingStatsPanel } from "./fasting-stats-panel";
import { FastingTimerPanel } from "./fasting-timer-panel";
import { FastingWeightPanel } from "./fasting-weight-panel";
import { FastingZonesPanel } from "./fasting-zones-panel";

export function FastingHub() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = React.useState<FastingOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("timer");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setData(await fastingApi.overview(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat fasting tracker");
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
        <Skeleton className="mx-auto size-56 rounded-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const authToken = token ?? "";

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Gagal memuat fasting tracker</p>
        <p className="mt-1 text-muted-foreground">{error ?? "Data tidak tersedia"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-gradient-to-r from-orange-500/10 to-transparent px-4 py-3 text-sm">
        <Sparkles className="size-4 text-orange-500" />
        <span>
          Protocol <strong>{data.profile.protocol_slug}</strong> · streak {data.stats.current_streak} hari ·{" "}
          {data.timer.is_fasting ? "fasting aktif" : "eating window"}
        </span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="timer" className="gap-1.5 rounded-full">
            <Clock className="size-4" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5 rounded-full">
            <BarChart3 className="size-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="weight" className="gap-1.5 rounded-full">
            <Scale className="size-4" />
            Berat
          </TabsTrigger>
          <TabsTrigger value="meals" className="gap-1.5 rounded-full">
            <UtensilsCrossed className="size-4" />
            Makan
          </TabsTrigger>
          <TabsTrigger value="zones" className="gap-1.5 rounded-full">
            <LayoutDashboard className="size-4" />
            Zones
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 rounded-full">
            <History className="size-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5 rounded-full">
            <Settings2 className="size-4" />
            Profil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="mt-4">
          <FastingTimerPanel data={data} token={authToken} onRefresh={load} />
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <FastingStatsPanel data={data} token={authToken} onRefresh={load} />
        </TabsContent>
        <TabsContent value="weight" className="mt-4">
          <FastingWeightPanel data={data} token={authToken} onRefresh={load} />
        </TabsContent>
        <TabsContent value="meals" className="mt-4">
          <FastingMealsPanel data={data} token={authToken} onRefresh={load} />
        </TabsContent>
        <TabsContent value="zones" className="mt-4">
          <FastingZonesPanel data={data} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <FastingHistoryPanel data={data} token={authToken} onRefresh={load} />
        </TabsContent>
        <TabsContent value="profile" className="mt-4">
          <FastingProfilePanel data={data} token={authToken} onRefresh={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
