"use client";

import * as React from "react";

import { cn } from "cn";
import { CheckCircle2, Circle, Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type ActivityDay,
  type BucketStats,
  type CategoryStat,
  type LeetCodeProblem,
  type LeetCodeProblemsResponse,
  type LeetCodeStats,
  LIST_LABEL,
  leetcodeApi,
  type ProblemList,
  type ProblemStatus,
} from "@/lib/api/leetcode";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { ActivityHeatmap } from "./activity-heatmap";
import { CategorySection } from "./category-section";
import { applyStatusChange, computeStats, patchActivity } from "./leetcode-stats";
import { MaterialArchive } from "./material-archive";
import { normalizeStatus } from "./problem-status";
import { ProgressRing } from "./progress-ring";

const DIFFICULTY_VARIANT: Record<string, "secondary" | "outline" | "destructive"> = {
  Easy: "secondary",
  Medium: "outline",
  Hard: "destructive",
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "amber" | "muted";
}) {
  const tones = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    muted: "text-foreground bg-muted/60",
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

function CategoryCurriculum({ categories }: { categories: CategoryStat[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((cat, i) => {
        const complete = cat.percent === 100;

        return (
          <div key={cat.name} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {complete ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : null}
                {cat.name}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs tabular-nums",
                  complete ? "font-medium text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                )}
              >
                {cat.solved}/{cat.total} ({cat.percent}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  complete ? "bg-emerald-500" : "bg-primary",
                )}
                style={{ width: `${cat.percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function applyResponse(res: LeetCodeProblemsResponse) {
  const problems = res.problems.map((p) => ({
    ...p,
    status: normalizeStatus(p.status),
  }));
  const computed = computeStats(problems);

  return {
    problems,
    stats: computed.stats,
    percent: computed.percent,
    categories: computed.categories,
    byDifficulty: computed.byDifficulty,
    activity: res.activity,
  };
}

export function LeetCodeTracker() {
  const token = useAuthStore((s) => s.token);
  const cacheRef = React.useRef<Partial<Record<ProblemList, ReturnType<typeof applyResponse>>>>({});
  const activityRef = React.useRef<ActivityDay[]>([]);

  const [list, setList] = React.useState<ProblemList>("nc75");
  const [listPercents, setListPercents] = React.useState<Record<ProblemList, number>>({ nc75: 0, nc150: 0 });
  const [problems, setProblems] = React.useState<LeetCodeProblem[]>([]);
  const [stats, setStats] = React.useState<LeetCodeStats>({ total: 75, solved: 0, in_progress: 0, todo: 75 });
  const [percent, setPercent] = React.useState(0);
  const [categories, setCategories] = React.useState<CategoryStat[]>([]);
  const [byDifficulty, setByDifficulty] = React.useState<Record<string, BucketStats>>({});
  const [activity, setActivity] = React.useState<ActivityDay[]>([]);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [listLoading, setListLoading] = React.useState(false);
  const [savingId, setSavingId] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState("all");

  const applyCached = React.useCallback((data: ReturnType<typeof applyResponse>) => {
    setProblems(data.problems);
    setStats(data.stats);
    setPercent(data.percent);
    setCategories(data.categories);
    setByDifficulty(data.byDifficulty);
    if (data.activity.length > 0) {
      activityRef.current = data.activity;
      setActivity(data.activity);
    } else if (activityRef.current.length > 0) {
      setActivity(activityRef.current);
    }
  }, []);

  const fetchList = React.useCallback(
    async (target: ProblemList, opts?: { silent?: boolean }) => {
      if (!token) return;
      const cached = cacheRef.current[target];
      if (cached) {
        applyCached(cached);
        return;
      }
      if (!opts?.silent) setListLoading(true);
      try {
        const res = await leetcodeApi.listProblems(token, target);
        const data = applyResponse(res);
        cacheRef.current[target] = data;
        if (data.activity.length > 0) activityRef.current = data.activity;
        applyCached(data);
        setListPercents((prev) => ({ ...prev, [target]: res.percent }));
      } finally {
        if (!opts?.silent) setListLoading(false);
      }
    },
    [token, applyCached],
  );

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;

    void (async () => {
      setInitialLoading(true);
      try {
        const [nc75, nc150] = await Promise.all([
          leetcodeApi.listProblems(token, "nc75"),
          leetcodeApi.listProblems(token, "nc150"),
        ]);
        if (cancelled) return;
        cacheRef.current.nc75 = applyResponse(nc75);
        cacheRef.current.nc150 = applyResponse(nc150);
        activityRef.current = nc75.activity.length > 0 ? nc75.activity : nc150.activity;
        setListPercents({ nc75: nc75.percent, nc150: nc150.percent });
        applyCached(cacheRef.current.nc75 ?? applyResponse(nc75));
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, applyCached]);

  React.useEffect(() => {
    if (initialLoading || !token) return;
    void fetchList(list, { silent: !!cacheRef.current[list] });
  }, [list, token, initialLoading, fetchList]);

  const categoryOrder = React.useMemo(() => categories.map((c) => c.name), [categories]);

  const filtered = React.useMemo(() => {
    return problems.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (statusFilter !== "all" && normalizeStatus(p.status) !== statusFilter) return false;
      if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) || String(p.leetcode_id).includes(q) || p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [problems, categoryFilter, statusFilter, difficultyFilter, search]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, LeetCodeProblem[]>();
    for (const p of filtered) {
      const items = map.get(p.category) ?? [];
      items.push(p);
      map.set(p.category, items);
    }
    return categoryOrder.filter((cat) => map.has(cat)).map((cat) => [cat, map.get(cat)!] as const);
  }, [filtered, categoryOrder]);

  const updateProblem = async (problem: LeetCodeProblem, patch: { status?: ProblemStatus; notes?: string | null }) => {
    if (!token) return;

    const prevStatus = problem.status;
    const nextStatus = patch.status ? normalizeStatus(patch.status) : normalizeStatus(problem.status);
    const nextNotes = patch.notes ?? problem.notes;
    const becameSolved = prevStatus !== "solved" && nextStatus === "solved";

    const nextProblems = applyStatusChange(problems, problem.id, nextStatus, nextNotes);
    const computed = computeStats(nextProblems);
    const nextActivity = becameSolved ? patchActivity(activity, true) : activity;

    setSavingId(problem.id);
    setProblems(nextProblems);
    setStats(computed.stats);
    setPercent(computed.percent);
    setCategories(computed.categories);
    setByDifficulty(computed.byDifficulty);
    setActivity(nextActivity);
    setListPercents((prev) => ({ ...prev, [list]: computed.percent }));
    cacheRef.current[list] = {
      problems: nextProblems,
      stats: computed.stats,
      percent: computed.percent,
      categories: computed.categories,
      byDifficulty: computed.byDifficulty,
      activity: nextActivity,
    };
    activityRef.current = nextActivity;

    (["nc75", "nc150"] as const).forEach((key) => {
      if (key === list || !cacheRef.current[key]) return;
      const synced = applyStatusChange(cacheRef.current[key]?.problems, problem.id, nextStatus, nextNotes);
      const syncedStats = computeStats(synced);
      cacheRef.current[key] = {
        ...cacheRef.current[key]!,
        problems: synced,
        stats: syncedStats.stats,
        percent: syncedStats.percent,
        categories: syncedStats.categories,
        byDifficulty: syncedStats.byDifficulty,
      };
      setListPercents((prev) => ({ ...prev, [key]: syncedStats.percent }));
    });

    try {
      await leetcodeApi.updateProgress(token, problem.leetcode_id, {
        status: nextStatus,
        notes: nextNotes,
      });
    } catch {
      void fetchList(list);
    } finally {
      setSavingId(null);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  const expandSections =
    Boolean(search) || categoryFilter !== "all" || statusFilter !== "all" || difficultyFilter !== "all";

  return (
    <div className="flex flex-col gap-5">
      <MaterialArchive />

      <Tabs value={list} onValueChange={(v) => setList(v as ProblemList)}>
        <TabsList>
          <TabsTrigger value="nc75">
            {LIST_LABEL.nc75}
            <Badge variant="secondary" className="ml-2 tabular-nums">
              {listPercents.nc75}%
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="nc150">
            {LIST_LABEL.nc150}
            <Badge variant="secondary" className="ml-2 tabular-nums">
              {listPercents.nc150}%
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <ProgressRing
              percent={percent}
              size={108}
              label={`${stats.solved}/${stats.total}`}
              sublabel={LIST_LABEL[list]}
            />
            <div className="min-w-0 flex-1">
              <ActivityHeatmap activity={activity} />
            </div>
          </div>

          <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
            <StatCard label="Selesai" value={stats.solved} icon={CheckCircle2} tone="emerald" />
            <StatCard label="Belum dikerjakan" value={stats.todo} icon={Circle} tone="muted" />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["Easy", "Medium", "Hard"] as const).map((d) => {
              const s = byDifficulty[d] ?? { total: 0, solved: 0 };
              const pct = s.total > 0 ? Math.round((s.solved / s.total) * 100) : 0;
              return (
                <div key={d} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                  <Badge variant={DIFFICULTY_VARIANT[d]}>{d}</Badge>
                  <span className="font-semibold tabular-nums">{pct}%</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    ({s.solved}/{s.total})
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kurikulum · Progress per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryCurriculum categories={categories} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari judul, nomor LC, kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {categoryOrder.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="todo">Belum</SelectItem>
            <SelectItem value="solved">Selesai</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {listLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          Memuat list...
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {grouped.map(([category, items], idx) => (
          <CategorySection
            key={`${category}-${expandSections}`}
            index={idx}
            category={category}
            items={items}
            catStat={categories.find((c) => c.name === category)}
            savingId={savingId}
            defaultOpen={expandSections}
            onUpdate={(problem, patch) => void updateProblem(problem, patch)}
          />
        ))}

        {filtered.length === 0 && !listLoading && (
          <p className="py-12 text-center text-muted-foreground">Tidak ada problem yang cocok filter.</p>
        )}
      </div>
    </div>
  );
}
