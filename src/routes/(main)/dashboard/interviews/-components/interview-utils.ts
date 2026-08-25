import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import type { InterviewApplication, InterviewApplicationWithRounds, InterviewRound } from "@/lib/api/interviews";

export function appRounds(app: Pick<InterviewApplicationWithRounds, "rounds">) {
  return app.rounds ?? [];
}

export function formatDate(value: string | null | undefined, pattern = "d MMM yyyy") {
  if (!value) return null;
  try {
    return format(parseISO(value), pattern, { locale: idLocale });
  } catch {
    return null;
  }
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  try {
    return format(parseISO(value), "EEE, d MMM yyyy · HH:mm", { locale: idLocale });
  } catch {
    return null;
  }
}

export function formatRelativeSchedule(value: string | null | undefined) {
  if (!value) return null;
  try {
    const date = parseISO(value);
    if (isToday(date)) return `Hari ini, ${format(date, "HH:mm")}`;
    if (isTomorrow(date)) return `Besok, ${format(date, "HH:mm")}`;
    return formatDistanceToNow(date, { addSuffix: true, locale: idLocale });
  } catch {
    return null;
  }
}

export function formatSalary(app: Pick<InterviewApplication, "salary_min" | "salary_max" | "salary_currency">) {
  const currency = app.salary_currency || "IDR";
  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  if (app.salary_min != null && app.salary_max != null) {
    return `${fmt(app.salary_min)} - ${fmt(app.salary_max)}`;
  }
  if (app.salary_min != null) return `Min ${fmt(app.salary_min)}`;
  if (app.salary_max != null) return `Max ${fmt(app.salary_max)}`;
  return null;
}

export function toLocalDatetimeInput(value: string | null | undefined) {
  if (!value) return "";
  try {
    const d = parseISO(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export function fromLocalDatetimeInput(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  try {
    return format(parseISO(value), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export function fromDateInput(value: string) {
  if (!value) return null;
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function upcomingRounds(
  applications: { company: string; role_title: string; rounds: InterviewRound[] }[],
  withinDays = 14,
) {
  const now = Date.now();
  const cutoff = now + withinDays * 24 * 60 * 60 * 1000;
  const items: {
    round: InterviewRound;
    company: string;
    roleTitle: string;
  }[] = [];

  for (const app of applications) {
    for (const round of appRounds(app)) {
      if (round.status !== "scheduled" || !round.scheduled_at) continue;
      const t = parseISO(round.scheduled_at).getTime();
      if (t >= now && t <= cutoff) {
        items.push({ round, company: app.company, roleTitle: app.role_title });
      }
    }
  }

  return items.sort((a, b) => {
    const ta = a.round.scheduled_at ? parseISO(a.round.scheduled_at).getTime() : 0;
    const tb = b.round.scheduled_at ? parseISO(b.round.scheduled_at).getTime() : 0;
    return ta - tb;
  });
}

export function companyInitials(company: string) {
  return company
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
