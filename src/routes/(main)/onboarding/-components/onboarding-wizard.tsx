"use client";

import * as React from "react";

import { useNavigate } from "@tanstack/react-router";

import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mineMenuCatalog, pathForMenuId, resolveLandingPath } from "@/lib/navigation/mine-menu-catalog";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { FeaturePicker } from "../../dashboard/settings/-components/feature-picker";

export function OnboardingWizard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updatePreferences = useAuthStore((s) => s.updatePreferences);
  const [step, setStep] = React.useState(1);
  const [selected, setSelected] = React.useState<string[]>(["interviews", "kanban", "leetcode"]);
  const [landingId, setLandingId] = React.useState("interviews");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selected.includes(landingId)) {
      setLandingId(selected[0] ?? "");
    }
  }, [selected, landingId]);

  async function finish() {
    if (selected.length === 0) {
      setError("Pilih minimal satu fitur untuk dilanjutkan.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const landingPath = pathForMenuId(landingId) ?? pathForMenuId(selected[0]);
      const prefs = await updatePreferences({
        enabled_menu_items: selected,
        landing_path: landingPath,
        onboarding_completed: true,
        show_template_pages: false,
      });
      await navigate({ to: resolveLandingPath(prefs), replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan preferensi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-6" />
        </div>
        <h1 className="font-semibold text-3xl tracking-tight">
          {step === 1 ? `Halo, ${user?.name?.split(" ")[0] ?? "there"}` : "Halaman utama kamu"}
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground text-sm leading-relaxed">
          {step === 1
            ? "Mine bisa fokus ke apa yang kamu butuhkan. Pilih modul yang ingin tampil di sidebar — kamu bisa ubah kapan saja di Settings."
            : "Pilih landing page setelah login. Sisanya tetap bisa diakses lewat sidebar."}
        </p>
      </div>

      {step === 1 ? (
        <>
          <FeaturePicker selected={selected} onChange={setSelected} />
          {error && <p className="text-center text-destructive text-sm">{error}</p>}
          <div className="flex justify-end">
            <Button disabled={selected.length === 0} onClick={() => setStep(2)}>
              Lanjut
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border bg-card p-5">
            <Label className="mb-2 block">Buka halaman ini setelah login</Label>
            <Select value={landingId} onValueChange={(v) => v && setLandingId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih halaman utama" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {selected.map((id) => {
                    const item = mineMenuCatalog.find((entry) => entry.id === id);
                    if (!item) return null;
                    return (
                      <SelectItem key={id} value={id}>
                        {item.title}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="mt-3 text-muted-foreground text-sm">
              {selected.length} modul aktif:{" "}
              {selected
                .map((id) => mineMenuCatalog.find((entry) => entry.id === id)?.title)
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
          {error && <p className="text-center text-destructive text-sm">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Kembali
            </Button>
            <Button disabled={saving || selected.length === 0} onClick={() => void finish()}>
              {saving ? "Menyimpan..." : "Masuk ke Mine"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
