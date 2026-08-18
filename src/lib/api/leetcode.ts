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

export type ProblemList = "nc75" | "nc150";
export type ProblemStatus = "todo" | "in_progress" | "solved";

export type LeetCodeProblem = {
  id: number;
  leetcode_id: number;
  slug: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  is_premium: boolean;
  sort_order: number;
  status: ProblemStatus;
  notes: string | null;
};

export type LeetCodeStats = {
  total: number;
  solved: number;
  in_progress: number;
  todo: number;
};

export type BucketStats = { total: number; solved: number };

export type CategoryStat = {
  name: string;
  total: number;
  solved: number;
  percent: number;
};

export type LeetCodeProblemsResponse = {
  list: ProblemList;
  problems: LeetCodeProblem[];
  stats: LeetCodeStats;
  percent: number;
  categories: CategoryStat[];
  by_category: Record<string, BucketStats>;
  by_difficulty: Record<string, BucketStats>;
  activity: ActivityDay[];
};

export type ActivityDay = { day: string; count: number };

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
    const message = typeof data.error === "string" ? data.error : typeof data.message === "string" ? data.message : "";
    throw new ApiError(friendlyApiMessage(res.status, message), res.status);
  }
  return data as T;
}

export const leetcodeApi = {
  listProblems(token: string, list: ProblemList = "nc75") {
    return request<LeetCodeProblemsResponse>(`/leetcode/problems?list=${list}`, token);
  },
  updateProgress(token: string, leetcodeId: number, body: { status: ProblemStatus; notes?: string | null }) {
    return request<{ id: number; leetcode_id: number; status: ProblemStatus; notes: string | null }>(
      `/leetcode/problems/${leetcodeId}/progress`,
      token,
      { method: "PATCH", body },
    );
  },
};

export function leetcodeUrl(slug: string) {
  return `https://leetcode.com/problems/${slug}/`;
}

export const LIST_LABEL: Record<ProblemList, string> = {
  nc75: "NeetCode 75",
  nc150: "NeetCode 150",
};
