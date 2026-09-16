import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import type { BillingCycle, Subscription } from "@/lib/api/subscriptions";
import { formatCurrency } from "@/lib/utils";

export function parseDueDate(raw: string): Date {
  const trimmed = raw.slice(0, 10);
  return parseISO(trimmed);
}

export function formatDueDate(raw: string): string {
  return format(parseDueDate(raw), "d MMM yyyy", { locale: idLocale });
}

export function daysUntilDue(raw: string): number {
  const due = parseDueDate(raw);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function dueLabel(raw: string): { text: string; tone: "default" | "warning" | "danger" | "muted" } {
  const days = daysUntilDue(raw);
  if (days < 0) {
    const late = Math.abs(days);
    return {
      text: late === 1 ? "Terlambat 1 hari" : `Terlambat ${late} hari`,
      tone: "danger",
    };
  }
  if (days === 0) return { text: "Jatuh tempo hari ini", tone: "danger" };
  if (days === 1) return { text: "Besok", tone: "warning" };
  if (days <= 7) return { text: `${days} hari lagi`, tone: "warning" };
  if (days <= 30) return { text: `${days} hari lagi`, tone: "default" };
  return { text: formatDueDate(raw), tone: "muted" };
}

export function isReminderWindow(sub: Subscription): boolean {
  if (sub.status !== "active") return false;
  const days = daysUntilDue(sub.next_due_date);
  return days >= 0 && days <= sub.remind_days_before;
}

export function formatAmount(amount: number, currency: string): string {
  const locale = currency === "IDR" ? "id-ID" : "en-US";
  return formatCurrency(amount, { currency, locale, noDecimals: true });
}

export function monthlyEquivalent(amount: number, cycle: BillingCycle, intervalDays: number | null): number {
  switch (cycle) {
    case "weekly":
      return amount * 4.345;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "yearly":
      return amount / 12;
    case "custom":
      if (intervalDays && intervalDays > 0) return amount * (30.437 / intervalDays);
      return amount;
    default:
      return amount;
  }
}

export function billingCycleShort(cycle: BillingCycle, intervalDays: number | null): string {
  switch (cycle) {
    case "weekly":
      return "/minggu";
    case "monthly":
      return "/bln";
    case "quarterly":
      return "/3 bln";
    case "yearly":
      return "/thn";
    case "custom":
      return intervalDays ? `/${intervalDays} hr` : "/kustom";
    default:
      return "";
  }
}

export function sortByDueDate(a: Subscription, b: Subscription): number {
  const da = parseDueDate(a.next_due_date).getTime();
  const db = parseDueDate(b.next_due_date).getTime();
  if (da !== db) return da - db;
  return a.name.localeCompare(b.name, "id");
}

export function subscriptionAccent(sub: Subscription): string {
  return sub.color ?? "#64748b";
}
