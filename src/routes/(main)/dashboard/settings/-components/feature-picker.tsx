"use client";

import { cn } from "cn";
import { Check } from "lucide-react";

import { mineMenuCatalog } from "@/lib/navigation/mine-menu-catalog";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

const iconById = new Map(
  sidebarItems
    .find((g) => g.id === 0)
    ?.items.filter((item) => "url" in item)
    .map((item) => [item.id, item.icon] as const),
);

type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
};

export function FeaturePicker({ selected, onChange }: Props) {
  const selectedSet = new Set(selected);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }
    onChange([...selected, id]);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {mineMenuCatalog.map((item) => {
        const active = selectedSet.has(item.id);
        const Icon = iconById.get(item.id);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => toggle(item.id)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              active ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-border/80 hover:bg-muted/40",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{item.title}</p>
                  <p className="mt-1 text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                )}
              >
                {active && <Check className="size-3" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
