"use client";

import * as React from "react";

import { useNavigate } from "@tanstack/react-router";

import { Save, Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mineMenuCatalog, pathForMenuId, resolveLandingPath } from "@/lib/navigation/mine-menu-catalog";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { AvatarEditor } from "./avatar-editor";
import { FeaturePicker } from "./feature-picker";

export function SettingsHub() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const preferences = useAuthStore((s) => s.preferences);
  const updatePreferences = useAuthStore((s) => s.updatePreferences);

  const [selected, setSelected] = React.useState<string[]>(preferences?.enabled_menu_items ?? []);
  const [landingId, setLandingId] = React.useState("");
  const [showTemplates, setShowTemplates] = React.useState(preferences?.show_template_pages ?? false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!preferences) return;
    setSelected(preferences.enabled_menu_items);
    setShowTemplates(preferences.show_template_pages);
    if (preferences.landing_path === "/dashboard" || preferences.landing_path === "/dashboard/") {
      setLandingId("home");
    } else {
      const current = preferences.enabled_menu_items.find((id) => pathForMenuId(id) === preferences.landing_path);
      setLandingId(current ?? "home");
    }
  }, [preferences]);

  React.useEffect(() => {
    if (landingId === "home") return;
    if (!selected.includes(landingId)) {
      setLandingId(selected[0] ?? "home");
    }
  }, [selected, landingId]);

  async function save() {
    if (selected.length === 0) {
      setError("Pilih minimal satu menu.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const landingPath =
        landingId === "home" ? "/dashboard" : (pathForMenuId(landingId) ?? pathForMenuId(selected[0]) ?? "/dashboard");
      await updatePreferences({
        enabled_menu_items: selected,
        show_template_pages: showTemplates,
        landing_path: landingPath,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings2 className="size-6" />
          <h1 className="text-3xl tracking-tight">Profile & Settings</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Atur modul sidebar, halaman utama setelah login, dan preferensi workspace kamu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Akun</CardTitle>
          <CardDescription>Informasi login kamu di Mine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarEditor user={user} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Nama</p>
              <p className="font-medium">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Email</p>
              <p className="font-medium">{user?.email ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modul sidebar</CardTitle>
          <CardDescription>
            Aktifkan menu seperti LeetCode, Wawancara, Task, dan modul lain. Hanya yang dipilih yang muncul di sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FeaturePicker selected={selected} onChange={setSelected} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferensi navigasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Halaman utama setelah login</Label>
            <Select value={landingId} onValueChange={(v) => v && setLandingId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih landing page" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="home">Beranda (Command Center)</SelectItem>
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
            {preferences && (
              <p className="text-muted-foreground text-xs">Saat ini: {resolveLandingPath(preferences)}</p>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id="show-templates"
              checked={showTemplates}
              onCheckedChange={(v) => setShowTemplates(Boolean(v))}
            />
            <div>
              <Label htmlFor="show-templates" className="font-medium text-sm">
                Tampilkan halaman template demo
              </Label>
              <p className="mt-1 text-muted-foreground text-sm">
                CRM, Mail, Chat, dan dashboard template lainnya. Nonaktifkan untuk sidebar yang lebih bersih.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {saved && (
        <Badge variant="outline" className="w-fit border-green-500/30 text-green-700 dark:text-green-300">
          Preferensi tersimpan
        </Badge>
      )}

      <div className="flex flex-wrap gap-2">
        <Button disabled={saving} onClick={() => void save()}>
          <Save data-icon="inline-start" />
          {saving ? "Menyimpan..." : "Simpan perubahan"}
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            void navigate({
              to: resolveLandingPath(preferences ?? { enabled_menu_items: selected, landing_path: null }),
            })
          }
        >
          Kembali ke dashboard
        </Button>
      </div>
    </div>
  );
}
