"use client";

import * as React from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InterviewQuestion, QuestionCategory } from "@/lib/api/interviews";

import { COMPANY_PREP_CATEGORY_LABEL, GENERAL_PREP_CATEGORIES, QUESTION_CATEGORY_LABEL } from "./interview-constants";

type CompanyImportGeneralDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generalQuestions: InterviewQuestion[];
  defaultCategory: QuestionCategory;
  importing: boolean;
  onImport: (questions: InterviewQuestion[]) => Promise<void>;
};

export function CompanyImportGeneralDialog({
  open,
  onOpenChange,
  generalQuestions,
  defaultCategory,
  importing,
  onImport,
}: CompanyImportGeneralDialogProps) {
  const [category, setCategory] = React.useState<QuestionCategory>(defaultCategory);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());

  const pool = React.useMemo(
    () => generalQuestions.filter((q) => !q.application_id && !q.source_guide && q.category === category),
    [category, generalQuestions],
  );

  React.useEffect(() => {
    if (!open) return;
    setCategory(defaultCategory);
    setSelected(new Set());
  }, [defaultCategory, open]);

  const allSelected = pool.length > 0 && pool.every((q) => selected.has(q.id));
  const selectAllId = "company-import-select-all";

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(pool.map((q) => q.id)) : new Set());
  }

  function toggleOne(id: number, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleImport() {
    const picked = pool.filter((q) => selected.has(q.id));
    if (picked.length === 0) return;
    await onImport(picked);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Impor dari materi umum</DialogTitle>
          <DialogDescription>
            Pilih soal dari bank umum untuk disalin ke perusahaan ini. Soal asli di materi umum tetap ada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {GENERAL_PREP_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              type="button"
              size="sm"
              variant={category === cat ? "default" : "outline"}
              className="h-8"
              onClick={() => {
                setCategory(cat);
                setSelected(new Set());
              }}
            >
              {QUESTION_CATEGORY_LABEL[cat]}
            </Button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border">
          {pool.length === 0 ? (
            <p className="p-4 text-muted-foreground text-sm">
              Belum ada soal {QUESTION_CATEGORY_LABEL[category].toLowerCase()} di materi umum.
            </p>
          ) : (
            <div className="divide-y">
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                <Checkbox id={selectAllId} checked={allSelected} onCheckedChange={(v) => toggleAll(v === true)} />
                <label htmlFor={selectAllId} className="cursor-pointer font-medium text-sm">
                  Pilih semua ({pool.length})
                </label>
              </div>
              {pool.map((q) => {
                const checkboxId = `company-import-q-${q.id}`;
                return (
                  <div key={q.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40">
                    <Checkbox
                      id={checkboxId}
                      className="mt-0.5"
                      checked={selected.has(q.id)}
                      onCheckedChange={(v) => toggleOne(q.id, v === true)}
                    />
                    <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer">
                      <p className="font-medium text-sm leading-snug">{q.question}</p>
                      {q.answer_notes?.trim() ? (
                        <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">{q.answer_notes}</p>
                      ) : null}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <p className="text-muted-foreground text-xs">
            {selected.size} soal dipilih
            {category !== defaultCategory ? (
              <>
                {" "}
                · akan masuk sebagai{" "}
                <span className="font-medium text-foreground">
                  {COMPANY_PREP_CATEGORY_LABEL[defaultCategory] ?? QUESTION_CATEGORY_LABEL[defaultCategory]}
                </span>
              </>
            ) : null}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={importing}>
              Batal
            </Button>
            <Button type="button" disabled={importing || selected.size === 0} onClick={() => void handleImport()}>
              {importing ? <Loader2 className="animate-spin" /> : null}
              Impor {selected.size > 0 ? selected.size : ""} soal
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
