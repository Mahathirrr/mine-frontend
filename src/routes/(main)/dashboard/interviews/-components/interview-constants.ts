import type { AppStatus, QuestionCategory, RoundOutcome, RoundType, WorkType } from "@/lib/api/interviews";

export const APP_STATUS_ORDER: AppStatus[] = [
  "wishlist",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
];

export const APP_STATUS_LABEL: Record<AppStatus, string> = {
  wishlist: "Wishlist",
  applied: "Melamar",
  screening: "Screening",
  interviewing: "Wawancara",
  offer: "Offer",
  rejected: "Ditolak",
  withdrawn: "Batal",
};

export const APP_STATUS_TONE: Record<AppStatus, string> = {
  wishlist: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/25",
  applied: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25",
  screening: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25",
  interviewing: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/25",
  offer: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  rejected: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/25",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  unknown: "Belum diisi",
};

export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  phone: "Telepon",
  hr: "HR",
  technical: "Teknis",
  coding: "Coding",
  system_design: "System Design",
  behavioral: "Behavioral",
  assignment: "Take-home",
  final: "Final",
  other: "Lainnya",
};

export const ROUND_OUTCOME_LABEL: Record<RoundOutcome, string> = {
  pending: "Menunggu",
  passed: "Lulus",
  failed: "Gagal",
  skipped: "Lewati",
};

export const QUESTION_CATEGORY_LABEL: Record<QuestionCategory, string> = {
  behavioral: "Behavioral",
  technical: "Teknis",
  system_design: "System Design",
  coding: "Coding",
  company: "Perusahaan",
  salary: "Gaji",
  other: "Lainnya",
};

/** Top-level tabs for general prep library (company-specific lives under Perusahaan tab). */
export const GENERAL_PREP_CATEGORIES: QuestionCategory[] = [
  "behavioral",
  "technical",
  "system_design",
  "coding",
  "salary",
  "other",
];

export const GENERAL_PREP_CATEGORY_DESC: Partial<Record<QuestionCategory, string>> = {
  behavioral: "Ceritakan diri, STAR, motivasi, kelebihan & kekurangan",
  technical: "Konsep teknis per domain (mobile, backend, dll.)",
  system_design: "Arsitektur, skalabilitas, trade-off",
  coding: "Algoritma & struktur data",
  salary: "Negosiasi gaji & benefit",
  other: "Topik lain di luar kategori di atas",
};

export const DEFAULT_TECH_GROUPS = ["Umum", "Mobile", "Backend", "Frontend", "DevOps"] as const;

/** Company-specific prep tabs (mirrors typical interview pack structure). */
export const COMPANY_PREP_CATEGORIES: QuestionCategory[] = ["company", "behavioral", "technical", "other"];

export const COMPANY_PREP_CATEGORY_LABEL: Partial<Record<QuestionCategory, string>> = {
  company: "Pengetahuan Perusahaan",
  behavioral: "HRD & Non-Teknis",
  technical: "Teknis",
  other: "Lainnya",
};

export const COMPANY_PREP_CATEGORY_DESC: Partial<Record<QuestionCategory, string>> = {
  company: "Profil perusahaan, produk, visi, dan konteks role",
  behavioral: "Perkenalan diri, motivasi, STAR, sikap kerja",
  technical: "Soal teknis sesuai posisi yang dilamar",
  other: "Topik tambahan di luar tiga kategori utama",
};

export const TECH_GROUP_STORAGE_KEY = "mine-interview-tech-groups";

export const PRIORITY_LABEL: Record<number, string> = {
  1: "Tinggi",
  2: "Sedang",
  3: "Rendah",
};

export const ACTIVE_STATUSES: AppStatus[] = ["wishlist", "applied", "screening", "interviewing"];
