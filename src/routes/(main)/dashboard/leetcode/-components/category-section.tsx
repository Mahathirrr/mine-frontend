"use client";

import * as React from "react";

import { cn } from "cn";
import { CheckCircle2, ChevronRight, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { leetcodeUrl, type CategoryStat, type LeetCodeProblem, type ProblemStatus } from "@/lib/api/leetcode";

import { CategoryMaterialLinks } from "./category-material-links";
import { ProblemMaterialRef } from "./problem-material-ref";
import { ProblemNotesCell } from "./problem-notes-cell";
import { ProblemDoneCheckbox } from "./problem-status";

const DIFFICULTY_VARIANT: Record<string, "secondary" | "outline" | "destructive"> = {
  Easy: "secondary",
  Medium: "outline",
  Hard: "destructive",
};

type CategorySectionProps = {
  index: number;
  category: string;
  items: LeetCodeProblem[];
  catStat?: CategoryStat;
  savingId: number | null;
  defaultOpen?: boolean;
  onUpdate: (problem: LeetCodeProblem, patch: { status?: ProblemStatus; notes?: string | null }) => void;
};

export function CategorySection({
  index,
  category,
  items,
  catStat,
  savingId,
  defaultOpen = false,
  onUpdate,
}: CategorySectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const isComplete = catStat ? catStat.percent === 100 : false;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="overflow-hidden rounded-xl border">
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
        <ChevronRight
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
        />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <h3 className="flex min-w-0 items-center gap-2 truncate font-semibold text-sm">
            <span className="shrink-0 text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            {isComplete ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            ) : null}
            <span className="truncate">{category}</span>
          </h3>
          <span
            className={cn(
              "shrink-0 text-xs tabular-nums",
              isComplete ? "font-medium text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
            )}
          >
            {catStat ? `${catStat.solved}/${catStat.total} · ${catStat.percent}%` : `${items.length} soal`}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CategoryMaterialLinks category={category} />
          {catStat && catStat.total > 0 ? (
            <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block">
              <div
                className={cn("h-full rounded-full transition-all", isComplete ? "bg-emerald-500" : "bg-primary")}
                style={{ width: `${catStat.percent}%` }}
              />
            </div>
          ) : null}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <span className="sr-only">Selesai</span>
              </TableHead>
              <TableHead className="w-16">LC#</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead className="w-24">Level</TableHead>
              <TableHead className="w-12 text-center">
                <Tooltip>
                  <TooltipTrigger
                    render={<span className="cursor-help underline decoration-dotted underline-offset-2" />}
                  >
                    Catatan
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    Catatan pribadi per soal: pendekatan, kompleksitas, atau hal yang perlu di-review nanti.
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((problem) => (
                <TableRow key={problem.id} className="transition-colors hover:bg-muted/30">
                  <TableCell className="pr-0">
                    <ProblemDoneCheckbox
                      status={problem.status}
                      disabled={savingId === problem.id}
                      onChange={(status) => onUpdate(problem, { status })}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground tabular-nums">{problem.leetcode_id}</TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 truncate font-medium">{problem.title}</span>
                      <ProblemMaterialRef leetcodeId={problem.leetcode_id} />
                      {problem.is_premium ? (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          Premium
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={DIFFICULTY_VARIANT[problem.difficulty] ?? "outline"}>{problem.difficulty}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <ProblemNotesCell
                      problem={problem}
                      disabled={savingId === problem.id}
                      onSave={(notes) => onUpdate(problem, { notes })}
                    />
                  </TableCell>
                  <TableCell>
                    <a
                      href={leetcodeUrl(problem.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Buka di LeetCode"
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
}
