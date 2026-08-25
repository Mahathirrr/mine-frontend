import type { ActivityDay, BucketStats, LeetCodeProblem, LeetCodeStats, ProblemStatus } from "@/lib/api/leetcode";

export type CategoryStat = {
  name: string;
  total: number;
  solved: number;
  percent: number;
};

function isSolved(status: LeetCodeProblem["status"]) {
  return status === "solved";
}

export function computeStats(problems: LeetCodeProblem[]) {
  const stats: LeetCodeStats = { total: problems.length, solved: 0, in_progress: 0, todo: 0 };
  const byDifficulty: Record<string, BucketStats> = {
    Easy: { total: 0, solved: 0 },
    Medium: { total: 0, solved: 0 },
    Hard: { total: 0, solved: 0 },
  };
  const categoryMap = new Map<string, BucketStats>();
  const categoryOrder: string[] = [];

  for (const p of problems) {
    if (isSolved(p.status)) stats.solved++;
    else stats.todo++;

    const diff = byDifficulty[p.difficulty];
    if (diff) {
      diff.total++;
      if (isSolved(p.status)) diff.solved++;
    }

    if (!categoryMap.has(p.category)) {
      categoryMap.set(p.category, { total: 0, solved: 0 });
      categoryOrder.push(p.category);
    }
    const cat = categoryMap.get(p.category)!;
    cat.total++;
    if (isSolved(p.status)) cat.solved++;
  }

  const categories: CategoryStat[] = categoryOrder.map((name) => {
    const s = categoryMap.get(name)!;
    return {
      name,
      total: s.total,
      solved: s.solved,
      percent: s.total > 0 ? Math.round((s.solved / s.total) * 100) : 0,
    };
  });

  const percent = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

  return { stats, percent, byDifficulty, categories };
}

export function patchActivity(activity: ActivityDay[], becameSolved: boolean): ActivityDay[] {
  if (!becameSolved) return activity;
  const today = new Date().toISOString().slice(0, 10);
  const map = new Map(activity.map((a) => [a.day, a.count]));
  map.set(today, (map.get(today) ?? 0) + 1);
  return Array.from(map.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function applyStatusChange(
  problems: LeetCodeProblem[],
  problemId: number,
  nextStatus: ProblemStatus,
  nextNotes?: string | null,
) {
  return problems.map((p) => {
    if (p.id !== problemId) return p;
    return {
      ...p,
      status: nextStatus,
      notes: nextNotes ?? p.notes,
    };
  });
}
