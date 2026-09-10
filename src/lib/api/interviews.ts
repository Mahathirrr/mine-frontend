import { ApiError, friendlyApiMessage } from "@/lib/api/api-error";

function resolveApiUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw !== undefined && raw !== "") return raw.replace(/\/$/, "");
  const fallback = import.meta.env.PROD ? "/api" : "http://localhost:8080/api";
  return fallback.replace(/\/$/, "");
}

const API_URL = resolveApiUrl();

function extractErrorMessage(data: Record<string, unknown>): string {
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  return "";
}

export type AppStatus = "wishlist" | "applied" | "screening" | "interviewing" | "offer" | "rejected" | "withdrawn";

export type WorkType = "remote" | "hybrid" | "onsite" | "unknown";

export type RoundStatus = "scheduled" | "completed" | "cancelled";

export type RoundOutcome = "pending" | "passed" | "failed" | "skipped";

export type RoundType =
  | "phone"
  | "hr"
  | "technical"
  | "coding"
  | "system_design"
  | "behavioral"
  | "assignment"
  | "final"
  | "other";

export type QuestionCategory = "behavioral" | "technical" | "system_design" | "coding" | "company" | "salary" | "other";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type InterviewApplication = {
  id: number;
  user_id: number;
  company: string;
  role_title: string;
  job_url: string | null;
  location: string | null;
  work_type: WorkType;
  status: AppStatus;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  applied_at: string | null;
  notes: string | null;
  priority: number;
  prep_pack_slug: string | null;
  created_at: string;
  updated_at: string;
};

export type InterviewRound = {
  id: number;
  application_id: number;
  title: string;
  round_type: RoundType;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meeting_url: string | null;
  status: RoundStatus;
  outcome: RoundOutcome;
  interviewer: string | null;
  feedback: string | null;
  self_rating: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type InterviewApplicationWithRounds = InterviewApplication & {
  rounds: InterviewRound[];
};

export type InterviewQuestion = {
  id: number;
  user_id: number;
  application_id: number | null;
  category: QuestionCategory;
  question: string;
  answer_notes: string | null;
  difficulty: QuestionDifficulty;
  is_practiced: boolean;
  section_label: string | null;
  tech_group: string | null;
  sort_order: number;
  source_guide: string | null;
  source_key: string | null;
  created_at: string;
  updated_at: string;
};

export type PrepGlossarySection = {
  id: string;
  title: string;
  kind: "glossary";
  entries: { term: string; definition: string }[];
};

export type PrepScriptsSection = {
  id: string;
  title: string;
  kind: "scripts";
  scripts: { title: string; body: string }[];
};

export type PrepQASection = {
  id: string;
  title: string;
  kind: "qa";
  items: { number: number; question: string; answer: string }[];
};

export type PrepSection = PrepGlossarySection | PrepScriptsSection | PrepQASection;

export type InterviewPrepGuide = {
  id: number;
  user_id: number;
  application_id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  guide_type: "company" | "hrd" | "technical";
  sections: PrepSection[];
  created_at: string;
  updated_at: string;
};

export type InterviewStats = {
  total: number;
  active: number;
  offers: number;
  rejected: number;
  upcoming: number;
  by_status: Partial<Record<AppStatus, number>>;
  questions: number;
  practiced_qs: number;
};

export type PrepPackCatalogItem = {
  slug: string;
  title: string;
  company: string;
  role_title: string;
  description: string;
  imported: boolean;
};

export type InterviewOverviewResponse = {
  applications: InterviewApplicationWithRounds[];
  questions: InterviewQuestion[];
  prep_guides: InterviewPrepGuide[];
  stats: InterviewStats;
};

export type CreateApplicationBody = {
  company: string;
  role_title: string;
  job_url?: string | null;
  location?: string | null;
  work_type?: WorkType;
  status?: AppStatus;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  applied_at?: string | null;
  notes?: string | null;
  priority?: number;
};

export type UpdateApplicationBody = Partial<CreateApplicationBody>;

export type CreateRoundBody = {
  title: string;
  round_type?: RoundType;
  scheduled_at?: string | null;
  duration_minutes?: number | null;
  meeting_url?: string | null;
  status?: RoundStatus;
  outcome?: RoundOutcome;
  interviewer?: string | null;
  feedback?: string | null;
  self_rating?: number | null;
};

export type UpdateRoundBody = Partial<CreateRoundBody & { sort_order?: number }>;

export type CreateQuestionBody = {
  application_id?: number | null;
  category?: QuestionCategory;
  question: string;
  answer_notes?: string | null;
  difficulty?: QuestionDifficulty;
  is_practiced?: boolean;
  section_label?: string | null;
  tech_group?: string | null;
};

export type UpdateQuestionBody = Partial<CreateQuestionBody>;

async function request<T>(path: string, token: string, options: { method?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    const message = extractErrorMessage(data);
    throw new ApiError(friendlyApiMessage(res.status, message), res.status);
  }
  return data as T;
}

export const interviewsApi = {
  overview(token: string) {
    return request<InterviewOverviewResponse>("/interviews/overview", token);
  },
  listPrepPacks(token: string) {
    return request<{ packs: PrepPackCatalogItem[] }>("/interviews/prep-packs", token);
  },
  importPrepPack(token: string, slug: string) {
    return request<{
      ok: boolean;
      already_exists: boolean;
      application_id: number;
      pack_slug: string;
      guides?: number;
      questions?: number;
      message?: string;
    }>(`/interviews/prep-packs/${slug}/import`, token, { method: "POST" });
  },
  async createApplication(token: string, body: CreateApplicationBody) {
    const res = await request<{ application: InterviewApplication }>("/interviews/applications", token, {
      method: "POST",
      body,
    });
    return res.application;
  },
  async updateApplication(token: string, id: number, body: UpdateApplicationBody) {
    const res = await request<{ application: InterviewApplication }>(`/interviews/applications/${id}`, token, {
      method: "PATCH",
      body,
    });
    return res.application;
  },
  deleteApplication(token: string, id: number) {
    return request<{ ok: boolean }>(`/interviews/applications/${id}`, token, { method: "DELETE" });
  },
  async createRound(token: string, applicationId: number, body: CreateRoundBody) {
    const res = await request<{ round: InterviewRound }>(`/interviews/applications/${applicationId}/rounds`, token, {
      method: "POST",
      body,
    });
    return res.round;
  },
  async updateRound(token: string, roundId: number, body: UpdateRoundBody) {
    const res = await request<{ round: InterviewRound }>(`/interviews/rounds/${roundId}`, token, {
      method: "PATCH",
      body,
    });
    return res.round;
  },
  deleteRound(token: string, roundId: number) {
    return request<{ ok: boolean }>(`/interviews/rounds/${roundId}`, token, { method: "DELETE" });
  },
  async createQuestion(token: string, body: CreateQuestionBody) {
    const res = await request<{ question: InterviewQuestion }>("/interviews/questions", token, {
      method: "POST",
      body,
    });
    return res.question;
  },
  async updateQuestion(token: string, questionId: number, body: UpdateQuestionBody) {
    const res = await request<{ question: InterviewQuestion }>(`/interviews/questions/${questionId}`, token, {
      method: "PATCH",
      body,
    });
    return res.question;
  },
  deleteQuestion(token: string, questionId: number) {
    return request<{ ok: boolean }>(`/interviews/questions/${questionId}`, token, { method: "DELETE" });
  },
};
