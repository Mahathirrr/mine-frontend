import { colorForCalendarSlug, colorForKanbanColumn, findGoogleEventColor, googleEventColors } from "./calendar-config";

export type EventDisplayStyle = {
  color: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  contrastColor: string;
  accentColor: string;
};

function normalizeHex(color: string): string | null {
  const trimmed = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return null;
}

export function resolveAccentColor(color: string | undefined, fallbackAccent: string): string {
  const hex = color ? normalizeHex(color) : null;
  if (!hex) return fallbackAccent;
  return findGoogleEventColor(hex).accent;
}

export function resolveStoredEventColor(color: string | undefined, calendarSlug: string): string {
  return resolveAccentColor(color, colorForCalendarSlug(calendarSlug));
}

export function resolveKanbanEventColor(color: string | undefined, columnId: string | undefined): string {
  return resolveAccentColor(color, colorForKanbanColumn(columnId));
}

export function eventDisplayStyle(accent: string, isDark: boolean): EventDisplayStyle {
  const entry = findGoogleEventColor(accent);
  const surface = isDark ? entry.dark : entry.light;

  return {
    accentColor: entry.accent,
    color: surface.background,
    backgroundColor: surface.background,
    borderColor: entry.accent,
    textColor: surface.text,
    contrastColor: surface.text,
  };
}

export function isPaletteColor(color: string): boolean {
  const hex = normalizeHex(color);
  if (!hex) return false;
  return googleEventColors.some((entry) => entry.accent.toLowerCase() === hex);
}

/** @deprecated use eventDisplayStyle */
export function eventTextColor(backgroundHex: string): string {
  return eventDisplayStyle(backgroundHex, false).textColor;
}
