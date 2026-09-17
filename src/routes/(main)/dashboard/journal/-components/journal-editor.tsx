"use client";

import * as React from "react";

import { cn } from "cn";
import { Check, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { JournalEntry, JournalStatus, JournalTopic } from "@/lib/api/journal";

import { countWords } from "./journal-utils";

type SaveState = "idle" | "saving" | "saved" | "error";

type JournalEditorProps = {
  entry: JournalEntry | null;
  topic: JournalTopic | null;
  isBlankEssay?: boolean;
  onChange: (patch: { title?: string; content?: string; status?: JournalStatus }) => void;
  onSave: () => Promise<void>;
  onDelete?: () => Promise<void>;
  saveState: SaveState;
};

export function JournalEditor({
  entry,
  topic,
  isBlankEssay = false,
  onChange,
  onSave,
  onDelete,
  saveState,
}: JournalEditorProps) {
  const title = entry?.title ?? "";
  const content = entry?.content ?? "";
  const words = countWords(content);
  const showStatusControl = !isBlankEssay;

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
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
          {showStatusControl ? (
            <Select value={entry?.status ?? "draft"} onValueChange={(v) => onChange({ status: v as JournalStatus })}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Selesai</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
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

      <div className="flex flex-1 justify-center overflow-y-auto bg-muted/20 px-4 py-10 sm:px-6 sm:py-12">
        <article
          className={cn(
            "w-full max-w-[820px] min-h-[640px] rounded-md bg-background shadow-sm ring-1 ring-foreground/8",
            "px-8 py-12 sm:px-14 sm:py-14",
            "dark:bg-[#1e1e1e]",
          )}
        >
          {topic?.prompt ? (
            <p className="mb-8 rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 text-muted-foreground text-sm italic leading-relaxed">
              {topic.prompt}
            </p>
          ) : null}
          <input
            className="mb-8 w-full border-0 border-border/30 border-b bg-transparent pb-5 font-semibold text-3xl tracking-tight outline-none placeholder:text-muted-foreground/45"
            placeholder="Judul essay"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
          <Textarea
            className="min-h-[520px] resize-none border-0 bg-transparent px-1 py-2 text-[17px] leading-[1.9] shadow-none focus-visible:ring-0 sm:px-2 sm:py-3"
            placeholder="Mulai menulis di sini…"
            value={content}
            onChange={(e) => onChange({ content: e.target.value })}
          />
        </article>
      </div>
    </div>
  );
}
