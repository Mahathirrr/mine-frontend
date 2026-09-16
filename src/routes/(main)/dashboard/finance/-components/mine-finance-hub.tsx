"use client";

import * as React from "react";

import { Link } from "@tanstack/react-router";

import { cn } from "cn";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  Plus,
  ReceiptText,
  Target,
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
  CreateBudgetBody,
  CreateGoalBody,
  CreateTransactionBody,
  FinanceOverviewResponse,
  FinanceTxType,
} from "@/lib/api/finance";
import { financeApi } from "@/lib/api/finance";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { BalanceDistributionCard } from "./balance-distribution-card";
import { CashFlowOverview } from "./cash-flow-overview";
import { FinanceNotification } from "./finance-notification";
import { IncomeBreakdown } from "./income-breakdown";
import {
  buildAccountAllocation,
  buildCashFlowChartData,
  buildCategorySpending,
  buildDailyFlowChart,
  buildIncomeBreakdown,
  buildMonthlyExpenseTrend,
  categoryName,
  currentMonthKey,
  expenseCategories,
  formatIDR,
  formatTxDate,
  insightTone,
  txAmountClass,
  txSign,
  txTypeLabel,
} from "./mine-finance-utils";
import { MineTransactionFormDialog } from "./mine-transaction-form-dialog";
import { OverviewKpis } from "./overview-kpis";
import { SpendingActivityCard } from "./spending-activity-card";
import { TransactionsOverviewCard } from "./transactions-overview-card";

export function MineFinanceHub() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = React.useState<FinanceOverviewResponse | null>(null);
  const [monthTransactions, setMonthTransactions] = React.useState(data?.recent_transactions ?? []);
  const [transactions, setTransactions] = React.useState(data?.recent_transactions ?? []);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [monthKey, setMonthKey] = React.useState(currentMonthKey());
  const [txFilter, setTxFilter] = React.useState<FinanceTxType | "all">("all");
  const [saving, setSaving] = React.useState(false);

  const [txDialogOpen, setTxDialogOpen] = React.useState(false);
  const [txDefaultType, setTxDefaultType] = React.useState<FinanceTxType>("expense");

  const [budgetCat, setBudgetCat] = React.useState("");
  const [budgetLimit, setBudgetLimit] = React.useState("");
  const [goalName, setGoalName] = React.useState("");
  const [goalTarget, setGoalTarget] = React.useState("");
  const [goalCurrent, setGoalCurrent] = React.useState("");

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const overview = await financeApi.overview(token, monthKey);
      setData(overview);
      const txRes = await financeApi.listTransactions(token, { month: monthKey });
      setMonthTransactions(txRes.transactions);
      setTransactions(
        txFilter === "all" ? txRes.transactions : txRes.transactions.filter((tx) => tx.transaction_type === txFilter),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [token, monthKey, txFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  function openTx(type: FinanceTxType) {
    setTxDefaultType(type);
    setTxDialogOpen(true);
  }

  async function handleCreateTx(body: CreateTransactionBody) {
    if (!token) return;
    setSaving(true);
    try {
      await financeApi.createTransaction(token, body);
      setTxDialogOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTx(id: number) {
    if (!token || !confirm("Hapus transaksi ini? Saldo akan disesuaikan.")) return;
    setSaving(true);
    try {
      await financeApi.deleteTransaction(token, id);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddBudget() {
    if (!token || !budgetCat || !budgetLimit) return;
    setSaving(true);
    try {
      const body: CreateBudgetBody = {
        category_id: Number(budgetCat),
        month_key: monthKey,
        amount_limit: Number(budgetLimit),
      };
      await financeApi.createBudget(token, body);
      setBudgetCat("");
      setBudgetLimit("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddGoal() {
    if (!token || !goalName || !goalTarget) return;
    setSaving(true);
    try {
      const body: CreateGoalBody = {
        name: goalName.trim(),
        target_amount: Number(goalTarget),
        current_amount: goalCurrent ? Number(goalCurrent) : 0,
        currency: "IDR",
      };
      await financeApi.createGoal(token, body);
      setGoalName("");
      setGoalTarget("");
      setGoalCurrent("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="size-8 text-destructive" />
          <p className="text-muted-foreground">{error ?? "Data tidak tersedia"}</p>
          <Button onClick={() => void load()}>Coba lagi</Button>
        </CardContent>
      </Card>
    );
  }

  const defaultAccount = data.accounts.find((a) => a.is_default) ?? data.accounts[0];
  const dailyFlow = buildDailyFlowChart(monthTransactions, monthKey);
  const incomeRows = buildIncomeBreakdown(monthTransactions, data.categories);
  const accountRows = buildAccountAllocation(data.accounts);
  const categoryRows = buildCategorySpending(data.spending_by_category);
  const cashFlowChart = buildCashFlowChartData(data.cash_flow);
  const expenseTrend = buildMonthlyExpenseTrend(data.cash_flow);
  const budgetTotal = data.budgets.reduce((sum, row) => sum + row.amount_limit, 0);
  const budgetSpent = data.budgets.reduce((sum, row) => sum + row.spent, 0);
  const primaryInsight = data.insights[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <OverviewKpis stats={data.stats} />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => openTx("expense")}>
          <ArrowUpRight className="size-4" />
          Pengeluaran
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openTx("income")}>
          <ArrowDownLeft className="size-4" />
          Pemasukan
        </Button>
        <Button size="sm" variant="outline" onClick={() => openTx("transfer")}>
          Transfer
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to="/dashboard/subscriptions">
            <ReceiptText className="size-4" />
            Biaya Rutin
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TransactionsOverviewCard chartData={dailyFlow} monthKey={monthKey} />
            </div>
            <div className="flex flex-col gap-4 xl:col-span-5">
              <IncomeBreakdown rows={incomeRows} />
              <FinanceNotification insight={primaryInsight} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <BalanceDistributionCard title="Alokasi rekening" rows={accountRows} totalLabel="Saldo" />
            </div>
            <div className="xl:col-span-5">
              <BalanceDistributionCard title="Pengeluaran per kategori" rows={categoryRows} totalLabel="Total" />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Proyeksi & dompet</CardTitle>
              <CardDescription>Saldo saat ini dan estimasi setelah biaya rutin</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                {data.accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="size-3 rounded-full" style={{ backgroundColor: acc.color ?? "#6366f1" }} />
                      <div>
                        <p className="font-medium">{acc.name}</p>
                        <p className="text-muted-foreground text-xs capitalize">{acc.account_type}</p>
                      </div>
                    </div>
                    <p className="font-semibold tabular-nums">{formatIDR(acc.balance)}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm">
                <p className="font-medium">Proyeksi bulan ini</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>Langganan bulanan: {formatIDR(data.planning.subscription_monthly_idr)}</li>
                  <li>Tagihan 7 hari ke depan: {formatIDR(data.planning.subscription_due_week_idr)}</li>
                  <li>Saldo setelah langganan: {formatIDR(data.planning.projected_after_subs)}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Transaksi terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemGroup>
                {data.recent_transactions.slice(0, 8).map((tx) => (
                  <Item key={tx.id} variant="outline" size="sm">
                    <ItemMedia>
                      <div
                        className={cn(
                          "grid size-9 place-items-center rounded-lg bg-muted",
                          txAmountClass(tx.transaction_type),
                        )}
                      >
                        {tx.transaction_type === "income" ? (
                          <ArrowDownLeft className="size-4" />
                        ) : (
                          <ArrowUpRight className="size-4" />
                        )}
                      </div>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{tx.title}</ItemTitle>
                      <ItemDescription>
                        {formatTxDate(tx.transaction_date)} · {categoryName(data.categories, tx.category_id)}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <span className={cn("font-medium tabular-nums text-sm", txAmountClass(tx.transaction_type))}>
                        {txSign(tx.transaction_type)}
                        {formatIDR(tx.amount)}
                      </span>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} className="w-[180px]" />
            <Select value={txFilter} onValueChange={(v) => setTxFilter(v as FinanceTxType | "all")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua jenis</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ItemGroup>
            {transactions.map((tx) => (
              <Item key={tx.id} variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle className="flex items-center gap-2">
                    {tx.title}
                    <Badge variant="outline">{txTypeLabel(tx.transaction_type)}</Badge>
                  </ItemTitle>
                  <ItemDescription>
                    {formatTxDate(tx.transaction_date)} · {categoryName(data.categories, tx.category_id)}
                    {tx.merchant ? ` · ${tx.merchant}` : ""}
                  </ItemDescription>
                </ItemContent>
                <ItemActions className="flex items-center gap-2">
                  <span className={cn("font-medium tabular-nums", txAmountClass(tx.transaction_type))}>
                    {txSign(tx.transaction_type)}
                    {formatIDR(tx.amount)}
                  </span>
                  <Button size="sm" variant="ghost" disabled={saving} onClick={() => void handleDeleteTx(tx.id)}>
                    Hapus
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </TabsContent>

        <TabsContent value="budget" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Budget bulan {monthKey}</CardTitle>
              <CardDescription>Batas pengeluaran per kategori — fleksibel untuk hiburan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.budgets.map((b) => (
                <div key={b.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {b.category_name}
                      {b.is_flexible ? <Badge variant="secondary">Fleksibel</Badge> : null}
                      {b.is_over ? <Badge variant="destructive">Over</Badge> : null}
                    </span>
                    <span className="tabular-nums">
                      {formatIDR(b.spent)} / {formatIDR(b.amount_limit)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(b.percent_used, 100)}
                    className={cn("h-2", b.is_over && "[&>div]:bg-red-500")}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Tambah budget</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Select value={budgetCat} onValueChange={setBudgetCat}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories(data.categories).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Limit IDR"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-[160px]"
              />
              <Button disabled={saving} onClick={() => void handleAddBudget()}>
                <Plus className="size-4" />
                Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-4">
          <SpendingActivityCard
            chartData={expenseTrend}
            monthExpense={data.stats.month_expense}
            monthBudgetTotal={budgetTotal}
            monthBudgetSpent={budgetSpent}
          />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <CashFlowOverview
                chartData={cashFlowChart}
                totalIncome={data.cash_flow.reduce((sum, row) => sum + row.income, 0)}
                totalExpense={data.cash_flow.reduce((sum, row) => sum + row.expense, 0)}
              />
            </div>
            <div className="xl:col-span-5">
              <BalanceDistributionCard title="Komposisi pengeluaran" rows={categoryRows} totalLabel="Total" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {data.goals.map((goal) => {
              const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 font-normal text-base">
                      <Target className="size-4 text-primary" />
                      {goal.name}
                    </CardTitle>
                    <CardDescription>
                      {formatIDR(goal.current_amount)} dari {formatIDR(goal.target_amount)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={Math.min(pct, 100)} className="h-2" />
                    <p className="mt-2 text-muted-foreground text-xs">{Math.round(pct)}% tercapai</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Tambah goal tabungan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Input
                placeholder="Nama goal"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="w-[200px]"
              />
              <Input
                type="number"
                placeholder="Target IDR"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-[140px]"
              />
              <Input
                type="number"
                placeholder="Sudah terkumpul"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                className="w-[140px]"
              />
              <Button disabled={saving} onClick={() => void handleAddGoal()}>
                <Plus className="size-4" />
                Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-4 space-y-3">
          {data.insights.map((ins) => (
            <Card key={ins.id} className={insightTone(ins.severity)}>
              <CardContent className="flex items-start gap-3 py-4">
                {ins.severity === "danger" ? (
                  <AlertTriangle className="size-5 shrink-0 text-red-600" />
                ) : ins.type === "subscription" ? (
                  <Bell className="size-5 shrink-0 text-amber-600" />
                ) : (
                  <ChevronRight className="size-5 shrink-0" />
                )}
                <div>
                  <p className="font-medium">{ins.title}</p>
                  <p className="text-muted-foreground text-sm">{ins.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-muted-foreground text-sm">
              Insights digabung dari budget, tren pengeluaran, dan data{" "}
              <Link to="/dashboard/subscriptions" className="text-primary underline">
                Biaya Rutin
              </Link>
              .
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {defaultAccount ? (
        <MineTransactionFormDialog
          open={txDialogOpen}
          onOpenChange={setTxDialogOpen}
          accounts={data.accounts}
          categories={data.categories}
          defaultType={txDefaultType}
          saving={saving}
          onSubmit={handleCreateTx}
        />
      ) : null}
    </div>
  );
}
