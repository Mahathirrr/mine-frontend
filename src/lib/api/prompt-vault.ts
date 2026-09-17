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

export type PromptCategory = "coding" | "writing" | "career" | "learning" | "research" | "general";

export type PromptVaultItem = {
  id: number;
  user_id: number;
  category: PromptCategory;
  title: string;
  purpose: string;
  content: string;
  ai_target: string | null;
  tags: string;
  starred: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PromptCategoryMeta = {
  slug: PromptCategory;
  label: string;
  description: string;
  count: number;
};

export type PromptVaultOverview = {
  categories: PromptCategoryMeta[];
  prompts: PromptVaultItem[];
  stats: { total: number; starred: number };
  ai_targets: string[];
};

type OverviewParams = {
  category?: string;
  q?: string;
  filter?: "starred";
  aiTarget?: string;
};

async function request<T>(path: string, options: { method?: string; body?: unknown; token: string }): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.token}`,
  };

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    throw new ApiError(friendlyApiMessage(res.status, extractErrorMessage(data)), res.status);
  }
  return data as T;
}

export const promptVaultApi = {
  overview(token: string, params: OverviewParams = {}) {
    const search = new URLSearchParams();
    if (params.category && params.category !== "all") search.set("category", params.category);
    if (params.q) search.set("q", params.q);
    if (params.filter) search.set("filter", params.filter);
    if (params.aiTarget) search.set("ai_target", params.aiTarget);
    const qs = search.toString();
    return request<PromptVaultOverview>(`/prompts/overview${qs ? `?${qs}` : ""}`, { token });
  },

  create(
    token: string,
    body: {
      category: PromptCategory;
      title: string;
      purpose?: string;
      content: string;
      ai_target?: string | null;
      tags?: string;
      starred?: boolean;
    },
  ) {
    return request<PromptVaultItem>("/prompts", { method: "POST", body, token });
  },

  update(
    token: string,
    id: number,
    body: Partial<{
      category: PromptCategory;
      title: string;
      purpose: string;
      content: string;
      ai_target: string | null;
      tags: string;
      starred: boolean;
    }>,
  ) {
    return request<PromptVaultItem>(`/prompts/${id}`, { method: "PATCH", body, token });
  },

  delete(token: string, id: number) {
    return request<{ ok: boolean }>(`/prompts/${id}`, { method: "DELETE", token });
  },

  duplicate(token: string, id: number) {
    return request<PromptVaultItem>(`/prompts/${id}/duplicate`, { method: "POST", token });
  },
};
