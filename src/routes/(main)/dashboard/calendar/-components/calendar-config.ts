/** Google Calendar event colors (accent = stored value, surfaces tuned for light/dark). */
export type GoogleEventColor = {
  id: string;
  label: string;
  accent: string;
  light: { background: string; text: string };
  dark: { background: string; text: string };
};

export const googleEventColors: GoogleEventColor[] = [
  {
    id: "lavender",
    label: "Lavender",
    accent: "#7986cb",
    light: { background: "#e8eaf6", text: "#3c4043" },
    dark: { background: "#3c4458", text: "#d2e3fc" },
  },
  {
    id: "sage",
    label: "Sage",
    accent: "#33b679",
    light: { background: "#e6f4ea", text: "#137333" },
    dark: { background: "#2e4034", text: "#81c995" },
  },
  {
    id: "grape",
    label: "Grape",
    accent: "#8e24aa",
    light: { background: "#f3e8fd", text: "#7627bb" },
    dark: { background: "#442255", text: "#e9c6ff" },
  },
  {
    id: "flamingo",
    label: "Flamingo",
    accent: "#e67c73",
    light: { background: "#fce8e6", text: "#c5221f" },
    dark: { background: "#4a3230", text: "#f9ab9e" },
  },
  {
    id: "banana",
    label: "Banana",
    accent: "#f6bf26",
    light: { background: "#fef7e0", text: "#8a6d00" },
    dark: { background: "#4a4328", text: "#fdd663" },
  },
  {
    id: "tangerine",
    label: "Tangerine",
    accent: "#f4511e",
    light: { background: "#feefe3", text: "#e8710a" },
    dark: { background: "#4a3228", text: "#fcad70" },
  },
  {
    id: "peacock",
    label: "Peacock",
    accent: "#039be5",
    light: { background: "#e1f5fe", text: "#01579b" },
    dark: { background: "#1e3a47", text: "#8ad4f7" },
  },
  {
    id: "graphite",
    label: "Graphite",
    accent: "#616161",
    light: { background: "#f1f3f4", text: "#3c4043" },
    dark: { background: "#3c4043", text: "#e8eaed" },
  },
  {
    id: "blueberry",
    label: "Blueberry",
    accent: "#3f51b5",
    light: { background: "#e8eaf6", text: "#283593" },
    dark: { background: "#333752", text: "#aeb8f8" },
  },
  {
    id: "basil",
    label: "Basil",
    accent: "#0b8043",
    light: { background: "#e6f4ea", text: "#0d652d" },
    dark: { background: "#2a4032", text: "#7fc89a" },
  },
  {
    id: "tomato",
    label: "Tomato",
    accent: "#d50000",
    light: { background: "#fce8e6", text: "#b31412" },
    dark: { background: "#4a2c2a", text: "#f28b82" },
  },
];

/** @deprecated use googleEventColors */
export const eventColorPalette = googleEventColors.map((entry) => ({
  id: entry.id,
  hex: entry.accent,
  label: entry.label,
}));

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

export const calendarColors: Record<string, string> = {
  work: "#039be5",
  personal: "#33b679",
  team: "#f6bf26",
  focus: "#8e24aa",
  kanban: "#3f51b5",
  holidays: "#d50000",
  holidaysJoint: "#f4511e",
};

export const kanbanColumnColors: Record<string, string> = {
  backlog: "#7986cb",
  todo: "#039be5",
  "in-progress": "#f6bf26",
  done: "#33b679",
};

export function findGoogleEventColor(accent: string): GoogleEventColor {
  const normalized = accent.trim().toLowerCase();
  const exact = googleEventColors.find((entry) => entry.accent.toLowerCase() === normalized);
  if (exact) return exact;

  const legacy: Record<string, string> = {
    "#3d8064": "#0b8043",
    "#6366f1": "#3f51b5",
    "#f59e0b": "#f6bf26",
    "#ec4899": "#8e24aa",
    "#dc2626": "#d50000",
    "#ea580c": "#f4511e",
  };
  const mapped = legacy[normalized];
  if (mapped) {
    return findGoogleEventColor(mapped);
  }

  return googleEventColors[6];
}

export function colorForCalendarSlug(slug: string): string {
  return calendarColors[slug] ?? googleEventColors[6].accent;
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
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % googleEventColors.length;
  }
  return googleEventColors[hash]?.accent ?? googleEventColors[0].accent;
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
