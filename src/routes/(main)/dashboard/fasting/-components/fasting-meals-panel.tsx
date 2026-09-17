"use client";

import * as React from "react";

import { Plus, Trash2, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FastingOverview } from "@/lib/api/fasting";
import { fastingApi } from "@/lib/api/fasting";

import { formatDateTime, mealLabels } from "./fasting-utils";

type Props = {
  data: FastingOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

export function FastingMealsPanel({ data, token, onRefresh }: Props) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    eaten_at: new Date().toISOString().slice(0, 16),
    meal_type: "lunch",
    title: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
    in_eating_window: true,
    notes: "",
    description: "",
  });

  const todayCal = data.meal_logs
    .filter((m) => m.eaten_at.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((s, m) => s + m.calories, 0);

  async function submit() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await fastingApi.createMeal(token, {
        eaten_at: new Date(form.eaten_at).toISOString(),
        meal_type: form.meal_type,
        title: form.title,
        description: form.description,
        calories: Number(form.calories) || 0,
        protein_g: Number(form.protein_g) || 0,
        carbs_g: Number(form.carbs_g) || 0,
        fat_g: Number(form.fat_g) || 0,
        in_eating_window: form.in_eating_window,
        notes: form.notes,
      });
      setOpen(false);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kalori hari ini</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{todayCal} kcal</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Eating window</CardDescription>
            <CardTitle className="text-2xl">{data.profile.eating_window_hours} jam</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total log</CardDescription>
            <CardTitle className="text-2xl">{data.meal_logs.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="size-5" />
              Food log
            </CardTitle>
            <CardDescription>Catat makanan selama eating window</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Tambah makanan
          </Button>
        </CardHeader>
        <CardContent>
          <ItemGroup>
            {data.meal_logs.map((m) => (
              <Item key={m.id} variant="outline">
                <ItemContent>
                  <ItemTitle className="flex flex-wrap items-center gap-2">
                    {m.title}
                    <Badge variant="outline">{mealLabels[m.meal_type] ?? m.meal_type}</Badge>
                    {!m.in_eating_window && <Badge variant="destructive">Di luar window</Badge>}
                  </ItemTitle>
                  <ItemDescription>
                    {formatDateTime(m.eaten_at)}
                    {m.calories > 0 ? ` · ${m.calories} kcal` : ""}
                    {m.protein_g > 0 ? ` · P${m.protein_g}g C${m.carbs_g}g F${m.fat_g}g` : ""}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      await fastingApi.deleteMeal(token, m.id);
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log makanan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Waktu</Label>
                <Input
                  type="datetime-local"
                  value={form.eaten_at}
                  onChange={(e) => setForm((f) => ({ ...f, eaten_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Jenis</Label>
                <Select value={form.meal_type} onValueChange={(v) => setForm((f) => ({ ...f, meal_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(mealLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama makanan</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kalori</Label>
                <Input
                  type="number"
                  value={form.calories}
                  onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  value={form.protein_g}
                  onChange={(e) => setForm((f) => ({ ...f, protein_g: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Karbohidrat (g)</Label>
                <Input
                  type="number"
                  value={form.carbs_g}
                  onChange={(e) => setForm((f) => ({ ...f, carbs_g: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Lemak (g)</Label>
                <Input
                  type="number"
                  value={form.fat_g}
                  onChange={(e) => setForm((f) => ({ ...f, fat_g: e.target.value }))}
                />
              </div>
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
