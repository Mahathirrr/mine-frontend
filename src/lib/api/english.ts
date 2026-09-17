import { ApiError, friendlyApiMessage } from "@/lib/api/api-error";

function resolveApiUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw !== undefined && raw !== "") return raw.replace(/\/$/, "");
  return (import.meta.env.PROD ? "/api" : "http://localhost:8080/api").replace(/\/$/, "");
}

const API_URL = resolveApiUrl();

async function request<T>(path: string, token: string, options: { method?: string; body?: unknown } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(friendlyApiMessage(res.status, extractErrorMessage(data)), res.status);
  return data as T;
}

function extractErrorMessage(data: Record<string, unknown>): string {
  if (typeof data.error === "string") return data.error;
  return "";
}

export type EnglishProfile = {
  id: number;
  user_id: number;
  focus_exam: "toefl" | "ielts" | "both";
  toefl_target_total: number;
  ielts_target_band: number;
  toefl_exam_date: string | null;
  ielts_exam_date: string | null;
  weekly_hours_goal: number;
  current_cefr: string;
  study_streak: number;
  notes: string;
};

export type EnglishMockTest = {
  id: number;
  exam_type: "toefl" | "ielts";
  test_kind: string;
  test_name: string;
  taken_at: string;
  reading_score: number;
  listening_score: number;
  speaking_score: number;
  writing_score: number;
  overall_score: number;
  duration_min: number;
  source: string;
  notes: string;
};

export type EnglishPracticeLog = {
  id: number;
  practice_date: string;
  exam_type: string;
  section: string;
  activity_type: string;
  duration_min: number;
  materials: string;
  self_rating: number;
  words_learned: number;
  notes: string;
};

export type EnglishVocabItem = {
  id: number;
  word: string;
  meaning: string;
  example_sentence: string;
  part_of_speech: string;
  exam_tag: string;
  topic: string;
  mastery: string;
  last_reviewed: string | null;
};

export type SectionAverage = { section: string; avg: number; count: number };

export type EnglishOverview = {
  profile: EnglishProfile;
  mock_tests: EnglishMockTest[];
  practice_logs: EnglishPracticeLog[];
  vocab: EnglishVocabItem[];
  stats: {
    practice_hours_week: number;
    practice_sessions_week: number;
    vocab_total: number;
    mock_total: number;
    latest_toefl: number;
    latest_ielts: number;
    toefl_gap: number;
    ielts_gap: number;
    readiness_toefl: number;
    readiness_ielts: number;
  };
  section_averages: { toefl: SectionAverage[]; ielts: SectionAverage[] };
  vocab_mastery: Record<string, number>;
  score_timeline: { date: string; exam: string; overall: number; label: string }[];
  practice_chart: { date: string; minutes: number }[];
  insights: { tone: string; title: string; detail: string; section?: string; exam?: string }[];
  recommended_focus: { toefl_section: string; ielts_section: string };
};

export const englishApi = {
  overview(token: string) {
    return request<EnglishOverview>("/english/overview", token);
  },
  updateProfile(token: string, body: Partial<EnglishProfile>) {
    return request<{ profile: EnglishProfile }>("/english/profile", token, { method: "PATCH", body });
  },
  createMock(token: string, body: Omit<EnglishMockTest, "id" | "overall_score"> & { taken_at: string }) {
    return request<{ mock_test: EnglishMockTest }>("/english/mocks", token, { method: "POST", body });
  },
  deleteMock(token: string, id: number) {
    return request<{ ok: boolean }>(`/english/mocks/${id}`, token, { method: "DELETE" });
  },
  createPractice(token: string, body: Omit<EnglishPracticeLog, "id">) {
    return request<{ practice_log: EnglishPracticeLog }>("/english/practice", token, { method: "POST", body });
  },
  deletePractice(token: string, id: number) {
    return request<{ ok: boolean }>(`/english/practice/${id}`, token, { method: "DELETE" });
  },
  createVocab(token: string, body: Omit<EnglishVocabItem, "id" | "last_reviewed">) {
    return request<{ vocab: EnglishVocabItem }>("/english/vocab", token, { method: "POST", body });
  },
  reviewVocab(token: string, id: number) {
    return request<{ vocab: EnglishVocabItem }>(`/english/vocab/${id}/review`, token, { method: "POST", body: {} });
  },
  deleteVocab(token: string, id: number) {
    return request<{ ok: boolean }>(`/english/vocab/${id}`, token, { method: "DELETE" });
  },
};
