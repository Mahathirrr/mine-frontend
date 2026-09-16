import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import type { FinanceCategory, FinanceTransaction, FinanceTxType } from "@/lib/api/finance";
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
  if (!id) return "—";
  return categories.find((c) => c.id === id)?.name ?? "—";
}

export function accountName(accounts: { id: number; name: string }[], id: number): string {
  return accounts.find((a) => a.id === id)?.name ?? "—";
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
