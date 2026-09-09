import { FileText } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { fullPdfPageHref, getProblemMaterial } from "./leetcode-materials";

export function ProblemMaterialRef({ leetcodeId }: { leetcodeId: number }) {
  const ref = getProblemMaterial(leetcodeId);
  if (!ref) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={fullPdfPageHref(ref.pageFull)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground text-xs tabular-nums transition-colors hover:bg-muted hover:text-foreground"
          />
        }
      >
        <FileText className="size-3" />
        Hal. {ref.pageFull}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {ref.moduleTitle} · halaman {ref.pageFull} di modul lengkap
      </TooltipContent>
    </Tooltip>
  );
}
