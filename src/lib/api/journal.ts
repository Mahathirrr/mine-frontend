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

export type JournalMood = "great" | "good" | "okay" | "low" | "stuck";
export type JournalStatus = "draft" | "published";

export type JournalTopic = {
  id: number;
  user_id: number;
  title: string;
  prompt: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type JournalEntry = {
  id: number;
  user_id: number;
  topic_id: number | null;
  title: string;
  content: string;
  word_count: number;
  mood: JournalMood | null;
  status: JournalStatus;
  created_at: string;
  updated_at: string;
};

export type JournalStats = {
  total_entries: number;
  published_entries: number;
  total_words: number;
  active_topics: number;
  total_topics: number;
};

export type JournalOverviewResponse = {
  topics: JournalTopic[];
  entries: JournalEntry[];
  stats: JournalStats;
};

export type CreateTopicBody = {
  title: string;
  prompt?: string | null;
  color?: string | null;
  is_active?: boolean;
};

export type CreateEntryBody = {
  topic_id?: number | null;
  title?: string;
  content?: string;
  mood?: JournalMood | null;
  status?: JournalStatus;
};

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

export const journalApi = {
  overview(token: string) {
    return request<JournalOverviewResponse>("/journal/overview", token);
  },
  spin(token: string) {
    return request<{ topic: JournalTopic }>("/journal/spin", token, { method: "POST" });
  },
  async createTopic(token: string, body: CreateTopicBody) {
    const res = await request<{ topic: JournalTopic }>("/journal/topics", token, { method: "POST", body });
    return res.topic;
  },
  async updateTopic(token: string, id: number, body: Partial<CreateTopicBody>) {
    const res = await request<{ topic: JournalTopic }>(`/journal/topics/${id}`, token, { method: "PATCH", body });
    return res.topic;
  },
  deleteTopic(token: string, id: number) {
    return request<{ ok: boolean }>(`/journal/topics/${id}`, token, { method: "DELETE" });
  },
  listEntries(token: string, params?: { topic_id?: number; status?: JournalStatus }) {
    const search = new URLSearchParams();
    if (params?.topic_id) search.set("topic_id", String(params.topic_id));
    if (params?.status) search.set("status", params.status);
    const q = search.toString() ? `?${search.toString()}` : "";
    return request<{ entries: JournalEntry[] }>(`/journal/entries${q}`, token);
  },
  getEntry(token: string, id: number) {
    return request<{ entry: JournalEntry }>(`/journal/entries/${id}`, token);
  },
  async createEntry(token: string, body: CreateEntryBody) {
    const res = await request<{ entry: JournalEntry }>("/journal/entries", token, { method: "POST", body });
    return res.entry;
  },
  async updateEntry(token: string, id: number, body: Partial<CreateEntryBody>) {
    const res = await request<{ entry: JournalEntry }>(`/journal/entries/${id}`, token, { method: "PATCH", body });
    return res.entry;
  },
  deleteEntry(token: string, id: number) {
    return request<{ ok: boolean }>(`/journal/entries/${id}`, token, { method: "DELETE" });
  },
};
