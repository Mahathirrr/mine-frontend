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

export type SubscriptionStatus = "active" | "paused" | "cancelled";

export type SubscriptionCategory =
  | "ai"
  | "telecom"
  | "cloud"
  | "productivity"
  | "entertainment"
  | "finance"
  | "utility"
  | "other";

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

export type Subscription = {
  id: number;
  user_id: number;
  name: string;
  category: SubscriptionCategory;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  billing_interval_days: number | null;
  next_due_date: string;
  start_date: string | null;
  status: SubscriptionStatus;
  auto_pay: boolean;
  remind_days_before: number;
  payment_url: string | null;
  notes: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPayment = {
  id: number;
  user_id: number;
  subscription_id: number;
  paid_at: string;
  amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
};

export type SubscriptionStats = {
  total: number;
  active: number;
  paused: number;
  cancelled: number;
  due_today: number;
  due_this_week: number;
  due_this_month: number;
  overdue: number;
  needs_reminder: number;
  auto_pay_count: number;
  monthly_burn_idr: number;
  monthly_burn_by_currency: Record<string, number>;
};

export type SubscriptionOverviewResponse = {
  subscriptions: Subscription[];
  stats: SubscriptionStats;
  by_category: Record<string, number>;
};

export type CreateSubscriptionBody = {
  name: string;
  category?: SubscriptionCategory;
  amount: number;
  currency?: string;
  billing_cycle?: BillingCycle;
  billing_interval_days?: number | null;
  next_due_date: string;
  start_date?: string | null;
  status?: SubscriptionStatus;
  auto_pay?: boolean;
  remind_days_before?: number;
  payment_url?: string | null;
  notes?: string | null;
  color?: string | null;
};

export type UpdateSubscriptionBody = Partial<CreateSubscriptionBody>;

export type MarkPaidBody = {
  paid_at?: string;
  notes?: string | null;
  amount?: number;
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

export const subscriptionsApi = {
  overview(token: string) {
    return request<SubscriptionOverviewResponse>("/subscriptions/overview", token);
  },
  async create(token: string, body: CreateSubscriptionBody) {
    const res = await request<{ subscription: Subscription }>("/subscriptions", token, {
      method: "POST",
      body,
    });
    return res.subscription;
  },
  async update(token: string, id: number, body: UpdateSubscriptionBody) {
    const res = await request<{ subscription: Subscription }>(`/subscriptions/${id}`, token, {
      method: "PATCH",
      body,
    });
    return res.subscription;
  },
  delete(token: string, id: number) {
    return request<{ ok: boolean }>(`/subscriptions/${id}`, token, { method: "DELETE" });
  },
  async markPaid(token: string, id: number, body: MarkPaidBody = {}) {
    const res = await request<{ subscription: Subscription; payment: SubscriptionPayment }>(
      `/subscriptions/${id}/mark-paid`,
      token,
      { method: "POST", body },
    );
    return res;
  },
  listPayments(token: string, id: number) {
    return request<{ payments: SubscriptionPayment[] }>(`/subscriptions/${id}/payments`, token);
  },
};
