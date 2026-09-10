"use client";

import * as React from "react";

import { cn } from "cn";
import { BookOpen, Building2, ClipboardList, Plus, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InterviewApplicationWithRounds, InterviewPrepGuide, InterviewQuestion } from "@/lib/api/interviews";

import { APP_STATUS_LABEL, APP_STATUS_TONE } from "./interview-constants";
import { PrepMaterialsPanel } from "./prep-materials-panel";
import { QuestionBankList } from "./question-bank-list";

type CompanyPrepPanelProps = {
  applications: InterviewApplicationWithRounds[];
  prepGuides: InterviewPrepGuide[];
  questions: InterviewQuestion[];
  selectedAppId: number | null;
  onSelectApp: (id: number) => void;
  onAddCompany: () => void;
  onImportPack: () => void;
  onAddCompanyQuestion: (applicationId: number) => void;
  disabled?: boolean;
  onTogglePracticed: (questionId: number, practiced: boolean) => Promise<void>;
  onDeleteQuestion: (id: number) => Promise<void>;
};

export function CompanyPrepPanel({
  applications,
  prepGuides,
  questions,
  selectedAppId,
  onSelectApp,
  onAddCompany,
  onImportPack,
  onAddCompanyQuestion,
  disabled,
  onTogglePracticed,
  onDeleteQuestion,
}: CompanyPrepPanelProps) {
  const activeId = selectedAppId ?? applications[0]?.id ?? null;
  const application = applications.find((a) => a.id === activeId) ?? null;
  const guidesForApp = prepGuides.filter((g) => g.application_id === activeId);
  const hasImportedPrep = guidesForApp.length > 0;
  const companyQuestions = questions.filter(
    (q) => q.application_id === activeId && !q.source_guide,
  );
  const packQuestionCount = questions.filter((q) => q.application_id === activeId && q.source_guide).length;

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <Building2 className="size-10 text-muted-foreground/60" />
          <div>
            <p className="font-medium">Belum ada perusahaan</p>
            <p className="mt-1 max-w-md text-muted-foreground text-sm">
              Tambah lamaran perusahaan, lalu isi materi spesifik perusahaan dan bank soal beserta jawabannya.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onAddCompany}>
              <Plus />
              Tambah perusahaan
            </Button>
            <Button variant="outline" onClick={onImportPack}>
              <BookOpen />
              Impor paket materi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Perusahaan</CardTitle>
          <CardDescription className="text-xs">Materi & bank soal per lamaran</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 p-2 pt-0">
          {applications.map((app) => {
            const guideCount = prepGuides.filter((g) => g.application_id === app.id).length;
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
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{app.company}</p>
                    <p className="truncate text-muted-foreground text-xs">{app.role_title}</p>
                  </div>
                  {guideCount > 0 ? <Sparkles className="size-3.5 shrink-0 text-amber-500" /> : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline" className={cn("text-[10px]", APP_STATUS_TONE[app.status])}>
                    {APP_STATUS_LABEL[app.status]}
                  </Badge>
                  {app.prep_pack_slug ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Paket
                    </Badge>
                  ) : null}
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

      {application ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base">{application.company}</h3>
              <p className="text-muted-foreground text-sm">{application.role_title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={onImportPack}>
                <BookOpen className="size-3.5" />
                Impor paket
              </Button>
              <Button size="sm" onClick={() => onAddCompanyQuestion(application.id)}>
                <ClipboardList className="size-3.5" />
                Tambah soal
              </Button>
            </div>
          </div>

          <Tabs defaultValue={hasImportedPrep ? "materials" : "bank"}>
            <TabsList>
              <TabsTrigger value="materials" className="gap-1.5">
                <BookOpen className="size-3.5" />
                Materi impor
                {hasImportedPrep ? (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 tabular-nums">
                    {guidesForApp.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="bank" className="gap-1.5">
                <ClipboardList className="size-3.5" />
                Bank soal
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 tabular-nums">
                  {companyQuestions.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="mt-4">
              {hasImportedPrep ? (
                <PrepMaterialsPanel
                  application={application}
                  guides={guidesForApp}
                  questions={questions}
                  disabled={disabled}
                  onTogglePracticed={onTogglePracticed}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <BookOpen className="size-9 text-muted-foreground/60" />
                    <div>
                      <p className="font-medium text-sm">Belum ada materi impor</p>
                      <p className="mt-1 max-w-sm text-muted-foreground text-xs">
                        Impor paket persiapan (glosarium, skrip HRD, bank soal teknis) atau tambah soal manual di tab
                        Bank soal.
                      </p>
                    </div>
                    <Button size="sm" onClick={onImportPack}>
                      Impor paket materi
                    </Button>
                  </CardContent>
                </Card>
              )}
              {packQuestionCount > 0 ? (
                <p className="mt-2 text-muted-foreground text-xs">
                  {packQuestionCount} soal dari paket impor tercatat untuk latihan (toggle di materi impor).
                </p>
              ) : null}
            </TabsContent>

            <TabsContent value="bank" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Bank soal perusahaan</CardTitle>
                  <CardDescription>
                    Soal khusus {application.company} yang kamu tambahkan sendiri, lengkap dengan jawaban.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuestionBankList
                    questions={companyQuestions}
                    disabled={disabled}
                    emptyMessage="Belum ada bank soal untuk perusahaan ini. Tambahkan pertanyaan dan jawaban yang spesifik ke role/perusahaan."
                    onToggle={async (q, practiced) => onTogglePracticed(q.id, practiced)}
                    onDelete={onDeleteQuestion}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </div>
  );
}
