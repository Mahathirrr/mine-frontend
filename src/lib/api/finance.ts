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

export type FinanceAccountType = "cash" | "bank" | "ewallet";
export type FinanceCategoryType = "expense" | "income";
export type FinanceTxType = "expense" | "income" | "transfer";
export type FinanceGoalStatus = "active" | "completed" | "paused";

export type FinanceAccount = {
  id: number;
  user_id: number;
  name: string;
  account_type: FinanceAccountType;
  currency: string;
  balance: number;
  color: string | null;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FinanceCategory = {
  id: number;
  user_id: number;
  name: string;
  category_type: FinanceCategoryType;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
};

export type FinanceTransaction = {
  id: number;
  user_id: number;
  account_id: number;
  category_id: number | null;
  transaction_type: FinanceTxType;
  amount: number;
  currency: string;
  title: string;
  merchant: string | null;
  notes: string | null;
  transaction_date: string;
  transfer_to_account_id: number | null;
  created_at: string;
  updated_at: string;
};

export type FinanceBudgetRow = {
  id: number;
  category_id: number;
  category_name: string;
  month_key: string;
  amount_limit: number;
  spent: number;
  remaining: number;
  percent_used: number;
  is_flexible: boolean;
  is_over: boolean;
};

export type FinanceGoal = {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline: string | null;
  color: string | null;
  status: FinanceGoalStatus;
  created_at: string;
  updated_at: string;
};

export type FinanceInsight = {
  id: string;
  type: string;
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
};

export type FinanceStats = {
  total_balance: number;
  month_income: number;
  month_expense: number;
  month_net: number;
  prev_month_income: number;
  prev_month_expense: number;
  savings_rate: number;
  transaction_count: number;
};

export type FinancePlanning = {
  subscription_due_week_idr: number;
  subscription_monthly_idr: number;
  subscription_overdue_count: number;
  projected_after_subs: number;
};

export type SpendingByCategory = {
  category_id: number;
  category_name: string;
  color: string | null;
  amount: number;
};

export type CashFlowMonth = {
  month_key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
};

export type FinanceOverviewResponse = {
  month_key: string;
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  recent_transactions: FinanceTransaction[];
  stats: FinanceStats;
  spending_by_category: SpendingByCategory[];
  cash_flow: CashFlowMonth[];
  budgets: FinanceBudgetRow[];
  goals: FinanceGoal[];
  insights: FinanceInsight[];
  planning: FinancePlanning;
};

export type CreateTransactionBody = {
  account_id: number;
  category_id?: number | null;
  transaction_type: FinanceTxType;
  amount: number;
  currency?: string;
  title: string;
  merchant?: string | null;
  notes?: string | null;
  transaction_date: string;
  transfer_to_account_id?: number | null;
};

export type CreateBudgetBody = {
  category_id: number;
  month_key: string;
  amount_limit: number;
  is_flexible?: boolean;
};

export type CreateGoalBody = {
  name: string;
  target_amount: number;
  current_amount?: number;
  currency?: string;
  deadline?: string | null;
  color?: string | null;
  status?: FinanceGoalStatus;
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

export const financeApi = {
  overview(token: string, month?: string) {
    const q = month ? `?month=${encodeURIComponent(month)}` : "";
    return request<FinanceOverviewResponse>(`/finance/overview${q}`, token);
  },
  listTransactions(
    token: string,
    params?: { month?: string; type?: string; category_id?: number; account_id?: number },
  ) {
    const search = new URLSearchParams();
    if (params?.month) search.set("month", params.month);
    if (params?.type) search.set("type", params.type);
    if (params?.category_id) search.set("category_id", String(params.category_id));
    if (params?.account_id) search.set("account_id", String(params.account_id));
    const q = search.toString() ? `?${search.toString()}` : "";
    return request<{ transactions: FinanceTransaction[] }>(`/finance/transactions${q}`, token);
  },
  async createTransaction(token: string, body: CreateTransactionBody) {
    const res = await request<{ transaction: FinanceTransaction }>("/finance/transactions", token, {
      method: "POST",
      body,
    });
    return res.transaction;
  },
  async updateTransaction(token: string, id: number, body: Partial<CreateTransactionBody>) {
    const res = await request<{ transaction: FinanceTransaction }>(`/finance/transactions/${id}`, token, {
      method: "PATCH",
      body,
    });
    return res.transaction;
  },
  deleteTransaction(token: string, id: number) {
    return request<{ ok: boolean }>(`/finance/transactions/${id}`, token, { method: "DELETE" });
  },
  async createBudget(token: string, body: CreateBudgetBody) {
    const res = await request<{ budget: unknown }>("/finance/budgets", token, { method: "POST", body });
    return res.budget;
  },
  async updateBudget(token: string, id: number, body: { amount_limit?: number; is_flexible?: boolean }) {
    const res = await request<{ budget: unknown }>(`/finance/budgets/${id}`, token, { method: "PATCH", body });
    return res.budget;
  },
  deleteBudget(token: string, id: number) {
    return request<{ ok: boolean }>(`/finance/budgets/${id}`, token, { method: "DELETE" });
  },
  async createGoal(token: string, body: CreateGoalBody) {
    const res = await request<{ goal: FinanceGoal }>("/finance/goals", token, { method: "POST", body });
    return res.goal;
  },
  async updateGoal(token: string, id: number, body: Partial<CreateGoalBody>) {
    const res = await request<{ goal: FinanceGoal }>(`/finance/goals/${id}`, token, { method: "PATCH", body });
    return res.goal;
  },
  deleteGoal(token: string, id: number) {
    return request<{ ok: boolean }>(`/finance/goals/${id}`, token, { method: "DELETE" });
  },
};
