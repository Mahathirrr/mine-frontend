import type { PromptCategory } from "@/lib/api/prompt-vault";

export const categoryLabels: Record<PromptCategory, string> = {
  coding: "Coding",
  writing: "Writing",
  career: "Career",
  learning: "Learning",
  research: "Research",
  general: "General",
};

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function excerpt(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trim()}…`;
}
