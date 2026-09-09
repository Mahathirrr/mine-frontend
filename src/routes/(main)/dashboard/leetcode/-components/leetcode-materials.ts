import materialData from "./problem-material-pages.json";

export const MATERIALS_BASE = "/leetcode-materials/build";

export type MaterialArchiveItem = {
  slug: string;
  title: string;
  subtitle: string;
  file: string;
  pages: number;
};

export type ProblemMaterialRef = {
  pageFull: number;
  pageModule: number;
  moduleTitle: string;
  archiveSlug: string;
};

const archive = materialData.archive as MaterialArchiveItem[];
const problemPages = materialData.problems as Record<string, ProblemMaterialRef>;

/** Map kategori tracker ke slug arsip modul (hanya yang punya PDF). */
const CATEGORY_ARCHIVE_SLUGS: Record<string, string[]> = {
  "Arrays & Hashing": ["modul-2", "modul-3", "modul-4"],
  "Two Pointers": ["modul-5"],
  "Sliding Window": ["modul-6", "modul-7"],
  Stack: ["modul-8"],
  "Binary Search": ["modul-9"],
  "Linked List": ["modul-10", "modul-11", "modul-12"],
  Trees: ["modul-13", "modul-14", "modul-15", "modul-16", "modul-17"],
  Tries: ["modul-18"],
  Backtracking: ["modul-19"],
  "Heap / Priority Queue": ["modul-20"],
  Greedy: ["modul-28"],
  Intervals: ["modul-27"],
  "Math & Geometry": ["modul-29"],
  "Bit Manipulation": ["modul-29"],
  "1-D Dynamic Programming": ["modul-24", "modul-26"],
  "2-D Dynamic Programming": ["modul-25"],
  Graphs: ["modul-21", "modul-22", "modul-23"],
  "Advanced Graphs": ["modul-21", "modul-22", "modul-23"],
};

const archiveBySlug = new Map(archive.map((item) => [item.slug, item]));

export function archiveHref(file: string) {
  return `${MATERIALS_BASE}/${file}`;
}

export function fullPdfPageHref(page: number) {
  return `${archiveHref("full.pdf")}#page=${page}`;
}

export function modulePdfPageHref(file: string, page: number) {
  return `${archiveHref(file)}#page=${page}`;
}

export function getFeaturedArchive() {
  const full = archiveBySlug.get("full");
  const basics = archiveBySlug.get("modul-1");
  return [basics, full].filter(Boolean) as MaterialArchiveItem[];
}

export function getModuleArchive() {
  return archive.filter((item) => item.slug !== "full" && item.slug !== "modul-1");
}

export function getArchiveItem(slug: string) {
  return archiveBySlug.get(slug);
}

export function getProblemMaterial(leetcodeId: number): ProblemMaterialRef | undefined {
  return problemPages[String(leetcodeId)];
}

export function getArchiveForCategory(category: string): MaterialArchiveItem[] {
  const slugs = CATEGORY_ARCHIVE_SLUGS[category] ?? [];
  return slugs.map((slug) => archiveBySlug.get(slug)).filter(Boolean) as MaterialArchiveItem[];
}

export function categoryHasMaterial(category: string) {
  return getArchiveForCategory(category).length > 0;
}
