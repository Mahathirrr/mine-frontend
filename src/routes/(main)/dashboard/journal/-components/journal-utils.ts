import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function htmlToPlainText(html: string): string {
  if (!html.trim()) return "";
  if (!html.includes("<")) return html;
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/li>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toEditorHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("<")) return trimmed;
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return "";
  return paragraphs.map((part) => `<p>${part.replace(/\n/g, "<br>")}</p>`).join("");
}

export function countWords(text: string): number {
  const plain = htmlToPlainText(text);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

export function formatJournalDate(raw: string): string {
  return format(parseISO(raw), "d MMM yyyy, HH:mm", { locale: idLocale });
}

export function excerpt(text: string, max = 120): string {
  const flat = htmlToPlainText(text);
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max)}…`;
}

export function topicColor(color: string | null, index: number): string {
  if (color) return color;
  const palette = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#3b82f6", "#14b8a6"];
  return palette[index % palette.length];
}
