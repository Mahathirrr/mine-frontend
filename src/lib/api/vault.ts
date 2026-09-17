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

export type VaultCategory = "identity" | "education" | "certificate" | "career" | "legal" | "other";

export type VaultFolder = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  file_count: number;
  size_bytes: number;
  updated_at: string | null;
};

export type VaultFile = {
  id: number;
  user_id: number;
  folder_id: number | null;
  name: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  category: VaultCategory;
  starred: boolean;
  created_at: string;
  updated_at: string;
};

export type VaultOverview = {
  folders: VaultFolder[];
  files: VaultFile[];
  stats: {
    total_files: number;
    total_bytes: number;
  };
};

type OverviewParams = {
  folderId?: number;
  q?: string;
  filter?: "starred";
  category?: VaultCategory;
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

export const vaultApi = {
  overview(token: string, params: OverviewParams = {}) {
    const search = new URLSearchParams();
    if (params.folderId) search.set("folder_id", String(params.folderId));
    if (params.q) search.set("q", params.q);
    if (params.filter) search.set("filter", params.filter);
    if (params.category) search.set("category", params.category);
    const qs = search.toString();
    return request<VaultOverview>(`/vault/overview${qs ? `?${qs}` : ""}`, { token });
  },

  createFolder(token: string, body: { name: string; description?: string }) {
    return request<VaultFolder>("/vault/folders", { method: "POST", body, token });
  },

  async upload(token: string, file: File, opts?: { folderId?: number; name?: string; category?: VaultCategory }) {
    const form = new FormData();
    form.append("file", file);
    if (opts?.folderId) form.append("folder_id", String(opts.folderId));
    if (opts?.name) form.append("name", opts.name);
    if (opts?.category) form.append("category", opts.category);

    const res = await fetch(`${API_URL}/vault/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const data = await res.json().catch(() => ({}) as Record<string, unknown>);
    if (!res.ok) {
      throw new ApiError(friendlyApiMessage(res.status, extractErrorMessage(data)), res.status);
    }
    return data as VaultFile;
  },

  downloadUrl(token: string, fileId: number) {
    return `${API_URL}/vault/files/${fileId}/download?token=${encodeURIComponent(token)}`;
  },

  async download(token: string, fileId: number, filename: string) {
    const res = await fetch(`${API_URL}/vault/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}) as Record<string, unknown>);
      throw new ApiError(friendlyApiMessage(res.status, extractErrorMessage(data)), res.status);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  updateFile(token: string, fileId: number, body: { name?: string; folder_id?: number; starred?: boolean }) {
    return request<VaultFile>(`/vault/files/${fileId}`, { method: "PATCH", body, token });
  },

  deleteFile(token: string, fileId: number) {
    return request<{ ok: boolean }>(`/vault/files/${fileId}`, { method: "DELETE", token });
  },
};
