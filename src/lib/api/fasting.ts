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

export type FastingProfile = {
  id: number;
  protocol_slug: string;
  goal_hours: number;
  eating_window_hours: number;
  height_cm: number;
  start_weight_kg: number;
  target_weight_kg: number;
  weekly_goal_days: number;
  current_streak: number;
  longest_streak: number;
  notifications_enabled: boolean;
  notes: string;
};

export type FastingSession = {
  id: number;
  protocol_slug: string;
  goal_hours: number;
  started_at: string;
  ended_at: string | null;
  status: string;
  notes: string;
};

export type FastingWeightLog = {
  id: number;
  logged_at: string;
  weight_kg: number;
  body_fat_pct: number | null;
  waist_cm: number | null;
  note: string;
};

export type FastingMealLog = {
  id: number;
  eaten_at: string;
  meal_type: string;
  title: string;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg?: number;
  in_eating_window: boolean;
  notes: string;
};

export type FastingFoodPreset = {
  id: number;
  name: string;
  serving_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number;
  is_system: boolean;
};

export type FastingDayChartPoint = {
  date: string;
  fasting_hours: number;
  eating_hours: number;
  met_goal: boolean;
  continued?: boolean;
  started_here?: boolean;
  ended_here?: boolean;
  capped_full_day?: boolean;
};

export type FastingProtocol = {
  slug: string;
  label: string;
  goal_hours: number;
  eating_hours: number;
  color: string;
};

export type FastingZone = {
  slug: string;
  label: string;
  icon: string;
  start_hour: number;
  end_hour: number;
  description: string;
};

export type FastingOverview = {
  profile: FastingProfile;
  protocols: FastingProtocol[];
  active_session: FastingSession | null;
  sessions: FastingSession[];
  weight_logs: FastingWeightLog[];
  meal_logs: FastingMealLog[];
  food_presets: FastingFoodPreset[];
  stats: {
    total_fasts: number;
    total_hours: number;
    longest_hours: number;
    average_hours: number;
    current_streak: number;
    longest_streak: number;
  };
  timer: {
    elapsed_hours: number;
    progress: number;
    goal_end_at: string | null;
    is_fasting: boolean;
  };
  zone: {
    zone: FastingZone;
    elapsed_hours: number;
    remaining_hours: number;
    zone_progress: number;
    all_zones: FastingZone[];
  } | null;
  fasting_chart: FastingDayChartPoint[];
  calendar_heatmap: FastingDayChartPoint[];
  weight_chart: { date: string; weight_kg: number }[];
  week_comparison: {
    this_week_fasting_hours: number;
    last_week_fasting_hours: number;
    this_week_eating_hours: number;
    last_week_eating_hours: number;
  };
  badges: { id: string; label: string; earned: boolean; threshold: number }[];
  insights: { tone: string; title: string; detail: string }[];
  weight_summary: {
    start_kg: number;
    current_kg: number;
    target_kg: number;
    delta_kg: number;
  };
};

export const fastingApi = {
  overview(token: string) {
    return request<FastingOverview>("/fasting/overview", token);
  },
  updateProfile(token: string, body: Partial<FastingProfile>) {
    return request<{ profile: FastingProfile }>("/fasting/profile", token, { method: "PATCH", body });
  },
  startSession(
    token: string,
    body?: { started_at?: string; protocol_slug?: string; goal_hours?: number; notes?: string },
  ) {
    return request<{ session: FastingSession }>("/fasting/sessions/start", token, { method: "POST", body: body ?? {} });
  },
  endSession(token: string, id: number, body?: { ended_at?: string; status?: string }) {
    return request<{ session: FastingSession }>(`/fasting/sessions/${id}/end`, token, {
      method: "PATCH",
      body: body ?? {},
    });
  },
  deleteSession(token: string, id: number) {
    return request<{ ok: boolean }>(`/fasting/sessions/${id}`, token, { method: "DELETE" });
  },
  createWeight(token: string, body: Omit<FastingWeightLog, "id">) {
    return request<{ weight_log: FastingWeightLog }>("/fasting/weight", token, { method: "POST", body });
  },
  deleteWeight(token: string, id: number) {
    return request<{ ok: boolean }>(`/fasting/weight/${id}`, token, { method: "DELETE" });
  },
  createMeal(token: string, body: Omit<FastingMealLog, "id"> & { eaten_at: string }) {
    return request<{ meal_log: FastingMealLog }>("/fasting/meals", token, { method: "POST", body });
  },
  deleteMeal(token: string, id: number) {
    return request<{ ok: boolean }>(`/fasting/meals/${id}`, token, { method: "DELETE" });
  },
  createPreset(token: string, body: Omit<FastingFoodPreset, "id" | "is_system">) {
    return request<{ food_preset: FastingFoodPreset }>("/fasting/presets", token, { method: "POST", body });
  },
  deletePreset(token: string, id: number) {
    return request<{ ok: boolean }>(`/fasting/presets/${id}`, token, { method: "DELETE" });
  },
};
