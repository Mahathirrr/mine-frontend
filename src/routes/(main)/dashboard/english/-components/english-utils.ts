import type { EnglishMockTest, SectionAverage } from "@/lib/api/english";

export const SECTIONS = ["reading", "listening", "speaking", "writing"] as const;

export const sectionLabel: Record<string, string> = {
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
  mixed: "Mixed",
};

export const activityLabels: Record<string, string> = {
  timed_practice: "Timed practice",
  shadowing: "Shadowing",
  partner_practice: "Speaking partner",
  lecture_notes: "Lecture notes",
  review: "Review & notes",
  vocab_drill: "Vocab drill",
};

export const masteryLabels: Record<string, string> = {
  new: "Baru",
  learning: "Belajar",
  familiar: "Familiar",
  mastered: "Kuasai",
};

export const masteryColor: Record<string, string> = {
  new: "bg-slate-500/15 text-slate-700 dark:text-slate-200",
  learning: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  familiar: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  mastered: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
};

export function formatToeflScore(n: number) {
  return `${Math.round(n)}/120`;
}

export function formatIeltsBand(n: number) {
  return n.toFixed(1);
}

export function formatSectionScore(exam: string, n: number) {
  if (exam === "ielts") return n.toFixed(1);
  return String(Math.round(n));
}

export function daysUntil(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

export function mockSectionRows(mock: EnglishMockTest) {
  return SECTIONS.map((s) => ({
    section: s,
    score: mock[`${s}_score` as keyof EnglishMockTest] as number,
  })).filter((r) => r.score > 0 || mock.test_kind === "full");
}

export function sectionBarData(sections: SectionAverage[], exam: string) {
  return sections.map((s) => ({
    section: sectionLabel[s.section] ?? s.section,
    score: s.avg,
    max: exam === "ielts" ? 9 : 30,
  }));
}
