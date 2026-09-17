"use client";

import * as React from "react";

import { cn } from "cn";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  ChevronRight,
  CreditCard,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  CreateSubscriptionBody,
  Subscription,
  SubscriptionCategory,
  SubscriptionOverviewResponse,
} from "@/lib/api/subscriptions";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { useAuthStore } from "@/stores/auth/auth-provider";

import {
  SUBSCRIPTION_CATEGORY_LABEL,
  SUBSCRIPTION_CATEGORY_ORDER,
  SUBSCRIPTION_STATUS_LABEL,
} from "./subscription-constants";
import { SubscriptionDetailSheet } from "./subscription-detail-sheet";
import { SubscriptionFormDialog } from "./subscription-form-dialog";
import {
  billingCycleShort,
  dueLabel,
  formatAmount,
  isReminderWindow,
  monthlyEquivalent,
  sortByDueDate,
  subscriptionAccent,
} from "./subscription-utils";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "amber" | "emerald" | "red" | "violet";
}) {
  const tones = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    red: "text-red-600 dark:text-red-400 bg-red-500/10",
    violet: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 text-left">
        <p className="font-bold text-2xl tabular-nums leading-none tracking-tight">{value}</p>
        <p className="mt-1 text-muted-foreground text-xs">{label}</p>
        {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}

function SubscriptionRow({
  sub,
  onOpen,
  onQuickPay,
  paying,
}: {
  sub: Subscription;
  onOpen: (sub: Subscription) => void;
  onQuickPay: (sub: Subscription) => void;
  paying: boolean;
}) {
  const due = dueLabel(sub.next_due_date);
  const dueToneClass =
    due.tone === "danger"
      ? "text-red-600 dark:text-red-400"
      : due.tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <Item
      variant="outline"
      size="sm"
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={() => onOpen(sub)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(sub);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <ItemMedia>
        <div
          className="grid size-10 place-items-center rounded-lg border text-sm font-semibold text-white"
          style={{ backgroundColor: subscriptionAccent(sub) }}
        >
          {sub.name.slice(0, 1).toUpperCase()}
        </div>
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="flex flex-wrap items-center gap-2">
          {sub.name}
          {sub.auto_pay ? <Zap className="size-3.5 fill-primary text-primary" aria-label="Auto-pay" /> : null}
          {isReminderWindow(sub) ? <Bell className="size-3.5 text-amber-500" aria-label="Perlu diingatkan" /> : null}
        </ItemTitle>
        <ItemDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>
            {formatAmount(sub.amount, sub.currency)}
            {billingCycleShort(sub.billing_cycle, sub.billing_interval_days)}
          </span>
          <span>·</span>
          <span className={dueToneClass}>{due.text}</span>
          <span>·</span>
          <span>{SUBSCRIPTION_CATEGORY_LABEL[sub.category]}</span>
        </ItemDescription>
      </ItemContent>
      <ItemActions className="flex items-center gap-1">
        {sub.status === "active" ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={paying}
            onClick={(event) => {
              event.stopPropagation();
              onQuickPay(sub);
            }}
          >
            {paying ? <Loader2 className="size-4 animate-spin" /> : "Bayar"}
          </Button>
        ) : (
          <Badge variant="outline">{SUBSCRIPTION_STATUS_LABEL[sub.status]}</Badge>
        )}
        <ChevronRight className="size-5 text-muted-foreground" />
      </ItemActions>
    </Item>
  );
}

export function SubscriptionTracker() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = React.useState<SubscriptionOverviewResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<SubscriptionCategory | "all">("all");
  const [tab, setTab] = React.useState("overview");

  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [editing, setEditing] = React.useState<Subscription | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Subscription | null>(null);
  const [payingId, setPayingId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const overview = await subscriptionsApi.overview(token);
      setData(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const subscriptions = data?.subscriptions ?? [];
  const stats = data?.stats;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscriptions
      .filter((sub) => {
        if (categoryFilter !== "all" && sub.category !== categoryFilter) return false;
        if (!q) return true;
        return (
          sub.name.toLowerCase().includes(q) ||
          SUBSCRIPTION_CATEGORY_LABEL[sub.category].toLowerCase().includes(q) ||
          (sub.notes?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort(sortByDueDate);
  }, [subscriptions, search, categoryFilter]);

  const upcoming = React.useMemo(
    () => filtered.filter((sub) => sub.status === "active" && daysUntilFilter(sub.next_due_date) <= 30),
    [filtered],
  );

  const active = React.useMemo(() => filtered.filter((sub) => sub.status === "active"), [filtered]);
  const paused = React.useMemo(() => filtered.filter((sub) => sub.status === "paused"), [filtered]);
  const reminders = React.useMemo(() => filtered.filter(isReminderWindow), [filtered]);
  const overdue = React.useMemo(
    () => filtered.filter((sub) => sub.status === "active" && daysUntilFilter(sub.next_due_date) < 0),
    [filtered],
  );

  const categoryBreakdown = React.useMemo(() => {
    const map = new Map<SubscriptionCategory, number>();
    for (const sub of subscriptions.filter((s) => s.status === "active")) {
      const eq = monthlyEquivalent(sub.amount, sub.billing_cycle, sub.billing_interval_days);
      map.set(sub.category, (map.get(sub.category) ?? 0) + eq);
    }
    return SUBSCRIPTION_CATEGORY_ORDER.map((cat) => ({
      category: cat,
      amount: map.get(cat) ?? 0,
    })).filter((row) => row.amount > 0);
  }, [subscriptions]);

  const monthlyBurn = stats?.monthly_burn_idr ?? 0;
  const maxCategory = Math.max(...categoryBreakdown.map((c) => c.amount), 1);

  function openCreate() {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(sub: Subscription) {
    setFormMode("edit");
    setEditing(sub);
    setFormOpen(true);
    setDetailOpen(false);
  }

  function openDetail(sub: Subscription) {
    setSelected(sub);
    setDetailOpen(true);
  }

  async function handleSubmit(body: CreateSubscriptionBody) {
    if (!token) return;
    setSaving(true);
    try {
      if (formMode === "create") {
        await subscriptionsApi.create(token, body);
      } else if (editing) {
        await subscriptionsApi.update(token, editing.id, body);
      }
      setFormOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!token || !editing) return;
    setSaving(true);
    try {
      await subscriptionsApi.delete(token, editing.id);
      setFormOpen(false);
      setDetailOpen(false);
      setSelected(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(sub: Subscription) {
    if (!token) return;
    setPayingId(sub.id);
    try {
      await subscriptionsApi.markPaid(token, sub.id);
      await load();
      if (selected?.id === sub.id) {
        const refreshed = (await subscriptionsApi.overview(token)).subscriptions.find((s) => s.id === sub.id);
        if (refreshed) setSelected(refreshed);
      }
    } finally {
      setPayingId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertTriangle className="size-8 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => void load()}>Coba lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari langganan, pulsa, AI…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as SubscriptionCategory | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kategori</SelectItem>
              {SUBSCRIPTION_CATEGORY_ORDER.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {SUBSCRIPTION_CATEGORY_LABEL[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tambah
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Estimasi bulanan (IDR)"
          value={formatAmount(Math.round(monthlyBurn), "IDR")}
          sub={`${stats?.active ?? 0} langganan aktif`}
          icon={Wallet}
          tone="violet"
        />
        <StatCard
          label="Jatuh tempo minggu ini"
          value={stats?.due_this_week ?? 0}
          sub={`${stats?.due_this_month ?? 0} bulan ini`}
          icon={CalendarClock}
          tone="amber"
        />
        <StatCard label="Terlambat bayar" value={stats?.overdue ?? 0} icon={AlertTriangle} tone="red" />
        <StatCard
          label="Perlu diingatkan"
          value={stats?.needs_reminder ?? 0}
          sub={`${stats?.auto_pay_count ?? 0} auto-pay`}
          icon={Bell}
          tone="blue"
        />
      </div>

      {stats && stats.due_today > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          <CreditCard className="size-4 shrink-0 text-red-600" />
          <span>
            <strong>{stats.due_today}</strong> tagihan jatuh tempo hari ini. Cek daftar mendatang di bawah.
          </span>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="upcoming">
            Mendatang
            {upcoming.length > 0 ? (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {upcoming.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="all">Semua ({filtered.length})</TabsTrigger>
          <TabsTrigger value="paused">Dijeda ({paused.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-normal">Tagihan 30 hari ke depan</CardTitle>
                <CardDescription>Deadline pembayaran yang perlu kamu ingat</CardDescription>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground text-sm">Tidak ada tagihan mendatang.</p>
                ) : (
                  <ItemGroup>
                    {upcoming.slice(0, 6).map((sub) => (
                      <SubscriptionRow
                        key={sub.id}
                        sub={sub}
                        onOpen={openDetail}
                        onQuickPay={handleMarkPaid}
                        paying={payingId === sub.id}
                      />
                    ))}
                  </ItemGroup>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-normal">Beban per kategori</CardTitle>
                <CardDescription>Estimasi bulanan per jenis biaya</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryBreakdown.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground text-sm">Belum ada data.</p>
                ) : (
                  categoryBreakdown.map((row) => (
                    <div key={row.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>{SUBSCRIPTION_CATEGORY_LABEL[row.category]}</span>
                        <span className="font-medium tabular-nums">{formatAmount(Math.round(row.amount), "IDR")}</span>
                      </div>
                      <Progress value={(row.amount / maxCategory) * 100} className="h-2" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {reminders.length > 0 ? (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-normal text-base">
                  <Sparkles className="size-4 text-amber-600" />
                  Pengingat aktif ({reminders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ItemGroup>
                  {reminders.map((sub) => (
                    <SubscriptionRow
                      key={sub.id}
                      sub={sub}
                      onOpen={openDetail}
                      onQuickPay={handleMarkPaid}
                      paying={payingId === sub.id}
                    />
                  ))}
                </ItemGroup>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <SubscriptionList
            items={upcoming}
            empty="Tidak ada tagihan dalam 30 hari ke depan."
            onOpen={openDetail}
            onQuickPay={handleMarkPaid}
            payingId={payingId}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <SubscriptionList
            items={active}
            empty="Belum ada langganan aktif. Tambah pulsa, AI, cloud, dll."
            onOpen={openDetail}
            onQuickPay={handleMarkPaid}
            payingId={payingId}
          />
          {overdue.length > 0 ? (
            <Card className="mt-4 border-red-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-600">Terlambat ({overdue.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ItemGroup>
                  {overdue.map((sub) => (
                    <SubscriptionRow
                      key={sub.id}
                      sub={sub}
                      onOpen={openDetail}
                      onQuickPay={handleMarkPaid}
                      paying={payingId === sub.id}
                    />
                  ))}
                </ItemGroup>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="paused" className="mt-4">
          <SubscriptionList
            items={paused}
            empty="Tidak ada langganan yang dijeda."
            onOpen={openDetail}
            onQuickPay={handleMarkPaid}
            payingId={payingId}
          />
        </TabsContent>
      </Tabs>

      <SubscriptionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        subscription={editing}
        saving={saving}
        onSubmit={handleSubmit}
        onDelete={formMode === "edit" ? handleDelete : undefined}
      />

      <SubscriptionDetailSheet
        subscription={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEdit}
        onMarkPaid={handleMarkPaid}
        markingPaid={selected ? payingId === selected.id : false}
      />
    </div>
  );
}

function SubscriptionList({
  items,
  empty,
  onOpen,
  onQuickPay,
  payingId,
}: {
  items: Subscription[];
  empty: string;
  onOpen: (sub: Subscription) => void;
  onQuickPay: (sub: Subscription) => void;
  payingId: number | null;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground text-sm">{empty}</CardContent>
      </Card>
    );
  }

  return (
    <ItemGroup>
      {items.map((sub) => (
        <SubscriptionRow key={sub.id} sub={sub} onOpen={onOpen} onQuickPay={onQuickPay} paying={payingId === sub.id} />
      ))}
    </ItemGroup>
  );
}

function daysUntilFilter(raw: string): number {
  const due = new Date(raw.slice(0, 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
