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
  work: "#3d8064",
  personal: "#6366f1",
  team: "#f59e0b",
  focus: "#ec4899",
  kanban: "#6366f1",
  holidays: "#dc2626",
  holidaysJoint: "#ea580c",
};

export const timeGridOptions = {
  slotMinTime: "06:00:00",
  slotMaxTime: "22:00:00",
  scrollTime: "08:00:00",
  slotDuration: "00:30:00",
  snapDuration: "00:15:00",
  eventTimeFormat: {
    hour: "numeric" as const,
    minute: "2-digit" as const,
    meridiem: "narrow" as const,
    hour12: true,
  },
};
