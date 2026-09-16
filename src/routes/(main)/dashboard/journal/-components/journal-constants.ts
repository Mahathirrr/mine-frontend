import type { JournalMood } from "@/lib/api/journal";

export const MOOD_LABEL: Record<JournalMood, string> = {
  great: "Luar biasa",
  good: "Baik",
  okay: "Biasa",
  low: "Lemah",
  stuck: "Buntu",
};

export const MOOD_EMOJI: Record<JournalMood, string> = {
  great: "✨",
  good: "🙂",
  okay: "😐",
  low: "😔",
  stuck: "🧱",
};

export const PRESET_TOPIC_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
  "#64748b",
];
