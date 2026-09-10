"use client";

import * as React from "react";

import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import type { InterviewQuestion } from "@/lib/api/interviews";

import { QUESTION_CATEGORY_LABEL } from "./interview-constants";
import { formatDate } from "./interview-utils";

type QuestionBankListProps = {
  questions: InterviewQuestion[];
  disabled?: boolean;
  emptyMessage?: string;
  onToggle: (q: InterviewQuestion, practiced: boolean) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
};

export function QuestionBankList({
  questions,
  disabled,
  emptyMessage = "Belum ada soal di kategori ini.",
  onToggle,
  onDelete,
}: QuestionBankListProps) {
  const [openIds, setOpenIds] = React.useState<Record<number, boolean>>({});

  if (questions.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  const practiced = questions.filter((q) => q.is_practiced).length;

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        {practiced}/{questions.length} sudah dipraktikkan
      </p>
      <div className="space-y-2">
        {questions.map((q) => {
          const hasAnswer = Boolean(q.answer_notes?.trim());
          const isOpen = openIds[q.id] ?? false;
          return (
            <Collapsible
              key={q.id}
              open={isOpen}
              onOpenChange={(open) => setOpenIds((prev) => ({ ...prev, [q.id]: open }))}
            >
              <div className="rounded-xl border">
                <div className="flex items-start gap-3 p-3">
                  <Switch
                    checked={q.is_practiced}
                    onCheckedChange={(v) => void onToggle(q, v)}
                    disabled={disabled}
                    aria-label="Sudah dipraktikkan"
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {QUESTION_CATEGORY_LABEL[q.category]}
                      </Badge>
                      {q.tech_group ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {q.tech_group}
                        </Badge>
                      ) : null}
                      {q.section_label ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {q.section_label}
                        </Badge>
                      ) : null}
                      {q.is_practiced ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          Sudah latihan
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 font-medium text-sm leading-snug">{q.question}</p>
                    {hasAnswer ? (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="mt-1 h-7 gap-1 px-2 text-xs">
                          <ChevronDown className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          {isOpen ? "Sembunyikan jawaban" : "Lihat jawaban"}
                        </Button>
                      </CollapsibleTrigger>
                    ) : (
                      <p className="mt-2 text-muted-foreground text-xs italic">Belum ada catatan jawaban.</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">Diperbarui {formatDate(q.updated_at)}</p>
                  </div>
                  {onDelete ? (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => void onDelete(q.id)}
                      disabled={disabled}
                      aria-label="Hapus soal"
                    >
                      <XCircle className="size-4 text-muted-foreground" />
                    </Button>
                  ) : null}
                </div>
                {hasAnswer ? (
                  <CollapsibleContent>
                    <div className="border-t bg-muted/30 px-3 py-3">
                      <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">Jawaban</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{q.answer_notes}</p>
                    </div>
                  </CollapsibleContent>
                ) : null}
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
