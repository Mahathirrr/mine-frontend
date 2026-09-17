import { colorForCalendarSlug, colorForKanbanColumn, eventColorPalette } from "./calendar-config";

function normalizeHex(color: string): string | null {
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return null;
}

export function resolveStoredEventColor(color: string | undefined, calendarSlug: string): string {
  const hex = color ? normalizeHex(color) : null;
  if (hex) return hex;
  return colorForCalendarSlug(calendarSlug);
}

export function resolveKanbanEventColor(color: string | undefined, columnId: string | undefined): string {
  const hex = color ? normalizeHex(color) : null;
  if (hex && hex !== normalizeHex("#6366f1")) {
    return hex;
  }
  return colorForKanbanColumn(columnId);
}

export function eventTextColor(backgroundHex: string): string {
  const hex = normalizeHex(backgroundHex) ?? "#616161";
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#1a1a1a" : "#ffffff";
}

export function isPaletteColor(color: string): boolean {
  const hex = normalizeHex(color);
  if (!hex) return false;
  return eventColorPalette.some((entry) => entry.hex === hex);
}
