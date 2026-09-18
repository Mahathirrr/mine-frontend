import type { ComponentType } from "react";

import {
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CheckSquare,
  Flame,
  FolderOpen,
  GraduationCap,
  Languages,
  type LucideIcon,
  ReceiptText,
  Sparkles,
  Target,
} from "lucide-react";

import { LeetCodeLogo } from "@/components/brand/leetcode-logo";
import type { AppPath } from "@/navigation/sidebar/sidebar-items";

export type HomeModuleDef = {
  menuId: string;
  apiKey: string;
  title: string;
  description: string;
  url: AppPath;
  icon: LucideIcon | ComponentType<{ className?: string }>;
  accent: string;
};

export const HOME_MODULE_DEFS: HomeModuleDef[] = [
  {
    menuId: "leetcode",
    apiKey: "leetcode",
    title: "LeetCode",
    description: "Progress NeetCode & aktivitas solve",
    url: "/dashboard/leetcode",
    icon: LeetCodeLogo,
    accent: "from-amber-500/15 to-card",
  },
  {
    menuId: "interviews",
    apiKey: "interviews",
    title: "Wawancara",
    description: "Prep pack & jadwal interview",
    url: "/dashboard/interviews",
    icon: BriefcaseBusiness,
    accent: "from-violet-500/15 to-card",
  },
  {
    menuId: "job-tracker",
    apiKey: "job_tracker",
    title: "Job Tracker",
    description: "Pipeline lamaran & feed lowongan",
    url: "/dashboard/job-tracker",
    icon: Target,
    accent: "from-sky-500/15 to-card",
  },
  {
    menuId: "kanban",
    apiKey: "kanban",
    title: "Task Board",
    description: "Kanban harian",
    url: "/dashboard/kanban",
    icon: CheckSquare,
    accent: "from-emerald-500/15 to-card",
  },
  {
    menuId: "calendar",
    apiKey: "calendar",
    title: "Calendar",
    description: "Event & deadline",
    url: "/dashboard/calendar",
    icon: Calendar,
    accent: "from-teal-500/15 to-card",
  },
  {
    menuId: "finance",
    apiKey: "finance",
    title: "Keuangan",
    description: "Saldo & arus bulan ini",
    url: "/dashboard/finance",
    icon: Banknote,
    accent: "from-lime-500/15 to-card",
  },
  {
    menuId: "subscriptions",
    apiKey: "subscriptions",
    title: "Biaya Rutin",
    description: "Langganan & burn rate",
    url: "/dashboard/subscriptions",
    icon: ReceiptText,
    accent: "from-orange-500/15 to-card",
  },
  {
    menuId: "journal",
    apiKey: "journal",
    title: "Jurnal",
    description: "Refleksi & draft",
    url: "/dashboard/journal",
    icon: BookOpen,
    accent: "from-rose-500/15 to-card",
  },
  {
    menuId: "english",
    apiKey: "english",
    title: "English",
    description: "TOEFL/IELTS practice",
    url: "/dashboard/english",
    icon: Languages,
    accent: "from-indigo-500/15 to-card",
  },
  {
    menuId: "fasting",
    apiKey: "fasting",
    title: "Fasting",
    description: "Timer & streak puasa",
    url: "/dashboard/fasting",
    icon: Flame,
    accent: "from-orange-600/15 to-card",
  },
  {
    menuId: "documents",
    apiKey: "documents",
    title: "Dokumen",
    description: "Vault dokumen penting",
    url: "/dashboard/documents",
    icon: FolderOpen,
    accent: "from-cyan-500/15 to-card",
  },
  {
    menuId: "prompt-vault",
    apiKey: "prompt_vault",
    title: "Prompt Vault",
    description: "Koleksi prompt AI",
    url: "/dashboard/prompt-vault",
    icon: Sparkles,
    accent: "from-fuchsia-500/15 to-card",
  },
  {
    menuId: "skills",
    apiKey: "skills",
    title: "Skill Tracker",
    description: "Roadmap & checklist IT",
    url: "/dashboard/skills",
    icon: GraduationCap,
    accent: "from-blue-500/15 to-card",
  },
];

export function formatModuleMetrics(
  apiKey: string,
  mod: Record<string, number | boolean | string> | undefined,
): string[] {
  if (!mod) return ["Belum ada data"];
  switch (apiKey) {
    case "leetcode":
      return [`${num(mod.solved)} solved · ${num(mod.solved_week)} minggu ini`, `${num(mod.tracked)} soal dilacak`];
    case "interviews":
      return [
        `${num(mod.active)} pipeline aktif · ${num(mod.upcoming)} jadwal 7 hari`,
        `${num(mod.questions)} pertanyaan di bank`,
      ];
    case "job_tracker":
      return [
        `${num(mod.active)} lamaran aktif · ${num(mod.offers)} offer`,
        `${num(mod.pending_feed)} inbox feed · ${num(mod.upcoming)} interview`,
      ];
    case "kanban":
      return [`${num(mod.open)} task terbuka`, `${num(mod.due_soon)} deadline ≤3 hari`];
    case "calendar":
      return [`${num(mod.today)} hari ini`, `${num(mod.next_7_days)} event 7 hari ke depan`];
    case "finance":
      return [`Saldo ${formatIDR(mod.total_balance)}`, `Bulan ini ${formatIDR(mod.month_net)} net`];
    case "subscriptions":
      return [
        `Burn ~${formatIDR(mod.monthly_burn_idr)}/bulan`,
        mod.overdue ? `${num(mod.overdue)} terlambat` : "Semua tagihan OK",
      ];
    case "journal":
      return [`${num(mod.total)} entri`, `${num(mod.updated_week)} diupdate minggu ini`];
    case "english":
      return [
        `Streak ${num(mod.study_streak)} hari`,
        `${num(mod.practice_hours_week).toFixed(1)} jam praktik minggu ini`,
      ];
    case "fasting":
      if (mod.active === true) {
        return [`Puasa aktif · ${num(mod.elapsed_hours).toFixed(1)} jam`, `Streak ${num(mod.current_streak)} hari`];
      }
      return [`Streak ${num(mod.current_streak)} hari`, "Tidak ada sesi aktif"];
    case "documents":
      return [`${num(mod.files)} file di vault`];
    case "prompt_vault":
      return [`${num(mod.prompts)} prompt tersimpan`];
    case "skills":
      return [`${num(mod.progress_pct).toFixed(0)}% checklist`, `${num(mod.done)}/${num(mod.total)} item`];
    default:
      return ["—"];
  }
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || 0;
  return 0;
}

function formatIDR(v: unknown): string {
  const n = num(v);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
