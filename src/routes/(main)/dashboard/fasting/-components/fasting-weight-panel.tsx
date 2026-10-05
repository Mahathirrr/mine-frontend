"use client";

import * as React from "react";

import { Plus, Scale, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import type { FastingOverview } from "@/lib/api/fasting";
import { fastingApi } from "@/lib/api/fasting";

import { formatKg } from "./fasting-utils";

const weightConfig = { weight_kg: { label: "BB", color: "var(--chart-3)" } } satisfies ChartConfig;

type Props = {
  data: FastingOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

export function FastingWeightPanel({ data, token, onRefresh }: Props) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ logged_at: new Date().toISOString().slice(0, 10), weight_kg: "", note: "" });
  const ws = data.weight_summary;
  const delta = ws.delta_kg;
  const toTarget = ws.current_kg - ws.target_kg;

  async function submit() {
    setSaving(true);
    try {
      await fastingApi.createWeight(token, {
        logged_at: form.logged_at,
        weight_kg: Number(form.weight_kg),
        body_fat_pct: null,
        waist_cm: null,
        note: form.note,
      });
      setOpen(false);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scale className="size-5" />
                Berat badan
              </CardTitle>
              <CardDescription>Before / after · progress ke target</CardDescription>
            </div>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Log BB
            </Button>
          </CardHeader>
          <CardContent>
            {data.weight_chart.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada data BB. Set berat awal di tab Profil.</p>
            ) : (
              <ChartContainer config={weightConfig} className="h-64 w-full">
                <LineChart data={[...data.weight_chart].reverse()}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
                  <YAxis width={40} domain={["dataMin - 1", "dataMax + 1"]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="weight_kg" stroke="var(--color-weight_kg)" strokeWidth={2} dot />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sebelum (awal)</CardDescription>
              <CardTitle className="text-2xl">{ws.start_kg > 0 ? formatKg(ws.start_kg) : "—"}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sekarang</CardDescription>
              <CardTitle className="text-2xl">{ws.current_kg > 0 ? formatKg(ws.current_kg) : "—"}</CardTitle>
            </CardHeader>
            <CardContent>
              {delta !== 0 && ws.start_kg > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {delta < 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)} kg
                </Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Target</CardDescription>
              <CardTitle className="text-2xl">{ws.target_kg > 0 ? formatKg(ws.target_kg) : "—"}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {ws.target_kg > 0 && ws.current_kg > 0
                ? `${toTarget > 0 ? "Kurang" : "Lewat"} ${Math.abs(toTarget).toFixed(1)} kg`
                : "Set target di Profil"}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat timbang</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemGroup>
            {data.weight_logs.map((w) => (
              <Item key={w.id} variant="outline">
                <ItemContent>
                  <ItemTitle>{formatKg(w.weight_kg)}</ItemTitle>
                  <ItemDescription>
                    {w.logged_at.slice(0, 10)}
                    {w.note ? ` · ${w.note}` : ""}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      await fastingApi.deleteWeight(token, w.id);
                      await onRefresh();
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log berat badan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={form.logged_at}
                onChange={(e) => setForm((f) => ({ ...f, logged_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Berat (kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
