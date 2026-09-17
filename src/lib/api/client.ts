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

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

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

export type User = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
};

export type UserPreferences = {
  onboarding_completed: boolean;
  enabled_menu_items: string[];
  show_template_pages: boolean;
  landing_path: string | null;
};

export type AuthResponse = {
  token: string;
  user: User;
  preferences?: UserPreferences;
};

export type MeResponse = {
  user: User;
  preferences: UserPreferences;
};

export type PreferencesResponse = {
  preferences: UserPreferences;
};

export const api = {
  register(name: string, email: string, password: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
  },
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },
  me(token: string) {
    return request<MeResponse>("/auth/me", { token });
  },

  updatePreferences(
    token: string,
    body: Partial<{
      enabled_menu_items: string[];
      show_template_pages: boolean;
      landing_path: string | null;
      onboarding_completed: boolean;
    }>,
  ) {
    return request<PreferencesResponse>("/auth/preferences", {
      method: "PATCH",
      body,
      token,
    });
  },
};
