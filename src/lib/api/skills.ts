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

async function request<T>(path: string, options: { method?: string; body?: unknown; token: string }): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    throw new ApiError(friendlyApiMessage(res.status, extractErrorMessage(data)), res.status);
  }
  return data as T;
}

export type SkillDomainSummary = {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  min_projects: number;
  sort_order: number;
  roadmap_progress: number;
  project_progress: number;
  overall_progress: number;
  checklist_total: number;
  checklist_checked: number;
  project_count: number;
  valid_project_count: number;
  mastered: boolean;
};

export type SkillChecklistItem = {
  id: number;
  title: string;
  description?: string;
  sort_order: number;
  checked: boolean;
};

export type SkillMaterial = {
  id: number;
  domain_id: number;
  title: string;
  material_type: "file" | "link" | "note";
  url?: string | null;
  original_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number;
  note_content?: string | null;
  sort_order: number;
};

export type SkillTopic = {
  id: number;
  name: string;
  description: string;
  sort_order: number;
  checklist_items: SkillChecklistItem[];
};

export type SkillPhase = {
  id: number;
  name: string;
  description: string;
  sort_order: number;
  topics: SkillTopic[];
};

export type SkillProject = {
  id: number;
  domain_id: number;
  title: string;
  description: string;
  tech_stack: string;
  github_url?: string | null;
  demo_url?: string | null;
  extra_url?: string | null;
  cover_storage_key?: string | null;
  sort_order: number;
};

export type SkillsOverview = {
  domains: SkillDomainSummary[];
};

export type SkillDomainDetail = {
  domain: SkillDomainSummary;
  phases: SkillPhase[];
  materials: SkillMaterial[];
  projects: SkillProject[];
};

export function parseTechStack(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export const skillsApi = {
  overview(token: string) {
    return request<SkillsOverview>("/skills/overview", { token });
  },

  domainDetail(token: string, domainId: number) {
    return request<SkillDomainDetail>(`/skills/domains/${domainId}`, { token });
  },

  createDomain(token: string, body: { name: string; description?: string; color?: string }) {
    return request<{ id: number }>("/skills/domains", { method: "POST", body, token });
  },

  createPhase(token: string, body: { domain_id: number; name: string }) {
    return request<{ id: number }>("/skills/phases", { method: "POST", body, token });
  },

  createTopic(token: string, body: { domain_id: number; phase_id: number; name: string }) {
    return request<{ id: number }>("/skills/topics", { method: "POST", body, token });
  },

  createChecklistItem(token: string, body: { topic_id: number; title: string; description?: string }) {
    return request<{ id: number }>("/skills/checklist", { method: "POST", body, token });
  },

  updateChecklistItem(token: string, id: number, body: { title?: string; description?: string }) {
    return request<{ id: number }>(`/skills/checklist/${id}`, { method: "PATCH", body, token });
  },

  toggleChecklistItem(token: string, id: number) {
    return request<{ checked: boolean }>(`/skills/checklist/${id}/toggle`, { method: "PATCH", token });
  },

  createMaterial(
    token: string,
    body: { domain_id: number; title: string; material_type: "link" | "note"; url?: string; note_content?: string },
  ) {
    return request<SkillMaterial>("/skills/materials", { method: "POST", body, token });
  },

  async uploadMaterial(token: string, domainId: number, file: File, title?: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("domain_id", String(domainId));
    if (title) form.append("title", title);
    const res = await fetch(`${API_URL}/skills/materials/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json().catch(() => ({}) as Record<string, unknown>);
    if (!res.ok) {
      throw new ApiError(friendlyApiMessage(res.status, extractErrorMessage(data)), res.status);
    }
    return data as SkillMaterial;
  },

  downloadMaterialUrl(_token: string, materialId: number) {
    return `${API_URL}/skills/materials/${materialId}/download`;
  },

  async downloadMaterial(token: string, materialId: number, filename: string) {
    const res = await fetch(`${API_URL}/skills/materials/${materialId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new ApiError("Gagal mengunduh materi", res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  deleteMaterial(token: string, id: number) {
    return request<{ ok: boolean }>(`/skills/materials/${id}`, { method: "DELETE", token });
  },

  createProject(
    token: string,
    body: {
      domain_id: number;
      title: string;
      description?: string;
      tech_stack?: string[];
      github_url?: string;
      demo_url?: string;
      extra_url?: string;
    },
  ) {
    return request<SkillProject>("/skills/projects", { method: "POST", body, token });
  },

  updateProject(
    token: string,
    id: number,
    body: Partial<{
      title: string;
      description: string;
      tech_stack: string[];
      github_url: string;
      demo_url: string;
      extra_url: string;
    }>,
  ) {
    return request<SkillProject>(`/skills/projects/${id}`, { method: "PATCH", body, token });
  },

  deleteProject(token: string, id: number) {
    return request<{ ok: boolean }>(`/skills/projects/${id}`, { method: "DELETE", token });
  },

  async uploadProjectCover(token: string, projectId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/skills/projects/${projectId}/cover`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json().catch(() => ({}) as Record<string, unknown>);
    if (!res.ok) {
      throw new ApiError(friendlyApiMessage(res.status, extractErrorMessage(data)), res.status);
    }
    return data as SkillProject;
  },
};
