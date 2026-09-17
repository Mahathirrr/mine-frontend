"use client";

import * as React from "react";

import { cn } from "cn";
import { BookOpen, PenLine, Plus, Sparkles, Tags, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { JournalEntry, JournalOverviewResponse, JournalTopic } from "@/lib/api/journal";
import { journalApi } from "@/lib/api/journal";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { PRESET_TOPIC_COLORS } from "./journal-constants";
import { JournalEditor } from "./journal-editor";
import { countWords, excerpt, formatJournalDate, topicColor } from "./journal-utils";
import { TopicWheel } from "./topic-wheel";

export function JournalHub() {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = React.useState<JournalOverviewResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [tab, setTab] = React.useState("write");
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);

  const [activeEntry, setActiveEntry] = React.useState<JournalEntry | null>(null);
  const [activeTopic, setActiveTopic] = React.useState<JournalTopic | null>(null);
  const [draft, setDraft] = React.useState<{
    title: string;
    content: string;
    mood: JournalEntry["mood"];
    status: JournalEntry["status"];
    topic_id: number | null;
  }>({
    title: "",
    content: "",
    mood: null,
    status: "draft",
    topic_id: null,
  });
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [spinning, setSpinning] = React.useState(false);
  const [spinResult, setSpinResult] = React.useState<JournalTopic | null>(null);

  const [newTopicTitle, setNewTopicTitle] = React.useState("");
  const [newTopicPrompt, setNewTopicPrompt] = React.useState("");
  const [newTopicColor, setNewTopicColor] = React.useState(PRESET_TOPIC_COLORS[0]);
  const [pendingDeleteTopicId, setPendingDeleteTopicId] = React.useState<number | null>(null);
  const [deletingTopic, setDeletingTopic] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const overview = await journalApi.overview(token);
      setData(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat jurnal");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const editorEntry: JournalEntry = activeEntry
    ? {
        ...activeEntry,
        title: draft.title,
        content: draft.content,
        mood: draft.mood,
        status: draft.status,
        topic_id: draft.topic_id,
        word_count: countWords(draft.content),
      }
    : {
        id: 0,
        user_id: 0,
        topic_id: draft.topic_id,
        title: draft.title,
        content: draft.content,
        word_count: countWords(draft.content),
        mood: draft.mood,
        status: draft.status,
        created_at: "",
        updated_at: "",
      };

  function startWriting(topic?: JournalTopic | null) {
    setActiveEntry(null);
    setActiveTopic(topic ?? null);
    setDraft({
      title: topic ? `${topic.title}` : "",
      content: "",
      mood: null,
      status: "draft",
      topic_id: topic?.id ?? null,
    });
    setSaveState("idle");
    setIsEditorOpen(true);
    setTab("write");
  }

  function openEntry(entry: JournalEntry) {
    const topic = data?.topics.find((t) => t.id === entry.topic_id) ?? null;
    setActiveEntry(entry);
    setActiveTopic(topic);
    setDraft({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      status: entry.status,
      topic_id: entry.topic_id,
    });
    setSaveState("idle");
    setIsEditorOpen(true);
    setTab("write");
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setActiveEntry(null);
    setActiveTopic(null);
    setDraft({ title: "", content: "", mood: null, status: "draft", topic_id: null });
    setSaveState("idle");
  }

  async function persistEntry() {
    if (!token) return;
    setSaveState("saving");
    try {
      if (activeEntry) {
        const updated = await journalApi.updateEntry(token, activeEntry.id, {
          title: draft.title,
          content: draft.content,
          mood: draft.mood,
          status: draft.status,
          topic_id: draft.topic_id,
        });
        setActiveEntry(updated);
      } else {
        const created = await journalApi.createEntry(token, {
          title: draft.title,
          content: draft.content,
          mood: draft.mood,
          status: draft.status,
          topic_id: draft.topic_id,
        });
        setActiveEntry(created);
      }
      setSaveState("saved");
      await load();
    } catch {
      setSaveState("error");
    }
  }

  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (isEditorOpen && (draft.content.trim() || draft.title.trim())) void persistEntry();
    }, 1500);
  }

  function handleDraftChange(patch: Partial<typeof draft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaveState("idle");
    scheduleSave();
  }

  async function handleSpin() {
    if (!token || spinning) return;
    setSpinning(true);
    setSpinResult(null);
    try {
      const res = await journalApi.spin(token);
      setSpinResult(res.topic);
      window.setTimeout(() => {
        setSpinning((current) => {
          if (current) return false;
          return current;
        });
      }, 4200);
    } catch {
      setSpinning(false);
    }
  }

  function handleSpinEnd() {
    setSpinning(false);
  }

  function handleWriteFromWheel(topic: JournalTopic) {
    startWriting(topic);
  }

  async function handleAddTopic() {
    if (!token || !newTopicTitle.trim()) return;
    await journalApi.createTopic(token, {
      title: newTopicTitle.trim(),
      prompt: newTopicPrompt.trim() || null,
      color: newTopicColor,
      is_active: true,
    });
    setNewTopicTitle("");
    setNewTopicPrompt("");
    await load();
  }

  async function toggleTopic(topic: JournalTopic) {
    if (!token) return;
    await journalApi.updateTopic(token, topic.id, { is_active: !topic.is_active });
    await load();
  }

  async function deleteTopic(id: number) {
    if (!token) return;
    setDeletingTopic(true);
    try {
      await journalApi.deleteTopic(token, id);
      setPendingDeleteTopicId(null);
      await load();
    } finally {
      setDeletingTopic(false);
    }
  }

  async function deleteEntry() {
    if (!token || !activeEntry) return;
    await journalApi.deleteEntry(token, activeEntry.id);
    closeEditor();
    await load();
  }

  const pendingDeleteTopic = pendingDeleteTopicId
    ? (data?.topics.find((topic) => topic.id === pendingDeleteTopicId) ?? null)
    : null;

  if (loading && !data) {
    return <Skeleton className="h-[600px] rounded-xl" />;
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">{error ?? "Gagal memuat"}</CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!isEditorOpen ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Essay", value: data.stats.total_entries },
            { label: "Publish", value: data.stats.published_entries },
            { label: "Total kata", value: data.stats.total_words },
            { label: "Topik aktif", value: data.stats.active_topics },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border px-4 py-3">
              <p className="font-bold text-2xl tabular-nums">{stat.value}</p>
              <p className="text-muted-foreground text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="write">
              <PenLine className="size-4" />
              Tulis
            </TabsTrigger>
            <TabsTrigger value="wheel">
              <Sparkles className="size-4" />
              Spin Wheel
            </TabsTrigger>
            <TabsTrigger value="topics">
              <Tags className="size-4" />
              Topik
            </TabsTrigger>
            <TabsTrigger value="archive">
              <BookOpen className="size-4" />
              Arsip
            </TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => startWriting()}>
            <Plus className="size-4" />
            Essay baru
          </Button>
        </div>

        <TabsContent value="write" className={cn("mt-4", isEditorOpen && "mt-2")}>
          {isEditorOpen ? (
            <JournalEditor
              entry={editorEntry}
              topic={activeTopic}
              isBlankEssay={!activeEntry && !activeTopic}
              saveState={saveState}
              onBack={closeEditor}
              onChange={handleDraftChange}
              onSave={persistEntry}
              onDelete={activeEntry ? deleteEntry : undefined}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <PenLine className="size-10 text-muted-foreground" />
                <p className="text-muted-foreground">Mulai essay baru atau pilih dari arsip / spin wheel.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => startWriting()}>Essay kosong</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTab("wheel");
                    }}
                  >
                    Spin topik
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="wheel" className="mt-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-normal">Topic Spin Wheel</CardTitle>
              <CardDescription>Acak topik essay — cocok untuk latihan menulis & refleksi</CardDescription>
            </CardHeader>
            <CardContent>
              <TopicWheel
                topics={data.topics}
                spinning={spinning}
                result={spinResult}
                onSpin={() => void handleSpin()}
                onSpinEnd={handleSpinEnd}
                onWrite={handleWriteFromWheel}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Topik essay</CardTitle>
              <CardDescription>Kelola prompt — nonaktifkan topik yang tidak mau muncul di spin wheel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: topicColor(topic.color, index) }}
                      />
                      <p className="font-medium">{topic.title}</p>
                      {!topic.is_active ? <Badge variant="outline">Nonaktif</Badge> : null}
                    </div>
                    {topic.prompt ? <p className="mt-1 text-muted-foreground text-sm">{topic.prompt}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`topic-${topic.id}`}
                        checked={topic.is_active}
                        onCheckedChange={() => void toggleTopic(topic)}
                      />
                      <Label htmlFor={`topic-${topic.id}`} className="text-xs">
                        Spin
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setPendingDeleteTopicId(topic.id)}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Tambah topik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Judul topik"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
              />
              <Textarea
                placeholder="Prompt / pertanyaan panduan"
                value={newTopicPrompt}
                onChange={(e) => setNewTopicPrompt(e.target.value)}
                rows={3}
              />
              <div className="flex flex-wrap gap-2">
                {PRESET_TOPIC_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Warna ${color}`}
                    className={cn("size-8 rounded-full border-2", newTopicColor === color && "border-foreground")}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTopicColor(color)}
                  />
                ))}
              </div>
              <Button onClick={() => void handleAddTopic()}>
                <Plus className="size-4" />
                Simpan topik
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive" className="mt-4">
          {data.entries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">Belum ada essay.</CardContent>
            </Card>
          ) : (
            <ItemGroup>
              {data.entries.map((entry) => {
                const topic = data.topics.find((t) => t.id === entry.topic_id);
                return (
                  <Item
                    key={entry.id}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openEntry(entry)}
                  >
                    <ItemContent>
                      <ItemTitle className="flex flex-wrap items-center gap-2">
                        {entry.title.trim() || "Tanpa judul"}
                        <Badge variant="outline">{entry.status === "published" ? "Selesai" : "Draft"}</Badge>
                      </ItemTitle>
                      <ItemDescription>
                        {formatJournalDate(entry.updated_at)}
                        {topic ? ` · ${topic.title}` : ""}
                        {entry.word_count ? ` · ${entry.word_count} kata` : ""}
                      </ItemDescription>
                      {entry.content ? (
                        <p className="mt-1 text-muted-foreground text-sm">{excerpt(entry.content)}</p>
                      ) : null}
                    </ItemContent>
                  </Item>
                );
              })}
            </ItemGroup>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={pendingDeleteTopicId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteTopicId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus topik?</AlertDialogTitle>
            <AlertDialogDescription>
              Topik <span className="font-medium text-foreground">{pendingDeleteTopic?.title ?? "ini"}</span> akan
              dihapus dari daftar spin wheel. Essay yang sudah ditulis tidak ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTopic}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deletingTopic || pendingDeleteTopicId === null}
              onClick={() => {
                if (pendingDeleteTopicId !== null) void deleteTopic(pendingDeleteTopicId);
              }}
            >
              {deletingTopic ? "Menghapus…" : "Hapus topik"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
