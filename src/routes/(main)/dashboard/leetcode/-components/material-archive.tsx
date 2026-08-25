"use client";

import * as React from "react";

import { Archive, BookOpen, ChevronDown, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { archiveHref, getFeaturedArchive, getModuleArchive, type MaterialArchiveItem } from "./leetcode-materials";

function MaterialActions({ item }: { item: MaterialArchiveItem }) {
  const href = archiveHref(item.file);

  return (
    <div className="flex flex-wrap gap-2">
      <Button nativeButton={false} size="sm" render={<a href={href} target="_blank" rel="noopener noreferrer" />}>
        <BookOpen />
        Buka PDF
      </Button>
      <Button
        nativeButton={false}
        size="sm"
        variant="outline"
        render={<a href={href} download target="_blank" rel="noopener noreferrer" />}
      >
        <Download />
        Unduh
      </Button>
    </div>
  );
}

function ArchiveItemCard({ item, compact = false }: { item: MaterialArchiveItem; compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-col gap-2 rounded-lg border p-3" : "flex flex-col gap-3 rounded-xl border p-4"}>
      <div>
        <p className="font-semibold text-sm">{item.title}</p>
        <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{item.subtitle}</p>
        {!compact ? (
          <p className="mt-2 text-muted-foreground text-xs tabular-nums">{item.pages} halaman</p>
        ) : null}
      </div>
      <MaterialActions item={item} />
    </div>
  );
}

export function MaterialArchive() {
  const [open, setOpen] = React.useState(false);
  const featured = getFeaturedArchive();
  const modules = getModuleArchive();

  if (featured.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Archive className="size-4 text-primary" />
          Arsip Materi
        </CardTitle>
        <CardDescription className="mt-1">
          Modul belajar roadmap LeetCode. Materi dasar dan referensi lengkap dalam PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {featured.map((item) => (
            <ArchiveItemCard key={item.slug} item={item} />
          ))}
        </div>

        {modules.length > 0 ? (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50">
              <span className="font-medium">Modul per topik ({modules.length})</span>
              <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((item) => (
                  <ArchiveItemCard key={item.slug} item={item} compact />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </CardContent>
    </Card>
  );
}
