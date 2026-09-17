"use client";

import * as React from "react";

import { cn } from "cn";
import { Check, Copy, Plus, Search, Sparkles, Star, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { PromptCategory, PromptVaultItem, PromptVaultOverview } from "@/lib/api/prompt-vault";
import { promptVaultApi } from "@/lib/api/prompt-vault";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { categoryLabels, excerpt, parseTags } from "./prompt-vault-utils";

const EMPTY_FORM = {
  category: "general" as PromptCategory,
  title: "",
  purpose: "",
  content: "",
  ai_target: "",
  tags: "",
};

export function PromptVaultHub() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = React.useState<PromptVaultOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [filter, setFilter] = React.useState<"all" | "starred">("all");
  const [aiFilter, setAiFilter] = React.useState<string>("all");

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [active, setActive] = React.useState<PromptVaultItem | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setData(
        await promptVaultApi.overview(token, {
          category,
          q: search.trim() || undefined,
          filter: filter === "starred" ? "starred" : undefined,
          aiTarget: aiFilter !== "all" ? aiFilter : undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat prompt vault");
    } finally {
      setLoading(false);
    }
  }, [token, category, search, filter, aiFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function copyPrompt(item: PromptVaultItem) {
    await navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId((id) => (id === item.id ? null : id)), 2000);
  }

  function openCreate() {
    setActive(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  }

  function openEdit(item: PromptVaultItem) {
    setActive(item);
    setForm({
      category: item.category,
      title: item.title,
      purpose: item.purpose,
      content: item.content,
      ai_target: item.ai_target ?? "",
      tags: item.tags,
    });
    setEditorOpen(true);
  }

  function openDetail(item: PromptVaultItem) {
    setActive(item);
    setDetailOpen(true);
  }

  async function savePrompt() {
    if (!token || !form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const body = {
        category: form.category,
        title: form.title.trim(),
        purpose: form.purpose.trim(),
        content: form.content,
        ai_target: form.ai_target.trim() || null,
        tags: form.tags.trim(),
      };
      if (active) {
        await promptVaultApi.update(token, active.id, body);
      } else {
        await promptVaultApi.create(token, body);
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan prompt");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStar(item: PromptVaultItem) {
    if (!token) return;
    await promptVaultApi.update(token, item.id, { starred: !item.starred });
    await load();
  }

  async function deletePrompt(item: PromptVaultItem) {
    if (!token) return;
    await promptVaultApi.delete(token, item.id);
    setDetailOpen(false);
    await load();
  }

  async function duplicatePrompt(item: PromptVaultItem) {
    if (!token) return;
    await promptVaultApi.duplicate(token, item.id);
    await load();
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Gagal memuat Prompt Vault</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
      </div>
    );
  }

  const prompts = data?.prompts ?? [];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-6 text-primary" />
            <h1 className="text-3xl tracking-tight">Prompt Vault</h1>
          </div>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Koleksi prompt AI yang reusable — review kode, CV, interview, research gap, dan lainnya. Copy sekali klik,
            target AI opsional.
          </p>
          {data && (
            <p className="text-muted-foreground text-sm">
              {data.stats.total} prompt · {data.stats.starred} starred
            </p>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />
          Prompt baru
        </Button>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <InputGroup className="md:max-w-lg">
          <InputGroupInput
            placeholder="Cari prompt, tag, atau tujuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={aiFilter} onValueChange={(v) => v && setAiFilter(v)}>
            <SelectTrigger size="sm" className="min-w-36">
              <SelectValue placeholder="AI target" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Semua AI</SelectItem>
                {(data?.ai_targets ?? []).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant={filter === "starred" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilter((f) => (f === "starred" ? "all" : "starred"))}
          >
            <Star className={cn("size-4", filter === "starred" && "fill-current")} />
            Starred
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={category === "all" ? "secondary" : "outline"} onClick={() => setCategory("all")}>
          Semua
        </Button>
        {(data?.categories ?? []).map((cat) => (
          <Button
            key={cat.slug}
            size="sm"
            variant={category === cat.slug ? "secondary" : "outline"}
            onClick={() => setCategory(cat.slug)}
          >
            {cat.label}
            <Badge variant="outline" className="ms-1.5 font-normal">
              {cat.count}
            </Badge>
          </Button>
        ))}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {prompts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="size-10 text-muted-foreground" />
            <p className="mt-3 font-medium">Belum ada prompt di filter ini</p>
            <p className="mt-1 max-w-md text-muted-foreground text-sm">
              Buat prompt sendiri atau reset filter. Akun baru otomatis dapat contoh prompt siap pakai.
            </p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus data-icon="inline-start" />
              Buat prompt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {prompts.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <Badge variant="outline" className="font-normal">
                      {categoryLabels[item.category]}
                    </Badge>
                    <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => void toggleStar(item)}>
                    <Star className={cn("size-4", item.starred && "fill-current text-amber-500")} />
                  </Button>
                </div>
                <CardDescription className="line-clamp-2">{item.purpose}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <p className="line-clamp-3 text-muted-foreground text-sm">{excerpt(item.content, 160)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.ai_target && (
                    <Badge variant="secondary" className="font-normal">
                      {item.ai_target}
                    </Badge>
                  )}
                  {parseTags(item.tags).map((tag) => (
                    <Badge key={tag} variant="outline" className="font-normal text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetail(item)}>
                    Buka
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => void copyPrompt(item)}>
                    {copiedId === item.id ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                    {copiedId === item.id ? "Copied" : "Copy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.title}</DialogTitle>
                <p className="text-muted-foreground text-sm">{active.purpose}</p>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{categoryLabels[active.category]}</Badge>
                {active.ai_target && <Badge variant="secondary">{active.ai_target}</Badge>}
                {parseTags(active.tags).map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 font-mono text-sm">
                {active.content}
              </pre>
              <DialogFooter className="gap-2 sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => openEdit(active)}>
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => void duplicatePrompt(active)}>
                    Duplicate
                  </Button>
                  <Button variant="destructive" onClick={() => void deletePrompt(active)}>
                    <Trash2 data-icon="inline-start" />
                    Hapus
                  </Button>
                </div>
                <Button onClick={() => void copyPrompt(active)}>
                  {copiedId === active.id ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                  Copy prompt
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{active ? "Edit prompt" : "Prompt baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, category: v as PromptCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.entries(categoryLabels).map(([slug, label]) => (
                        <SelectItem key={slug} value={slug}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>AI target (opsional)</Label>
                <Input
                  value={form.ai_target}
                  onChange={(e) => setForm((f) => ({ ...f, ai_target: e.target.value }))}
                  placeholder="Cursor, Claude, ChatGPT..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Untuk apa</Label>
              <Input
                value={form.purpose}
                onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                placeholder="Kapan & why pakai prompt ini"
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="review, cv, debug"
              />
            </div>
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={12}
                className="font-mono text-sm"
                placeholder="Tulis prompt lengkap di sini..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Batal
            </Button>
            <Button disabled={saving || !form.title.trim() || !form.content.trim()} onClick={() => void savePrompt()}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
