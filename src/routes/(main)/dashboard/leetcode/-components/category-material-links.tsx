import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { archiveHref, categoryHasMaterial, getArchiveForCategory } from "./leetcode-materials";

export function CategoryMaterialLinks({ category }: { category: string }) {
  const items = getArchiveForCategory(category);
  if (!categoryHasMaterial(category) || items.length === 0) return null;

  if (items.length === 1) {
    const item = items[0]!;
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
              render={
                <a
                  href={archiveHref(item.file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Buka arsip ${item.title}`}
                />
              }
            />
          }
        >
          <BookOpen className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="left">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={<DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground" />} />}
        >
          <BookOpen className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="left">Arsip materi kategori ini</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          {items.map((item) => (
            <DropdownMenuItem
              key={item.slug}
              render={
                <a href={archiveHref(item.file)} target="_blank" rel="noopener noreferrer" className="flex flex-col items-start gap-0.5" />
              }
            >
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground text-xs">{item.subtitle}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
