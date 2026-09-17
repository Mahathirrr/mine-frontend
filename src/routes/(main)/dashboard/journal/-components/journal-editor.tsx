"use client";

import * as React from "react";

import { cn } from "cn";
import { ArrowLeft, Check, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { JournalEntry, JournalStatus, JournalTopic } from "@/lib/api/journal";

import { countWords } from "./journal-utils";

type SaveState = "idle" | "saving" | "saved" | "error";

type JournalEditorProps = {
  entry: JournalEntry | null;
  topic: JournalTopic | null;
  isBlankEssay?: boolean;
  onBack?: () => void;
  onChange: (patch: { title?: string; content?: string; status?: JournalStatus }) => void;
  onSave: () => Promise<void>;
  onDelete?: () => Promise<void>;
  saveState: SaveState;
};

export function JournalEditor({
  entry,
  topic,
  isBlankEssay = false,
  onBack,
  onChange,
  onSave,
  onDelete,
  saveState,
}: JournalEditorProps) {
  const title = entry?.title ?? "";
  const content = entry?.content ?? "";
  const words = countWords(content);
  const showStatusControl = !isBlankEssay;
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  const resizeBody = React.useCallback(() => {
    const node = bodyRef.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${Math.max(node.scrollHeight, 520)}px`;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: remeasure textarea when opening another entry
  React.useLayoutEffect(() => {
    resizeBody();
  }, [entry?.id, resizeBody]);

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-xl border bg-background/60">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background/90 px-4 py-2.5 backdrop-blur-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <Button size="sm" variant="ghost" className="shrink-0 gap-1.5 px-2" onClick={onBack}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
            <span className="tabular-nums">{words} kata</span>
            {saveState === "saving" ? (
              <span className="flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Menyimpan
              </span>
            ) : null}
            {saveState === "saved" ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <Check className="size-3" />
                Tersimpan
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showStatusControl ? (
            <Select value={entry?.status ?? "draft"} onValueChange={(v) => onChange({ status: v as JournalStatus })}>
              <SelectTrigger className="h-8 w-[130px] border-0 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Selesai</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => void onSave()}>
            Simpan
          </Button>
          {entry && onDelete ? (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void onDelete()}>
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex flex-1 justify-center overflow-y-auto bg-[#ececec] px-3 py-8 sm:px-6 sm:py-10 dark:bg-[#121212]">
        <article
          className={cn(
            "w-full max-w-[720px] shrink-0 rounded-sm bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_4px_8px_rgba(60,64,67,0.08)]",
            "min-h-[min(920px,calc(100vh-14rem))]",
            "px-10 py-14 sm:px-[72px] sm:py-16",
            "dark:bg-[#1a1a1a] dark:shadow-[0_2px_12px_rgba(0,0,0,0.45)]",
          )}
        >
          {topic?.prompt ? (
            <blockquote className="mb-10 border-primary/25 border-l-[3px] pl-5 text-[15px] text-muted-foreground leading-relaxed">
              {topic.prompt}
            </blockquote>
          ) : null}

          <input
            aria-label="Judul essay"
            className="mb-10 w-full border-0 bg-transparent font-normal text-[32px] text-foreground leading-[1.25] tracking-tight outline-none placeholder:text-muted-foreground/35 sm:text-[36px]"
            placeholder="Judul essay"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
          />

          <textarea
            ref={bodyRef}
            aria-label="Isi essay"
            className="block w-full resize-none border-0 bg-transparent p-0 text-[15px] text-foreground/92 leading-[1.85] outline-none placeholder:text-muted-foreground/35 focus:outline-none focus:ring-0 sm:text-[16px] sm:leading-[1.9]"
            placeholder="Mulai menulis di sini…"
            value={content}
            rows={1}
            onChange={(e) => {
              onChange({ content: e.target.value });
              requestAnimationFrame(resizeBody);
            }}
          />
        </article>
      </div>
    </div>
  );
}
