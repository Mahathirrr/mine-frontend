"use client";

import * as React from "react";

import { cn } from "cn";
import { StickyNote } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LeetCodeProblem } from "@/lib/api/leetcode";

const MAX_NOTES_LENGTH = 2000;

type ProblemNotesCellProps = {
  problem: LeetCodeProblem;
  disabled?: boolean;
  onSave: (notes: string | null) => void;
};

export function ProblemNotesCell({ problem, disabled, onSave }: ProblemNotesCellProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(problem.notes ?? "");
  const savedNotes = problem.notes?.trim() ?? "";
  const hasNote = savedNotes.length > 0;

  React.useEffect(() => {
    if (!open) {
      setDraft(problem.notes ?? "");
    }
  }, [problem.notes, open]);

  const commit = React.useCallback(() => {
    const value = draft.trim();
    if (value !== savedNotes) {
      onSave(value || null);
    }
  }, [draft, onSave, savedNotes]);

  const handleOpenChange = (next: boolean) => {
    if (!next && open) {
      commit();
    }
    setOpen(next);
  };

  const handleClear = () => {
    setDraft("");
    onSave(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip disabled={open}>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  aria-label={hasNote ? "Lihat catatan" : "Tambah catatan"}
                  className={cn(
                    "relative text-muted-foreground hover:text-foreground",
                    hasNote && "text-amber-600 dark:text-amber-400",
                  )}
                />
              }
            />
          }
        >
          <StickyNote className={cn("size-4", hasNote && "fill-amber-400/80")} />
          {hasNote ? (
            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-500" aria-hidden />
          ) : null}
        </TooltipTrigger>
        <TooltipContent side="top">{hasNote ? "Lihat catatan" : "Tambah catatan"}</TooltipContent>
      </Tooltip>

      <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] gap-3 p-4" align="end" side="left">
        <PopoverHeader className="gap-1">
          <PopoverTitle>Catatan pribadi</PopoverTitle>
          <PopoverDescription>
            LC {problem.leetcode_id} · {problem.title}
          </PopoverDescription>
        </PopoverHeader>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Catatan untuk diri sendiri: pendekatan/algoritma, kompleksitas, edge case, atau hal yang perlu di-review
          sebelum ujian.
        </p>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_NOTES_LENGTH))}
          placeholder="Contoh: DP bottom-up O(m·n). Base case: baris/kolom pertama isi 1. Hati-hati overflow."
          rows={6}
          disabled={disabled}
          className="min-h-32 resize-y text-sm leading-relaxed"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              commit();
              setOpen(false);
            }
          }}
        />

        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs tabular-nums">
            {draft.length}/{MAX_NOTES_LENGTH}
            <span className="ml-2 hidden sm:inline">· Ctrl+Enter simpan</span>
          </span>
          <div className="flex shrink-0 gap-2">
            {hasNote ? (
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={handleClear}>
                Hapus
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={disabled}
              onClick={() => {
                commit();
                setOpen(false);
              }}
            >
              Simpan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
