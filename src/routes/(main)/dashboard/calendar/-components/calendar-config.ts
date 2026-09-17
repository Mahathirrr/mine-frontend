/** Google Calendar-style event palette (11 default swatches). */
export const eventColorPalette = [
  { id: "lavender", hex: "#7986cb", label: "Lavender" },
  { id: "sage", hex: "#33b679", label: "Sage" },
  { id: "grape", hex: "#8e24aa", label: "Grape" },
  { id: "flamingo", hex: "#e67c73", label: "Flamingo" },
  { id: "banana", hex: "#f6bf26", label: "Banana" },
  { id: "tangerine", hex: "#f4511e", label: "Tangerine" },
  { id: "peacock", hex: "#039be5", label: "Peacock" },
  { id: "graphite", hex: "#616161", label: "Graphite" },
  { id: "blueberry", hex: "#3f51b5", label: "Blueberry" },
  { id: "basil", hex: "#0b8043", label: "Basil" },
  { id: "tomato", hex: "#d50000", label: "Tomato" },
] as const;

export const calendarViews = [
  { value: "dayGridMonth", label: "Month" },
  { value: "timeGridWeek", label: "Week" },
  { value: "timeGridDay", label: "Day" },
  { value: "listWeek", label: "Agenda" },
  { value: "multiMonthYear", label: "Year" },
] as const;

export const calendarFilters = [
  { value: "all", label: "All calendars" },
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "team", label: "Team" },
  { value: "focus", label: "Focus time" },
  { value: "kanban", label: "Task due dates" },
  { value: "holidays", label: "Tanggal merah" },
] as const;

export const calendarOptions = [
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "team", label: "Team" },
  { value: "focus", label: "Focus time" },
] as const;

/** Default color per calendar (like Google Calendar calendar colors). */
export const calendarColors: Record<string, string> = {
  work: "#039be5",
  personal: "#33b679",
  team: "#f6bf26",
  focus: "#8e24aa",
  kanban: "#3f51b5",
  holidays: "#d50000",
  holidaysJoint: "#f4511e",
};

/** Kanban due-date blocks colored by board column. */
export const kanbanColumnColors: Record<string, string> = {
  backlog: "#7986cb",
  todo: "#039be5",
  "in-progress": "#f6bf26",
  done: "#33b679",
};

export function colorForCalendarSlug(slug: string): string {
  return calendarColors[slug] ?? eventColorPalette[0].hex;
}

export function colorForKanbanColumn(columnId: string | undefined): string {
  if (columnId && kanbanColumnColors[columnId]) {
    return kanbanColumnColors[columnId];
  }
  return calendarColors.kanban;
}

export function pickDefaultEventColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % eventColorPalette.length;
  }
  return eventColorPalette[hash]?.hex ?? eventColorPalette[0].hex;
}

export const calendarEventTimeFormat = {
  hour: "numeric" as const,
  minute: "2-digit" as const,
  meridiem: "short" as const,
  hour12: true,
};

export const timeGridOptions = {
  slotMinTime: "06:00:00",
  slotMaxTime: "22:00:00",
  scrollTime: "08:00:00",
  slotDuration: "00:30:00",
  snapDuration: "00:15:00",
  eventTimeFormat: calendarEventTimeFormat,
};
