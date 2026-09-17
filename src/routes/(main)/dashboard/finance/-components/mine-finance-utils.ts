import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import type {
  CashFlowMonth,
  FinanceAccount,
  FinanceCategory,
  FinanceStats,
  FinanceTransaction,
  FinanceTxType,
  SpendingByCategory,
} from "@/lib/api/finance";
import { formatCurrency } from "@/lib/utils";

export function formatIDR(amount: number): string {
  return formatCurrency(amount, { currency: "IDR", locale: "id-ID", noDecimals: true });
}

export function formatTxDate(raw: string): string {
  return format(parseISO(raw.slice(0, 10)), "d MMM yyyy", { locale: idLocale });
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function txTypeLabel(type: FinanceTxType): string {
  switch (type) {
    case "expense":
      return "Pengeluaran";
    case "income":
      return "Pemasukan";
    case "transfer":
      return "Transfer";
    default:
      return type;
  }
}

export function txSign(type: FinanceTxType): string {
  if (type === "income") return "+";
  if (type === "expense") return "−";
  return "";
}

export function categoryName(categories: FinanceCategory[], id: number | null): string {
  if (!id) return "-";
  return categories.find((c) => c.id === id)?.name ?? "-";
}

export function accountName(accounts: { id: number; name: string }[], id: number): string {
  return accounts.find((a) => a.id === id)?.name ?? "-";
}

export function expenseCategories(categories: FinanceCategory[]): FinanceCategory[] {
  return categories.filter((c) => c.category_type === "expense");
}

export function incomeCategories(categories: FinanceCategory[]): FinanceCategory[] {
  return categories.filter((c) => c.category_type === "income");
}

export function txAmountClass(type: FinanceTxType): string {
  if (type === "income") return "text-emerald-600 dark:text-emerald-400";
  if (type === "expense") return "text-red-600 dark:text-red-400";
  return "text-blue-600 dark:text-blue-400";
}

export function insightTone(severity: string): string {
  switch (severity) {
    case "danger":
      return "border-red-500/30 bg-red-500/10";
    case "warning":
      return "border-amber-500/30 bg-amber-500/10";
    default:
      return "border-blue-500/30 bg-blue-500/10";
  }
}

export function sortTransactions(rows: FinanceTransaction[]): FinanceTransaction[] {
  return [...rows].sort((a, b) => {
    const da = a.transaction_date.slice(0, 10);
    const db = b.transaction_date.slice(0, 10);
    if (da !== db) return db.localeCompare(da);
    return b.id - a.id;
  });
}

export type DailyFlowPoint = {
  date: string;
  expense: number;
  income: number;
  timestamp: number;
};

export function buildDailyFlowChart(transactions: FinanceTransaction[], monthKey: string): DailyFlowPoint[] {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const map = new Map<number, { expense: number; income: number }>();

  for (let day = 1; day <= daysInMonth; day += 1) {
    map.set(day, { expense: 0, income: 0 });
  }

  for (const tx of transactions) {
    const date = tx.transaction_date.slice(0, 10);
    if (!date.startsWith(monthKey)) continue;
    const day = Number(date.slice(8, 10));
    const row = map.get(day) ?? { expense: 0, income: 0 };
    if (tx.transaction_type === "expense") row.expense += tx.amount;
    if (tx.transaction_type === "income") row.income += tx.amount;
    map.set(day, row);
  }

  return Array.from(map.entries()).map(([day, values]) => {
    const iso = `${monthKey}-${String(day).padStart(2, "0")}T12:00:00.000Z`;
    return {
      date: iso,
      expense: values.expense,
      income: values.income,
      timestamp: Date.parse(iso),
    };
  });
}

export type IncomeBreakdownRow = {
  name: string;
  amount: number;
  percent: number;
};

export function buildIncomeBreakdown(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[],
): IncomeBreakdownRow[] {
  const totals = new Map<number, number>();
  let sum = 0;
  for (const tx of transactions) {
    if (tx.transaction_type !== "income" || !tx.category_id) continue;
    totals.set(tx.category_id, (totals.get(tx.category_id) ?? 0) + tx.amount);
    sum += tx.amount;
  }
  if (sum === 0) return [];

  return [...totals.entries()]
    .map(([categoryId, amount]) => ({
      name: categoryName(categories, categoryId),
      amount,
      percent: (amount / sum) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatPctBadge(value: number | null): { label: string; positive: boolean } | null {
  if (value === null) return null;
  const positive = value >= 0;
  return { label: `${positive ? "+" : ""}${value.toFixed(1)}%`, positive };
}

export type AccountAllocationRow = {
  account: string;
  amount: number;
  key: string;
  percentage: number;
  fill?: string;
};

export function buildAccountAllocation(accounts: FinanceAccount[]): AccountAllocationRow[] {
  const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  if (total === 0) return [];
  return accounts.map((acc) => ({
    account: acc.name,
    amount: acc.balance,
    key: `acc-${acc.id}`,
    percentage: Math.round((acc.balance / total) * 1000) / 10,
    fill: acc.color ?? undefined,
  }));
}

export type CategorySpendingRow = {
  account: string;
  amount: number;
  key: string;
  percentage: number;
  fill?: string;
};

export function buildCategorySpending(rows: SpendingByCategory[]): CategorySpendingRow[] {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  if (total === 0) return [];
  return rows.map((row) => ({
    account: row.category_name,
    amount: row.amount,
    key: `cat-${row.category_id}`,
    percentage: Math.round((row.amount / total) * 1000) / 10,
    fill: row.color ?? undefined,
  }));
}

export function buildCashFlowChartData(cashFlow: CashFlowMonth[]) {
  return cashFlow.map((row) => ({
    month: row.label,
    income: row.income,
    expenses: -row.expense,
  }));
}

export function buildMonthlyExpenseTrend(cashFlow: CashFlowMonth[]) {
  return cashFlow.map((row) => ({
    date: `${row.month_key}-15T12:00:00.000Z`,
    qualified: row.expense,
  }));
}
