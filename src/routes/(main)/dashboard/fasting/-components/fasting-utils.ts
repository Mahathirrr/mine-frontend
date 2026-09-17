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
  const start = new Date(session.started_at).getTime();
  const end = session.ended_at ? new Date(session.ended_at).getTime() : now;
  return Math.max(0, (end - start) / 3600000);
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export const zoneIcons: Record<string, string> = {
  tools: "🔧",
  zap: "⚡",
  flame: "🔥",
  avocado: "🥑",
  rocket: "🚀",
  sparkles: "✨",
};
