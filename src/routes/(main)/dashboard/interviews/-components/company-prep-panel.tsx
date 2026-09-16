"use client";

import * as React from "react";

import { cn } from "cn";
import { BookOpen, Building2, FileUp, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  InterviewApplicationWithRounds,
  InterviewPrepGuide,
  InterviewQuestion,
  QuestionCategory,
} from "@/lib/api/interviews";

import { CompanyImportGeneralDialog } from "./company-import-general-dialog";
import { CompanyImportTxtDialog } from "./company-import-txt-dialog";
import {
  APP_STATUS_LABEL,
  APP_STATUS_TONE,
  COMPANY_PREP_CATEGORIES,
  COMPANY_PREP_CATEGORY_DESC,
  COMPANY_PREP_CATEGORY_LABEL,
  DEFAULT_TECH_GROUPS,
} from "./interview-constants";
import type { ParsedTxtQuestion } from "./parse-interview-txt";
import { PrepMaterialsPanel } from "./prep-materials-panel";
import { PrepProgressSummary } from "./prep-progress-summary";
import { QuestionBankList } from "./question-bank-list";

type CompanyPrepPanelProps = {
  applications: InterviewApplicationWithRounds[];
  prepGuides: InterviewPrepGuide[];
  questions: InterviewQuestion[];
  generalQuestions: InterviewQuestion[];
  selectedAppId: number | null;
  onSelectApp: (id: number) => void;
  onAddCompany: () => void;
  onAddQuestion: (ctx: { applicationId: number; category: QuestionCategory; techGroup?: string | null }) => void;
  onImportFromGeneral: (
    applicationId: number,
    items: InterviewQuestion[],
    targetCategory: QuestionCategory,
  ) => Promise<void>;
  onImportFromTxt: (applicationId: number, items: ParsedTxtQuestion[]) => Promise<void>;
  disabled?: boolean;
  importing?: boolean;
  onToggle: (q: InterviewQuestion, practiced: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export function CompanyPrepPanel({
  applications,
  prepGuides,
  questions,
  generalQuestions,
  selectedAppId,
  onSelectApp,
  onAddCompany,
  onAddQuestion,
  onImportFromGeneral,
  onImportFromTxt,
  disabled,
  importing,
  onToggle,
  onDelete,
}: CompanyPrepPanelProps) {
  const activeId = selectedAppId ?? applications[0]?.id ?? null;
  const application = applications.find((a) => a.id === activeId) ?? null;

  const [category, setCategory] = React.useState<QuestionCategory>("company");
  const [techGroup, setTechGroup] = React.useState("Umum");
  const [search, setSearch] = React.useState("");
  const [generalImportOpen, setGeneralImportOpen] = React.useState(false);
  const [txtImportOpen, setTxtImportOpen] = React.useState(false);
  const [referenceOpen, setReferenceOpen] = React.useState(false);

  const guidesForApp = prepGuides.filter((g) => g.application_id === activeId);
  const companyQuestions = React.useMemo(
    () => questions.filter((q) => q.application_id === activeId && !q.source_guide),
    [activeId, questions],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return companyQuestions.filter((item) => {
      if (item.category !== category) return false;
      if (category === "technical" && (item.tech_group ?? "Umum") !== techGroup) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        (item.answer_notes?.toLowerCase().includes(q) ?? false) ||
        (item.section_label?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [category, companyQuestions, search, techGroup]);

  const practicedAll = companyQuestions.filter((q) => q.is_practiced).length;
  const practicedFiltered = filtered.filter((q) => q.is_practiced).length;

  const techGroups = React.useMemo(() => {
    const fromData = companyQuestions
      .filter((q) => q.category === "technical" && q.tech_group)
      .map((q) => q.tech_group as string);
    return [...new Set([...DEFAULT_TECH_GROUPS, ...fromData])];
  }, [companyQuestions]);

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <Building2 className="size-10 text-muted-foreground/60" />
          <div>
            <p className="font-medium">Belum ada perusahaan</p>
            <p className="mt-1 max-w-md text-muted-foreground text-sm">
              Tambah lamaran dulu, lalu buat bank soal perusahaan: ketik manual, impor dari materi umum, atau impor file
              .txt.
            </p>
          </div>
          <Button onClick={onAddCompany}>
            <Plus />
            Tambah perusahaan
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!application) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Perusahaan</CardTitle>
          <CardDescription className="text-xs">Pilih lamaran untuk mengelola materi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 p-2 pt-0">
          {applications.map((app) => {
            const appQuestions = questions.filter((q) => q.application_id === app.id && !q.source_guide);
            const count = appQuestions.length;
            const practiced = appQuestions.filter((q) => q.is_practiced).length;
            const selected = app.id === activeId;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => onSelectApp(app.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                  selected ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50",
                )}
              >
                <p className="truncate font-medium text-sm">{app.company}</p>
                <p className="truncate text-muted-foreground text-xs">{app.role_title}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline" className={cn("text-[10px]", APP_STATUS_TONE[app.status])}>
                    {APP_STATUS_LABEL[app.status]}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] tabular-nums">
                    {practiced}/{count} latihan
                  </Badge>
                </div>
              </button>
            );
          })}
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={onAddCompany}>
            <Plus className="size-3.5" />
            Perusahaan baru
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">{application.company}</CardTitle>
              <CardDescription className="mt-1">
                {application.role_title}
                {application.location ? ` · ${application.location}` : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PrepProgressSummary
                practiced={practicedAll}
                total={companyQuestions.length}
                label="Semua soal perusahaan"
              />
              {guidesForApp.length > 0 ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setReferenceOpen(true)}>
                  <BookOpen className="size-3.5" />
                  Referensi paket
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setGeneralImportOpen(true)}
                disabled={disabled === true || importing === true}
              >
                <BookOpen className="size-3.5" />
                Dari materi umum
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setTxtImportOpen(true)}
                disabled={disabled === true || importing === true}
              >
                <FileUp className="size-3.5" />
                Dari .txt
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  onAddQuestion({
                    applicationId: application.id,
                    category,
                    techGroup: category === "technical" ? techGroup : null,
                  })
                }
                disabled={disabled}
              >
                <Plus className="size-3.5" />
                Tambah soal
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {COMPANY_PREP_CATEGORIES.map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={category === cat ? "default" : "outline"}
                className="h-8"
                onClick={() => setCategory(cat)}
              >
                {COMPANY_PREP_CATEGORY_LABEL[cat]}
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
            </div>
          ) : null}

          <p className="text-muted-foreground text-xs">{COMPANY_PREP_CATEGORY_DESC[category]}</p>

          <PrepProgressSummary
            practiced={practicedFiltered}
            total={filtered.length}
            label={`${COMPANY_PREP_CATEGORY_LABEL[category]}${category === "technical" ? ` · ${techGroup}` : ""}`}
            compact
            className="max-w-md"
          />

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
            showCategoryBadge={false}
            emptyMessage={`Belum ada soal ${COMPANY_PREP_CATEGORY_LABEL[category]?.toLowerCase() ?? ""}. Tambahkan manual, impor dari materi umum, atau impor file .txt.`}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        </CardContent>
      </Card>

      <CompanyImportGeneralDialog
        open={generalImportOpen}
        onOpenChange={setGeneralImportOpen}
        generalQuestions={generalQuestions}
        defaultCategory={category}
        importing={Boolean(importing)}
        onImport={async (items) => onImportFromGeneral(application.id, items, category)}
      />

      <CompanyImportTxtDialog
        open={txtImportOpen}
        onOpenChange={setTxtImportOpen}
        defaultCategory={category}
        importing={Boolean(importing)}
        onImport={async (items) => onImportFromTxt(application.id, items)}
      />

      <Dialog open={referenceOpen} onOpenChange={setReferenceOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Referensi paket impor</DialogTitle>
          </DialogHeader>
          <PrepMaterialsPanel
            application={application}
            guides={guidesForApp}
            questions={questions}
            disabled={disabled}
            onTogglePracticed={async (id, practiced) => {
              const q = questions.find((item) => item.id === id);
              if (q) await onToggle(q, practiced);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
