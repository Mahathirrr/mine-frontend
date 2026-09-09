import { cn } from "cn";

import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProblemStatus } from "@/lib/api/leetcode";

/** Tracker cuma butuh dua state: belum vs selesai. */
export function normalizeStatus(status: ProblemStatus): "todo" | "solved" {
  return status === "solved" ? "solved" : "todo";
}

type ProblemDoneCheckboxProps = {
  status: ProblemStatus;
  disabled?: boolean;
  onChange: (status: "todo" | "solved") => void;
};

export function ProblemDoneCheckbox({ status, disabled, onChange }: ProblemDoneCheckboxProps) {
  const done = normalizeStatus(status) === "solved";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Checkbox
            checked={done}
            disabled={disabled}
            aria-label={done ? "Tandai belum selesai" : "Tandai selesai"}
            onCheckedChange={(checked) => onChange(checked ? "solved" : "todo")}
            className={cn(
              "size-[18px] rounded-full",
              done && "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500",
            )}
          />
        }
      />
      <TooltipContent side="right">{done ? "Sudah selesai" : "Tandai selesai"}</TooltipContent>
    </Tooltip>
  );
}
