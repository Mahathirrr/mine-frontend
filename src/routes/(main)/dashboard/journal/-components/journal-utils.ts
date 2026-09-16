import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function formatJournalDate(raw: string): string {
  return format(parseISO(raw), "d MMM yyyy, HH:mm", { locale: idLocale });
}

export function excerpt(text: string, max = 120): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

export function topicColor(color: string | null, index: number): string {
  if (color) return color;
  const palette = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#3b82f6", "#14b8a6"];
  return palette[index % palette.length];
}
