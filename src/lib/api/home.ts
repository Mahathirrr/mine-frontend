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

async function getJson<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    throw new ApiError(friendlyApiMessage(res.status, extractErrorMessage(data)), res.status);
  }
  return data as T;
}

export type HomeAlert = {
  id: string;
  severity: "info" | "warning" | "success";
  title: string;
  body: string;
  href: string;
};

export type HomeOverview = {
  generated_at: string;
  summary: {
    attention: number;
    tasks_open: number;
    events_week: number;
    active_pipelines: number;
  };
  modules: Record<string, Record<string, number | boolean | string>>;
  alerts: HomeAlert[];
};

export const homeApi = {
  overview(token: string) {
    return getJson<HomeOverview>("/home/overview", token);
  },
};
