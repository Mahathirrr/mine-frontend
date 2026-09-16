import type { QuestionCategory } from "@/lib/api/interviews";

export type ParsedTxtQuestion = {
  category: QuestionCategory;
  question: string;
  answer: string;
  section_label: string | null;
};

const SECTION_CATEGORY: Record<string, QuestionCategory> = {
  "pengetahuan perusahaan": "company",
  perusahaan: "company",
  hrd: "behavioral",
  "hrd & non-teknis": "behavioral",
  "non-teknis": "behavioral",
  behavioral: "behavioral",
  teknis: "technical",
  "teknis software engineer": "technical",
  technical: "technical",
  coding: "coding",
  "system design": "system_design",
  gaji: "salary",
  salary: "salary",
  lainnya: "other",
};

export const INTERVIEW_TXT_FORMAT_HELP = `Format file .txt (UTF-8):

# Pengetahuan Perusahaan
Q: Apa yang kamu tahu tentang perusahaan ini?
A: Jawaban kamu...

Q: Pertanyaan berikutnya?
A: Jawaban berikutnya...

# HRD & Non-Teknis
Q: Ceritakan tentang diri kamu
A: Jawaban STAR...

# Teknis
Q: Apa perbedaan REST dan GraphQL?
A: REST resource-based...

Aturan:
- Baris # Judul = kategori (opsional)
- Q: atau Q. = pertanyaan
- A: atau A. = jawaban (bisa beberapa baris sampai Q: berikutnya)
- Pisah soal dengan baris kosong atau ---
- Kategori yang didukung: Pengetahuan Perusahaan, HRD & Non-Teknis, Teknis, Coding, System Design, Gaji, Lainnya`;

function normalizeHeader(line: string) {
  return line
    .replace(/^#+\s*/, "")
    .trim()
    .toLowerCase();
}

function resolveCategory(header: string): QuestionCategory | null {
  return SECTION_CATEGORY[normalizeHeader(header)] ?? null;
}

function isQuestionLine(line: string) {
  return /^Q[:.]?\s+/i.test(line.trim());
}

function isAnswerLine(line: string) {
  return /^A[:.]?\s+/i.test(line.trim());
}

function stripQuestionPrefix(line: string) {
  return line.replace(/^Q[:.]?\s+/i, "").trim();
}

function stripAnswerPrefix(line: string) {
  return line.replace(/^A[:.]?\s+/i, "").trim();
}

export function parseInterviewTxt(text: string, defaultCategory: QuestionCategory = "company"): ParsedTxtQuestion[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let category: QuestionCategory = defaultCategory;
  const results: ParsedTxtQuestion[] = [];

  let mode: "idle" | "question" | "answer" = "idle";
  let question = "";
  let answer = "";

  function flush() {
    const q = question.trim();
    if (!q) {
      question = "";
      answer = "";
      mode = "idle";
      return;
    }
    results.push({
      category,
      question: q,
      answer: answer.trim(),
      section_label: null,
    });
    question = "";
    answer = "";
    mode = "idle";
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed || trimmed === "---") {
      if (mode === "answer") flush();
      continue;
    }

    if (trimmed.startsWith("#")) {
      if (mode === "answer") flush();
      const nextCategory = resolveCategory(trimmed);
      if (nextCategory) category = nextCategory;
      continue;
    }

    if (isQuestionLine(trimmed)) {
      if (mode === "answer") flush();
      question = stripQuestionPrefix(trimmed);
      mode = "question";
      continue;
    }

    if (isAnswerLine(trimmed)) {
      answer = stripAnswerPrefix(trimmed);
      mode = "answer";
      continue;
    }

    if (mode === "question") {
      question = question ? `${question}\n${trimmed}` : trimmed;
      continue;
    }

    if (mode === "answer") {
      answer = answer ? `${answer}\n${trimmed}` : trimmed;
    }
  }

  if (mode === "answer" || question.trim()) flush();

  return results;
}
