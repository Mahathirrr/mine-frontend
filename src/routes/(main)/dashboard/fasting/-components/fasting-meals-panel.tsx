"use client";

import * as React from "react";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FastingFoodPreset, FastingMealLog, FastingOverview } from "@/lib/api/fasting";
import { fastingApi } from "@/lib/api/fasting";

import { mealLabels } from "./fasting-utils";

type Props = {
  data: FastingOverview;
  token: string;
  onRefresh: () => Promise<void>;
};

type Macros = { sodium_mg: number; fat_g: number; carbs_g: number; protein_g: number; calories: number };

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function sumMacros(items: FastingMealLog[]): Macros {
  return items.reduce(
    (acc, m) => ({
      sodium_mg: acc.sodium_mg + (m.sodium_mg ?? 0),
      fat_g: acc.fat_g + m.fat_g,
      carbs_g: acc.carbs_g + m.carbs_g,
      protein_g: acc.protein_g + m.protein_g,
      calories: acc.calories + m.calories,
    }),
    { sodium_mg: 0, fat_g: 0, carbs_g: 0, protein_g: 0, calories: 0 },
  );
}

function fmtMacro(n: number, decimals = 2) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(decimals);
}

export function FastingMealsPanel({ data, token, onRefresh }: Props) {
  const [open, setOpen] = React.useState(false);
  const [mealType, setMealType] = React.useState<string>("breakfast");
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const [saving, setSaving] = React.useState(false);
  const [custom, setCustom] = React.useState(false);
  const [savePreset, setSavePreset] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    calories: "",
    sodium_mg: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });

  const todayMeals = data.meal_logs.filter((m) => m.eaten_at.slice(0, 10) === todayKey());
  const daily = sumMacros(todayMeals);
  const presets = data.food_presets;

  const byMeal = MEAL_ORDER.map((type) => ({
    type,
    label: mealLabels[type] ?? type,
    items: todayMeals.filter((m) => m.meal_type === type),
  })).filter((g) => g.items.length > 0 || true);

  function resetForm() {
    setForm({ title: "", description: "", calories: "", sodium_mg: "", protein_g: "", carbs_g: "", fat_g: "" });
    setCustom(false);
    setSavePreset(false);
  }

  async function addFromPreset(preset: FastingFoodPreset) {
    setSaving(true);
    try {
      await fastingApi.createMeal(token, {
        eaten_at: new Date().toISOString(),
        meal_type: mealType,
        title: preset.name,
        description: preset.serving_label,
        calories: preset.calories,
        protein_g: preset.protein_g,
        carbs_g: preset.carbs_g,
        fat_g: preset.fat_g,
        sodium_mg: preset.sodium_mg,
        in_eating_window: true,
        notes: "",
      });
      setOpen(false);
      resetForm();
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function submitCustom() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await fastingApi.createMeal(token, {
        eaten_at: new Date().toISOString(),
        meal_type: mealType,
        title: form.title.trim(),
        description: form.description.trim(),
        calories: Number(form.calories) || 0,
        protein_g: Number(form.protein_g) || 0,
        carbs_g: Number(form.carbs_g) || 0,
        fat_g: Number(form.fat_g) || 0,
        sodium_mg: Number(form.sodium_mg) || 0,
        in_eating_window: true,
        notes: "",
      });
      if (savePreset) {
        await fastingApi.createPreset(token, {
          name: form.title.trim(),
          serving_label: form.description.trim() || "1 porsi",
          calories: Number(form.calories) || 0,
          protein_g: Number(form.protein_g) || 0,
          carbs_g: Number(form.carbs_g) || 0,
          fat_g: Number(form.fat_g) || 0,
          sodium_mg: Number(form.sodium_mg) || 0,
        });
      }
      setOpen(false);
      resetForm();
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="bg-emerald-600 px-4 py-3 text-white">
          <p className="font-semibold">Hari ini</p>
        </div>

        <MacroHeaderRow macros={daily} caloriesClassName="text-emerald-600 font-bold" />

        <div className="divide-y">
          {byMeal.map(({ type, label, items }) => {
            const mealTotal = sumMacros(items);
            const isCollapsed = collapsed[type] ?? false;

            return (
              <section key={type}>
                <div className="flex items-center gap-2 bg-emerald-600/8 px-3 py-2.5">
                  <button
                    type="button"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      setMealType(type);
                      setOpen(true);
                    }}
                    aria-label={`Tambah ${label}`}
                  >
                    <Plus className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                    onClick={() => setCollapsed((c) => ({ ...c, [type]: !isCollapsed }))}
                  >
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{label}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-600 tabular-nums">{mealTotal.calories}</span>
                      {isCollapsed ? (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      )}
                    </span>
                  </button>
                </div>

                {!isCollapsed && items.length > 0 && (
                  <>
                    <MacroSubRow macros={mealTotal} />
                    {items.map((m) => (
                      <FoodRow
                        key={m.id}
                        meal={m}
                        onDelete={async () => {
                          await fastingApi.deleteMeal(token, m.id);
                          await onRefresh();
                        }}
                      />
                    ))}
                  </>
                )}

                {!isCollapsed && items.length === 0 && (
                  <p className="px-4 py-3 text-muted-foreground text-sm">Belum ada makanan — ketuk + untuk tambah.</p>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah — {mealLabels[mealType] ?? mealType}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {MEAL_ORDER.map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={mealType === t ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setMealType(t)}
              >
                {mealLabels[t]}
              </Button>
            ))}
          </div>

          {!custom ? (
            <div className="space-y-3 py-2">
              <p className="font-medium text-sm">Preset</p>
              <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={saving}
                    className="rounded-xl border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
                    onClick={() => addFromPreset(p)}
                  >
                    <p className="font-medium text-sm leading-tight">{p.name}</p>
                    <p className="text-muted-foreground text-xs">{p.serving_label}</p>
                    <p className="mt-1 text-emerald-600 text-xs tabular-nums">{p.calories} kcal</p>
                  </button>
                ))}
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => setCustom(true)}>
                Makanan / minuman custom
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 py-2">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Mis. Kopi susu"
                />
              </div>
              <div className="space-y-2">
                <Label>Porsi</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="1 gelas"
                />
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
                  <Label>Sodium (mg)</Label>
                  <Input
                    type="number"
                    value={form.sodium_mg}
                    onChange={(e) => setForm((f) => ({ ...f, sodium_mg: e.target.value }))}
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
              <div className="flex items-center gap-2 text-sm">
                <Checkbox id="save-preset" checked={savePreset} onCheckedChange={(v) => setSavePreset(v === true)} />
                <Label htmlFor="save-preset" className="cursor-pointer font-normal">
                  Simpan sebagai preset
                </Label>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCustom(false)}>
                ← Kembali ke preset
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            {custom && (
              <Button onClick={submitCustom} disabled={saving || !form.title.trim()}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MacroHeaderRow({ macros, caloriesClassName }: { macros: Macros; caloriesClassName?: string }) {
  const cols = [
    { label: "Sod", value: fmtMacro(macros.sodium_mg, 0) },
    { label: "Fat", value: fmtMacro(macros.fat_g) },
    { label: "Carbs", value: fmtMacro(macros.carbs_g) },
    { label: "Prot", value: fmtMacro(macros.protein_g) },
    { label: "Cals", value: fmtMacro(macros.calories, 0), highlight: true },
  ];
  return (
    <div className="grid grid-cols-[1fr_repeat(5,minmax(0,3rem))] gap-1 border-b px-3 py-2 text-[11px]">
      <span />
      {cols.map((c) => (
        <div key={c.label} className="text-center">
          <p className="font-medium text-muted-foreground uppercase tracking-wide">{c.label}</p>
          <p className={`mt-0.5 tabular-nums ${c.highlight ? (caloriesClassName ?? "font-semibold") : "font-medium"}`}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function MacroSubRow({ macros }: { macros: Macros }) {
  return (
    <div className="grid grid-cols-[1fr_repeat(5,minmax(0,3rem))] gap-1 border-b bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground tabular-nums">
      <span />
      <span className="text-center">{fmtMacro(macros.sodium_mg, 0)}</span>
      <span className="text-center">{fmtMacro(macros.fat_g)}</span>
      <span className="text-center">{fmtMacro(macros.carbs_g)}</span>
      <span className="text-center">{fmtMacro(macros.protein_g)}</span>
      <span />
    </div>
  );
}

function FoodRow({ meal, onDelete }: { meal: FastingMealLog; onDelete: () => Promise<void> }) {
  return (
    <div className="group border-b px-3 py-2.5 last:border-b-0">
      <div className="grid grid-cols-[1fr_repeat(5,minmax(0,3rem))_auto] items-start gap-1">
        <div className="min-w-0">
          <p className="font-medium text-sm leading-tight">{meal.title}</p>
          {meal.description && <p className="mt-0.5 text-muted-foreground text-xs">{meal.description}</p>}
        </div>
        <span className="text-center text-[11px] text-muted-foreground tabular-nums">
          {fmtMacro(meal.sodium_mg ?? 0, 0)}
        </span>
        <span className="text-center text-[11px] text-muted-foreground tabular-nums">{fmtMacro(meal.fat_g)}</span>
        <span className="text-center text-[11px] text-muted-foreground tabular-nums">{fmtMacro(meal.carbs_g)}</span>
        <span className="text-center text-[11px] text-muted-foreground tabular-nums">{fmtMacro(meal.protein_g)}</span>
        <span className="text-center font-medium text-sm tabular-nums">{meal.calories}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 group-hover:opacity-100"
          onClick={() => void onDelete()}
          aria-label="Hapus"
        >
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
