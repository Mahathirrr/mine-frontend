import type { AppPath } from "@/navigation/sidebar/sidebar-items";

export type MineMenuCatalogItem = {
  id: string;
  title: string;
  description: string;
  url: AppPath;
};

export const mineMenuCatalog: MineMenuCatalogItem[] = [
  {
    id: "leetcode",
    title: "LeetCode",
    description: "Tracker soal, progress NeetCode, dan aktivitas coding interview.",
    url: "/dashboard/leetcode",
  },
  {
    id: "interviews",
    title: "Wawancara & Job Tracker",
    description: "Lamaran kerja, tahap interview, pertanyaan, dan prep pack.",
    url: "/dashboard/interviews",
  },
  {
    id: "kanban",
    title: "Task Board",
    description: "Kanban harian untuk task kerja, belajar, dan side project.",
    url: "/dashboard/kanban",
  },
  {
    id: "calendar",
    title: "Calendar",
    description: "Event, deadline, dan jadwal mingguan.",
    url: "/dashboard/calendar",
  },
  {
    id: "finance",
    title: "Keuangan",
    description: "Transaksi, budget, dan goal finansial pribadi.",
    url: "/dashboard/finance",
  },
  {
    id: "subscriptions",
    title: "Biaya Rutin",
    description: "Langganan bulanan seperti VPS, AI tools, dan membership.",
    url: "/dashboard/subscriptions",
  },
  {
    id: "journal",
    title: "Jurnal",
    description: "Daily journal dengan topik spin wheel dan draft/reflection.",
    url: "/dashboard/journal",
  },
  {
    id: "english",
    title: "English",
    description: "Mock test, vocab, dan progress TOEFL/IELTS style.",
    url: "/dashboard/english",
  },
  {
    id: "fasting",
    title: "Fasting",
    description: "Intermittent fasting timer, stats, dan food log.",
    url: "/dashboard/fasting",
  },
  {
    id: "documents",
    title: "Dokumen Penting",
    description: "Arsip KTP, sertifikat, CV, portfolio PDF, dan SKCK.",
    url: "/dashboard/documents",
  },
  {
    id: "prompt-vault",
    title: "Prompt Vault",
    description: "Koleksi prompt AI reusable dengan copy sekali klik.",
    url: "/dashboard/prompt-vault",
  },
];

export const mineMenuIds = mineMenuCatalog.map((item) => item.id);

export function pathForMenuId(id: string): AppPath | null {
  return mineMenuCatalog.find((item) => item.id === id)?.url ?? null;
}

export function resolveLandingPath(preferences: {
  landing_path: string | null;
  enabled_menu_items: string[];
}): AppPath {
  if (preferences.landing_path) {
    return preferences.landing_path as AppPath;
  }
  const first = preferences.enabled_menu_items[0];
  return (first ? pathForMenuId(first) : null) ?? "/dashboard/settings";
}
