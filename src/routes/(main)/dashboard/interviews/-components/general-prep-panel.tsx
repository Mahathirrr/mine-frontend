"use client";

import * as React from "react";

import { cn } from "cn";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InterviewQuestion, QuestionCategory } from "@/lib/api/interviews";

import {
  DEFAULT_TECH_GROUPS,
  GENERAL_PREP_CATEGORIES,
  GENERAL_PREP_CATEGORY_DESC,
  QUESTION_CATEGORY_LABEL,
  TECH_GROUP_STORAGE_KEY,
} from "./interview-constants";
import { QuestionBankList } from "./question-bank-list";

type GeneralPrepPanelProps = {
  questions: InterviewQuestion[];
  disabled?: boolean;
  onAddQuestion: (ctx: {
    category: QuestionCategory;
    techGroup?: string | null;
    sectionLabel?: string | null;
  }) => void;
  onToggle: (q: InterviewQuestion, practiced: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

function loadTechGroups(): string[] {
  try {
    const raw = localStorage.getItem(TECH_GROUP_STORAGE_KEY);
    if (!raw) return [...DEFAULT_TECH_GROUPS];
    const parsed = JSON.parse(raw) as string[];
    return parsed.length > 0 ? parsed : [...DEFAULT_TECH_GROUPS];
  } catch {
    return [...DEFAULT_TECH_GROUPS];
  }
}

function saveTechGroups(groups: string[]) {
  localStorage.setItem(TECH_GROUP_STORAGE_KEY, JSON.stringify(groups));
}

export function GeneralPrepPanel({
  questions,
  disabled,
  onAddQuestion,
  onToggle,
  onDelete,
}: GeneralPrepPanelProps) {
  const [category, setCategory] = React.useState<QuestionCategory>("behavioral");
  const [techGroup, setTechGroup] = React.useState<string>("Umum");
  const [techGroups, setTechGroups] = React.useState<string[]>(() => loadTechGroups());
  const [search, setSearch] = React.useState("");
  const [addGroupOpen, setAddGroupOpen] = React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState("");

  const generalQuestions = React.useMemo(
    () => questions.filter((q) => !q.application_id && !q.source_guide),
    [questions],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return generalQuestions.filter((item) => {
      if (item.category !== category) return false;
      if (category === "technical" && (item.tech_group ?? "Umum") !== techGroup) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        (item.answer_notes?.toLowerCase().includes(q) ?? false) ||
        (item.section_label?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [generalQuestions, category, techGroup, search]);

  function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name || techGroups.includes(name)) return;
    const next = [...techGroups, name];
    setTechGroups(next);
    saveTechGroups(next);
    setTechGroup(name);
    setNewGroupName("");
    setAddGroupOpen(false);
  }

  return (
    <Card>
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">Materi umum</CardTitle>
            <CardDescription className="mt-1 max-w-xl">
              Bank soal reusable untuk semua lamaran: behavioral, teknis, system design, dan lainnya. Ceritakan diri
              masuk kategori Behavioral.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() =>
              onAddQuestion({
                category,
                techGroup: category === "technical" ? techGroup : null,
              })
            }
          >
            <Plus className="size-3.5" />
            Tambah soal
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {GENERAL_PREP_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              type="button"
              size="sm"
              variant={category === cat ? "default" : "outline"}
              className="h-8"
              onClick={() => setCategory(cat)}
            >
              {QUESTION_CATEGORY_LABEL[cat]}
            </Button>
          ))}
        </div>

        {category === "technical" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Grup teknis:</span>
            {techGroups.map((group) => (
              <Button
                key={group}
                type="button"
                size="sm"
                variant={techGroup === group ? "secondary" : "ghost"}
                className={cn("h-7 text-xs", techGroup === group && "font-medium")}
                onClick={() => setTechGroup(group)}
              >
                {group}
              </Button>
            ))}
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddGroupOpen(true)}>
              <Plus className="size-3" />
              Grup baru
            </Button>
          </div>
        ) : null}

        <p className="text-muted-foreground text-xs">{GENERAL_PREP_CATEGORY_DESC[category]}</p>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari soal atau jawaban..."
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <QuestionBankList
          questions={filtered}
          disabled={disabled}
          emptyMessage={`Belum ada soal ${QUESTION_CATEGORY_LABEL[category].toLowerCase()}${category === "technical" ? ` (${techGroup})` : ""}. Tambahkan bank soal pertamamu.`}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </CardContent>

      <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Grup teknis baru</DialogTitle>
            <DialogDescription>
              Contoh: Mobile, iOS, Android, Cloud. Hanya untuk kategori Teknis.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddGroup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tech-group-name">Nama grup</Label>
              <Input
                id="tech-group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Mobile"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAddGroupOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
