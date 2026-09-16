"use client";

import * as React from "react";

import { cn } from "cn";
import { Check, Loader2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { JournalEntry, JournalMood, JournalStatus, JournalTopic } from "@/lib/api/journal";

import { MOOD_EMOJI, MOOD_LABEL } from "./journal-constants";
import { countWords } from "./journal-utils";

type SaveState = "idle" | "saving" | "saved" | "error";

type JournalEditorProps = {
  entry: JournalEntry | null;
  topic: JournalTopic | null;
  topics: JournalTopic[];
  onChange: (patch: {
    title?: string;
    content?: string;
    mood?: JournalMood | null;
    status?: JournalStatus;
    topic_id?: number | null;
  }) => void;
  onSave: () => Promise<void>;
  onDelete?: () => Promise<void>;
  saveState: SaveState;
};

export function JournalEditor({ entry, topic, topics, onChange, onSave, onDelete, saveState }: JournalEditorProps) {
  const title = entry?.title ?? "";
  const content = entry?.content ?? "";
  const words = countWords(content);

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {topic ? (
            <Badge variant="secondary" style={{ borderColor: topic.color ?? undefined }}>
              {topic.title}
            </Badge>
          ) : null}
          <span className="text-muted-foreground text-xs tabular-nums">{words} kata</span>
          {saveState === "saving" ? (
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              <Loader2 className="size-3 animate-spin" /> Menyimpan…
            </span>
          ) : null}
          {saveState === "saved" ? (
            <span className="flex items-center gap-1 text-emerald-600 text-xs">
              <Check className="size-3" /> Tersimpan
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={entry?.mood ?? "none"}
            onValueChange={(v) => onChange({ mood: v === "none" ? null : (v as JournalMood) })}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tanpa mood</SelectItem>
              {(Object.keys(MOOD_LABEL) as JournalMood[]).map((m) => (
                <SelectItem key={m} value={m}>
                  {MOOD_EMOJI[m]} {MOOD_LABEL[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entry?.status ?? "draft"} onValueChange={(v) => onChange({ status: v as JournalStatus })}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Publish</SelectItem>
            </SelectContent>
          </Select>
          {entry?.topic_id ? null : (
            <Select
              value={entry?.topic_id ? String(entry.topic_id) : "none"}
              onValueChange={(v) => onChange({ topic_id: v === "none" ? null : Number(v) })}
            >
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Topik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa topik</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="outline" onClick={() => void onSave()}>
            Simpan
          </Button>
          {entry && onDelete ? (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void onDelete()}>
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-y-auto bg-muted/20 px-4 py-8">
        <article
          className={cn(
            "w-full max-w-[820px] min-h-[600px] rounded-sm bg-background px-8 py-10 shadow-sm ring-1 ring-foreground/8 sm:px-14 sm:py-12",
            "dark:bg-[#1e1e1e]",
          )}
        >
          {topic?.prompt ? (
            <p className="mb-6 border-primary/30 border-l-2 pl-4 text-muted-foreground text-sm italic leading-relaxed">
              {topic.prompt}
            </p>
          ) : null}
          <input
            className="mb-6 w-full border-0 bg-transparent font-semibold text-3xl tracking-tight outline-none placeholder:text-muted-foreground/50"
            placeholder="Judul essay"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
          <Textarea
            className="min-h-[480px] resize-none border-0 bg-transparent p-0 text-base leading-8 shadow-none focus-visible:ring-0"
            placeholder="Mulai menulis di sini…"
            value={content}
            onChange={(e) => onChange({ content: e.target.value })}
          />
        </article>
      </div>
    </div>
  );
}
