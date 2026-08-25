"use client";

import * as React from "react";

import { cn } from "cn";
import { CheckCircle2, ChevronDown, Copy, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type {
  InterviewApplicationWithRounds,
  InterviewPrepGuide,
  InterviewQuestion,
  PrepSection,
} from "@/lib/api/interviews";

type PrepMaterialsPanelProps = {
  application: InterviewApplicationWithRounds;
  guides: InterviewPrepGuide[];
  questions: InterviewQuestion[];
  disabled?: boolean;
  onTogglePracticed: (questionId: number, practiced: boolean) => Promise<void>;
};

function questionLookup(questions: InterviewQuestion[], guideSlug: string, item: { question: string; number: number }) {
  return (
    questions.find((q) => q.source_key === `${guideSlug}:${item.number}`) ??
    questions.find((q) => q.source_guide === guideSlug && q.question.trim() === item.question.trim()) ??
    null
  );
}

export function PrepMaterialsPanel({
  application,
  guides,
  questions,
  disabled,
  onTogglePracticed,
}: PrepMaterialsPanelProps) {
  const [activeGuide, setActiveGuide] = React.useState(guides[0]?.slug ?? "company-knowledge");
  const [search, setSearch] = React.useState("");
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

  const orderedGuides = React.useMemo(() => [...guides].sort((a, b) => a.id - b.id), [guides]);

  const guide = orderedGuides.find((g) => g.slug === activeGuide) ?? orderedGuides[0];
  const guideQuestions = questions.filter((q) => q.application_id === application.id && q.source_guide);
  const practiced = guideQuestions.filter((q) => q.is_practiced).length;
  const total = guideQuestions.length;
  const pct = total > 0 ? Math.round((practiced / total) * 100) : 0;

  const q = search.trim().toLowerCase();

  function sectionMatches(section: PrepSection) {
    if (!q) return true;
    if (section.kind === "glossary") {
      return section.entries.some((e) => e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q));
    }
    if (section.kind === "scripts") {
      return section.scripts.some((s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q));
    }
    return section.items.some(
      (item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
    );
  }

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (!guide) return null;

  return (
    <Card>
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base">Materi persiapan</CardTitle>
            <CardDescription className="mt-1">
              {application.role_title}
              {application.location ? ` · ${application.location}` : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 rounded-xl border px-3 py-2">
            <div className="text-right">
              <p className="font-semibold text-sm tabular-nums">
                {practiced}/{total} dipraktikkan
              </p>
              <p className="text-muted-foreground text-xs">{pct}% siap</p>
            </div>
            <div className="relative size-11">
              <svg viewBox="0 0 36 36" className="size-11 -rotate-90" role="img" aria-label="Progress persiapan">
                <title>Progress persiapan</title>
                <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className="stroke-emerald-500"
                  strokeWidth="3"
                  strokeDasharray={`${pct} 100`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {orderedGuides.map((g) => (
              <Button
                key={g.slug}
                size="sm"
                variant={g.slug === guide.slug ? "default" : "outline"}
                onClick={() => setActiveGuide(g.slug)}
              >
                {g.title}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:ml-auto sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari istilah atau pertanyaan..."
              className="pl-9"
            />
          </div>
        </div>
        {guide.subtitle ? <p className="text-muted-foreground text-sm">{guide.subtitle}</p> : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {guide.sections.filter(sectionMatches).map((section) => (
          <SectionBlock
            key={`${guide.slug}-${section.id}`}
            section={section}
            guideSlug={guide.slug}
            questions={questions}
            open={openSections[`${guide.slug}-${section.id}`] ?? section.kind !== "glossary"}
            onOpenChange={() => toggleSection(`${guide.slug}-${section.id}`)}
            disabled={disabled}
            onTogglePracticed={onTogglePracticed}
            search={q}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function SectionBlock({
  section,
  guideSlug,
  questions,
  open,
  onOpenChange,
  disabled,
  onTogglePracticed,
  search,
}: {
  section: PrepSection;
  guideSlug: string;
  questions: InterviewQuestion[];
  open: boolean;
  onOpenChange: () => void;
  disabled?: boolean;
  onTogglePracticed: (questionId: number, practiced: boolean) => Promise<void>;
  search: string;
}) {
  const count =
    section.kind === "glossary"
      ? section.entries.length
      : section.kind === "scripts"
        ? section.scripts.length
        : section.items.length;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="rounded-xl border">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
          <div className="min-w-0">
            <p className="font-medium text-sm">{section.title}</p>
            <p className="text-muted-foreground text-xs">{count} item</p>
          </div>
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t px-4 py-3">
          {section.kind === "glossary" ? <GlossaryGrid entries={section.entries} search={search} /> : null}
          {section.kind === "scripts" ? <ScriptsBlock scripts={section.scripts} search={search} /> : null}
          {section.kind === "qa" ? (
            <QAList
              items={section.items}
              guideSlug={guideSlug}
              questions={questions}
              disabled={disabled}
              onTogglePracticed={onTogglePracticed}
              search={search}
            />
          ) : null}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function GlossaryGrid({ entries, search }: { entries: { term: string; definition: string }[]; search: string }) {
  const filtered = entries.filter(
    (e) => !search || e.term.toLowerCase().includes(search) || e.definition.toLowerCase().includes(search),
  );

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {filtered.map((entry) => (
        <div key={entry.term} className="rounded-lg bg-muted/40 p-3">
          <p className="font-medium text-sm">{entry.term}</p>
          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{entry.definition}</p>
        </div>
      ))}
    </div>
  );
}

function ScriptsBlock({ scripts, search }: { scripts: { title: string; body: string }[]; search: string }) {
  return (
    <div className="space-y-3">
      {scripts
        .filter((s) => !search || s.title.toLowerCase().includes(search) || s.body.toLowerCase().includes(search))
        .map((script) => (
          <div key={script.title} className="rounded-lg border bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{script.title}</p>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Salin teks"
                onClick={() => void navigator.clipboard.writeText(script.body)}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">{script.body}</p>
          </div>
        ))}
    </div>
  );
}

function QAList({
  items,
  guideSlug,
  questions,
  disabled,
  onTogglePracticed,
  search,
}: {
  items: { number: number; question: string; answer: string }[];
  guideSlug: string;
  questions: InterviewQuestion[];
  disabled?: boolean;
  onTogglePracticed: (questionId: number, practiced: boolean) => Promise<void>;
  search: string;
}) {
  const filtered = items.filter(
    (item) =>
      !search ||
      item.question.toLowerCase().includes(search) ||
      item.answer.toLowerCase().includes(search) ||
      String(item.number).includes(search),
  );

  return (
    <div className="space-y-2">
      {filtered.map((item) => {
        const linked = questionLookup(questions, guideSlug, item);
        const practiced = linked?.is_practiced ?? false;

        return (
          <Collapsible key={`${guideSlug}-${item.number}`}>
            <div className="rounded-lg border">
              <div className="flex items-start gap-3 p-3">
                <Switch
                  checked={practiced}
                  disabled={disabled || !linked}
                  onCheckedChange={(v) => linked && void onTogglePracticed(linked.id, v)}
                  aria-label="Sudah dipraktikkan"
                />
                <CollapsibleTrigger className="min-w-0 flex-1 text-left">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5 shrink-0 tabular-nums">
                      {item.number}
                    </Badge>
                    <p className="font-medium text-sm leading-snug">{item.question}</p>
                  </div>
                  {practiced ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-emerald-600 text-xs dark:text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      Sudah latihan
                    </span>
                  ) : null}
                </CollapsibleTrigger>
                <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </div>
              <CollapsibleContent className="border-t px-4 py-3">
                <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">{item.answer}</p>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
