import type { JobStatus } from "@/lib/api/job-tracker";

export const JOB_STATUS_ORDER: JobStatus[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "ghosted",
  "withdrawn",
];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
  withdrawn: "Withdrawn",
};

export const JOB_STATUS_TONE: Record<JobStatus, string> = {
  saved: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
  applied: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  screening: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  interview: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  offer: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  ghosted: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
  withdrawn: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
};

export const PLATFORM_LABEL: Record<string, string> = {
  manual: "Manual",
  linkedin: "LinkedIn",
  linkedin_rss: "LinkedIn RSS",
  glints: "Glints",
  jobstreet: "JobStreet",
  kalibrr: "Kalibrr",
  dealls: "Dealls",
  loker: "Loker.id",
  indeed: "Indeed",
  fhci: "FHCI Rekrutmen Bersama",
  rekrutmen_bersama: "FHCI Rekrutmen Bersama",
  garena: "Garena",
  career_page: "Career Page",
  magenta: "Magenta BUMN",
  magenta_magang: "Magenta — Magang",
  magenta_kerja: "Magenta — Kerja",
  pertamina: "Pertamina",
  rss: "RSS Feed",
  arbeitnow: "Arbeitnow",
  remotive: "Remotive",
  remoteok: "RemoteOK",
  himalayas: "Himalayas",
  jobicy: "Jobicy",
  greenhouse: "Greenhouse",
  lever: "Lever",
  workable: "Workable",
  ashby: "Ashby",
  other: "Other",
};

export type IngestionPlatform = (typeof INGESTION_PLATFORMS)[number]["value"];

export const INGESTION_PLATFORMS = [
  { value: "linkedin", label: "LinkedIn Search", hint: "Guest API — keywords + lokasi (Indonesia)" },
  { value: "glints", label: "Glints", hint: "GraphQL API — keywords + country ID/SG/MY" },
  { value: "jobstreet", label: "JobStreet", hint: "SEEK v5 API — keywords + kota" },
  { value: "kalibrr", label: "Kalibrr ID", hint: "Job board SEA — API publik kalibrr.id" },
  { value: "dealls", label: "Dealls", hint: "Portal loker Indonesia — api.sejutacita.id" },
  { value: "loker", label: "Loker.id", hint: "Lowongan Indonesia — SSR loker.id (Remix)" },
  { value: "indeed", label: "Indeed Indonesia", hint: "Indeed GraphQL API (id.indeed.com)" },
  { value: "fhci", label: "FHCI Rekrutmen Bersama", hint: "Rekrutmen bersama BUMN — rekrutmenbersama.fhcibumn.id" },
  { value: "garena", label: "Garena Careers", hint: "Lowongan Garena (Jakarta / SEA)" },
  { value: "magenta_magang", label: "Magenta — Magang", hint: "Magang BUMN saja (magentaku.id)" },
  { value: "magenta_kerja", label: "Magenta — Kerja", hint: "Lowongan kerja BUMN saja (magentaku.id)" },
  { value: "remotive", label: "Remotive API", hint: "Remote jobs JSON (career-ops)" },
  { value: "remoteok", label: "RemoteOK", hint: "Remote jobs board (career-ops)" },
  { value: "himalayas", label: "Himalayas", hint: "Remote tech jobs (career-ops)" },
  { value: "jobicy", label: "Jobicy API", hint: "Remote jobs JSON (career-ops)" },
  { value: "rss", label: "RSS / Atom Feed", hint: "WWR, LinkedIn job alert RSS, dll." },
  { value: "arbeitnow", label: "Arbeitnow", hint: "Board tech jobs global (JSON)" },
  { value: "greenhouse", label: "Greenhouse ATS", hint: "URL board Greenhouse perusahaan" },
  { value: "lever", label: "Lever ATS", hint: "URL jobs.lever.co/perusahaan" },
  { value: "workable", label: "Workable ATS", hint: "URL apply.workable.com/slug" },
  { value: "ashby", label: "Ashby ATS", hint: "URL jobs.ashbyhq.com/perusahaan" },
  { value: "career_page", label: "Career Page", hint: "Pertamina / Magenta / halaman karir generik" },
] as const;

export const PLATFORM_DEFAULT_URL: Partial<Record<IngestionPlatform, string>> = {
  linkedin: "https://www.linkedin.com/jobs",
  glints: "https://glints.com/id/opportunities/jobs/explore",
  jobstreet: "https://id.jobstreet.com",
  kalibrr: "https://www.kalibrr.id/job-board/co/Indonesia/1",
  dealls: "https://dealls.com/en/loker",
  loker: "https://www.loker.id/cari-lowongan-kerja",
  indeed: "https://id.indeed.com/",
  fhci: "https://rekrutmenbersama.fhcibumn.id",
  garena: "https://careers.garena.com",
  magenta_magang: "https://magentaku.id/lowongan/magang",
  magenta_kerja: "https://magentaku.id/lowongan/kerja",
  remotive: "https://remotive.com/api/remote-jobs",
  remoteok: "https://remoteok.com/api",
  himalayas: "https://himalayas.app/jobs/api",
  jobicy: "https://jobicy.com/api/v2/remote-jobs",
  arbeitnow: "https://www.arbeitnow.com/api/job-board-api",
  career_page: "https://recruitment.pertamina.com",
};

export const CONTACT_SOURCE_LABEL: Record<string, string> = {
  manual: "Manual",
  seed: "Demo",
  feed_import: "Auto Feed",
  job_discover: "Dari lowongan",
  linkedin: "LinkedIn",
};
