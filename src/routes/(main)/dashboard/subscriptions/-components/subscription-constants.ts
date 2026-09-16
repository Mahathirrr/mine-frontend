import type { BillingCycle, SubscriptionCategory, SubscriptionStatus } from "@/lib/api/subscriptions";

export const SUBSCRIPTION_CATEGORY_LABEL: Record<SubscriptionCategory, string> = {
  ai: "AI & Tools",
  telecom: "Pulsa & Data",
  cloud: "Cloud & Storage",
  productivity: "Produktivitas",
  entertainment: "Hiburan",
  finance: "Keuangan",
  utility: "Utilitas",
  other: "Lainnya",
};

export const SUBSCRIPTION_CATEGORY_ORDER: SubscriptionCategory[] = [
  "ai",
  "telecom",
  "cloud",
  "productivity",
  "entertainment",
  "finance",
  "utility",
  "other",
];

export const BILLING_CYCLE_LABEL: Record<BillingCycle, string> = {
  weekly: "Mingguan",
  monthly: "Bulanan",
  quarterly: "3 bulan",
  yearly: "Tahunan",
  custom: "Kustom",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Aktif",
  paused: "Dijeda",
  cancelled: "Berhenti",
};

export const SUBSCRIPTION_STATUS_TONE: Record<SubscriptionStatus, "emerald" | "amber" | "slate"> = {
  active: "emerald",
  paused: "amber",
  cancelled: "slate",
};

export const CATEGORY_COLORS: Record<SubscriptionCategory, string> = {
  ai: "#7c3aed",
  telecom: "#ef4444",
  cloud: "#4285f4",
  productivity: "#0ea5e9",
  entertainment: "#1db954",
  finance: "#f59e0b",
  utility: "#64748b",
  other: "#94a3b8",
};

export const PRESET_COLORS = [
  "#7c3aed",
  "#10a37f",
  "#4285f4",
  "#ef4444",
  "#1db954",
  "#f59e0b",
  "#0ea5e9",
  "#ec4899",
  "#64748b",
];
