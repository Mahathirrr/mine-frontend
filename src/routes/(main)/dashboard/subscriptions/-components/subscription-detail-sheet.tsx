"use client";

import * as React from "react";

import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CheckCircle2, ExternalLink, Loader2, Pencil, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Subscription, SubscriptionPayment } from "@/lib/api/subscriptions";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { BILLING_CYCLE_LABEL, SUBSCRIPTION_CATEGORY_LABEL, SUBSCRIPTION_STATUS_LABEL } from "./subscription-constants";
import {
  billingCycleShort,
  dueLabel,
  formatAmount,
  formatDueDate,
  isReminderWindow,
  monthlyEquivalent,
  subscriptionAccent,
} from "./subscription-utils";

type SubscriptionDetailSheetProps = {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (sub: Subscription) => void;
  onMarkPaid: (sub: Subscription) => Promise<void>;
  markingPaid?: boolean;
};

function normalizeHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export function SubscriptionDetailSheet({
  subscription,
  open,
  onOpenChange,
  onEdit,
  onMarkPaid,
  markingPaid,
}: SubscriptionDetailSheetProps) {
  const token = useAuthStore((s) => s.token);
  const [payments, setPayments] = React.useState<SubscriptionPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = React.useState(false);

  React.useEffect(() => {
    if (!open || !subscription || !token) {
      setPayments([]);
      return;
    }

    let cancelled = false;
    setLoadingPayments(true);
    subscriptionsApi
      .listPayments(token, subscription.id)
      .then((res) => {
        if (!cancelled) setPayments(res.payments);
      })
      .catch(() => {
        if (!cancelled) setPayments([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPayments(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, subscription, token]);

  if (!subscription) return null;

  const due = dueLabel(subscription.next_due_date);
  const monthly = monthlyEquivalent(
    subscription.amount,
    subscription.billing_cycle,
    subscription.billing_interval_days,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <div className="flex items-start gap-3">
            <span
              className="mt-1 size-3 shrink-0 rounded-full"
              style={{ backgroundColor: subscriptionAccent(subscription) }}
            />
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl">{subscription.name}</SheetTitle>
              <SheetDescription className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{SUBSCRIPTION_CATEGORY_LABEL[subscription.category]}</Badge>
                <Badge variant="outline">{SUBSCRIPTION_STATUS_LABEL[subscription.status]}</Badge>
                {subscription.auto_pay ? (
                  <Badge variant="outline" className="gap-1">
                    <Zap className="size-3 fill-primary text-primary" />
                    Auto-pay
                  </Badge>
                ) : null}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-muted-foreground text-sm">Tagihan berikutnya</p>
            <p className="mt-1 font-semibold text-2xl tabular-nums tracking-tight">
              {formatAmount(subscription.amount, subscription.currency)}
              <span className="text-muted-foreground text-base font-normal">
                {billingCycleShort(subscription.billing_cycle, subscription.billing_interval_days)}
              </span>
            </p>
            <p className="mt-2 text-sm">
              <span className="font-medium">{formatDueDate(subscription.next_due_date)}</span>
              <span className="text-muted-foreground"> · {due.text}</span>
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              Setara ~{formatAmount(Math.round(monthly), subscription.currency)}/bulan ·{" "}
              {BILLING_CYCLE_LABEL[subscription.billing_cycle]}
            </p>
            {isReminderWindow(subscription) ? (
              <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-800 text-sm dark:text-amber-200">
                Pengingat aktif: jatuh tempo dalam {subscription.remind_days_before} hari ke depan
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {subscription.status === "active" ? (
              <Button size="sm" disabled={markingPaid} onClick={() => onMarkPaid(subscription)}>
                {markingPaid ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Tandai sudah bayar
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => onEdit(subscription)}>
              <Pencil className="size-4" />
              Edit
            </Button>
            {subscription.payment_url ? (
              <Button size="sm" variant="outline" asChild>
                <a href={normalizeHref(subscription.payment_url)} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Bayar
                </a>
              </Button>
            ) : null}
          </div>

          {subscription.notes ? (
            <div>
              <p className="mb-1 font-medium text-sm">Catatan</p>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{subscription.notes}</p>
            </div>
          ) : null}

          <Separator />

          <div>
            <p className="mb-3 font-medium text-sm">Riwayat pembayaran</p>
            {loadingPayments ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="size-4 animate-spin" />
                Memuat…
              </div>
            ) : payments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada riwayat. Tandai sudah bayar untuk mencatat.</p>
            ) : (
              <ul className="space-y-3">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5">
                    <div>
                      <p className="font-medium text-sm tabular-nums">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {format(parseISO(payment.paid_at.slice(0, 10)), "d MMM yyyy", { locale: idLocale })}
                      </p>
                      {payment.notes ? <p className="mt-1 text-muted-foreground text-xs">{payment.notes}</p> : null}
                    </div>
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
