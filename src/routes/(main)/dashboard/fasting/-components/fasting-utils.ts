import { format, isValid } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import type { FastingSession } from "@/lib/api/fasting";

export const mealLabels: Record<string, string> = {
  breakfast: "Sarapan",
  lunch: "Makan siang",
  dinner: "Makan malam",
  snack: "Snack",
};

export function formatDuration(hours: number) {
  const totalSec = Math.max(0, Math.floor(hours * 3600));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDurationHuman(hours: number) {
  const totalMin = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} menit`;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} menit`;
}

export function formatDurationShort(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatKg(n: number) {
  return `${n.toFixed(1)} kg`;
}

export function sessionDurationHours(session: FastingSession, now = Date.now()) {
  const startDate = parseDate(session.started_at);
  if (!startDate) return 0;
  const start = startDate.getTime();
  const endDate = session.ended_at ? parseDate(session.ended_at) : null;
  const end = endDate ? endDate.getTime() : now;
  if (!Number.isFinite(end) || end < start) return 0;
  return Math.max(0, (end - start) / 3600000);
}

export function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isValid(d) ? d : null;
}

export function toLocalDatetimeInput(iso: string | null | undefined): string {
  const d = parseDate(iso);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseLocalDatetimeInput(local: string): Date | null {
  if (!local.trim()) return null;
  const d = new Date(local);
  return isValid(d) ? d : null;
}

export function formatDateTime(iso: string) {
  const d = parseDate(iso);
  if (!d) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatLocalDatetimeDisplay(local: string) {
  const d = parseLocalDatetimeInput(local);
  if (!d) return "—";
  return format(d, "EEE, d MMM 'at' HH.mm", { locale: idLocale });
}

export const zoneIcons: Record<string, string> = {
  tools: "🔧",
  zap: "⚡",
  flame: "🔥",
  avocado: "🥑",
  rocket: "🚀",
  sparkles: "✨",
};
