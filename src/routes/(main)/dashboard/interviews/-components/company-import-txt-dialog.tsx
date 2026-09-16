"use client";

import * as React from "react";

import { ChevronDown, FileUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionCategory } from "@/lib/api/interviews";

import { COMPANY_PREP_CATEGORIES, COMPANY_PREP_CATEGORY_LABEL } from "./interview-constants";
import { INTERVIEW_TXT_FORMAT_HELP, type ParsedTxtQuestion, parseInterviewTxt } from "./parse-interview-txt";

type CompanyImportTxtDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory: QuestionCategory;
  importing: boolean;
  onImport: (items: ParsedTxtQuestion[]) => Promise<void>;
};

export function CompanyImportTxtDialog({
  open,
  onOpenChange,
  defaultCategory,
  importing,
  onImport,
}: CompanyImportTxtDialogProps) {
  const [text, setText] = React.useState("");
  const [fallbackCategory, setFallbackCategory] = React.useState<QuestionCategory>(defaultCategory);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<ParsedTxtQuestion[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setText("");
    setFallbackCategory(defaultCategory);
    setParseError(null);
    setPreview([]);
  }, [defaultCategory, open]);

  function handleParse(nextText: string, category: QuestionCategory = fallbackCategory) {
    setText(nextText);
    if (!nextText.trim()) {
      setPreview([]);
      setParseError(null);
      return;
    }
    try {
      const parsed = parseInterviewTxt(nextText, category);
      if (parsed.length === 0) {
        setPreview([]);
        setParseError("Tidak ada soal valid. Pastikan format Q: dan A: benar.");
        return;
      }
      setPreview(parsed);
      setParseError(null);
    } catch {
      setPreview([]);
      setParseError("Gagal membaca file. Periksa format teks.");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setParseError("Hanya file .txt yang didukung.");
      return;
    }
    const content = await file.text();
    handleParse(content);
    e.target.value = "";
  }

  async function handleImport() {
    if (preview.length === 0) return;
    await onImport(preview);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="space-y-1 border-b px-6 py-5">
          <DialogTitle>Impor dari file .txt</DialogTitle>
          <DialogDescription>
            Unggah atau tempel teks berisi pertanyaan dan jawaban. Format sederhana — tidak perlu JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="txt-fallback-category">Kategori default (jika tanpa # judul)</Label>
              <Select
                value={fallbackCategory}
                onValueChange={(v) => {
                  if (!v) return;
                  const nextCategory = v as QuestionCategory;
                  setFallbackCategory(nextCategory);
                  handleParse(text, nextCategory);
                }}
              >
                <SelectTrigger id="txt-fallback-category" className="h-9 w-full">
                  <SelectValue>{COMPANY_PREP_CATEGORY_LABEL[fallbackCategory]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_PREP_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {COMPANY_PREP_CATEGORY_LABEL[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="txt-upload">Unggah file</Label>
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full gap-2 px-3 sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="size-4 shrink-0" />
                Pilih file .txt
              </Button>
              <input
                ref={fileInputRef}
                id="txt-upload"
                type="file"
                accept=".txt,text/plain"
                className="sr-only"
                onChange={(e) => void handleFileChange(e)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="txt-content">Isi file</Label>
            <Textarea
              id="txt-content"
              value={text}
              onChange={(e) => handleParse(e.target.value)}
              rows={12}
              placeholder={
                "# Pengetahuan Perusahaan\nQ: Apa yang kamu tahu tentang perusahaan ini?\nA: Jawaban kamu...\n\n# HRD & Non-Teknis\nQ: Ceritakan tentang diri kamu\nA: Jawaban STAR..."
              }
              className="min-h-[220px] font-mono text-xs leading-relaxed"
            />
          </div>

          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm">
              <span className="font-medium">Lihat contoh format .txt</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded-lg border bg-muted/30 p-4">
                <pre className="whitespace-pre-wrap text-[11px] text-muted-foreground leading-relaxed">
                  {INTERVIEW_TXT_FORMAT_HELP}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-medium text-sm">Pratinjau</p>
              <span className="text-muted-foreground text-xs tabular-nums">{preview.length} soal</span>
            </div>
            {parseError ? <p className="text-destructive text-sm">{parseError}</p> : null}
            {!parseError && preview.length === 0 ? (
              <p className="text-muted-foreground text-sm">Pratinjau muncul otomatis setelah teks valid dibaca.</p>
            ) : null}
            {preview.length > 0 ? (
              <ul className="max-h-48 space-y-3 overflow-y-auto text-sm">
                {preview.slice(0, 10).map((item) => (
                  <li key={`${item.category}:${item.question}`} className="rounded-lg border bg-muted/20 p-3">
                    <div className="mb-1 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                        {COMPANY_PREP_CATEGORY_LABEL[item.category] ?? item.category}
                      </span>
                    </div>
                    <p className="font-medium leading-snug">{item.question}</p>
                    <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">{item.answer || "—"}</p>
                  </li>
                ))}
                {preview.length > 10 ? (
                  <li className="text-center text-muted-foreground text-xs">+{preview.length - 10} soal lainnya</li>
                ) : null}
              </ul>
            ) : null}
          </div>
        </div>

        <DialogFooter className="-mx-0 -mb-0 shrink-0 gap-3 border-t bg-muted/50 px-6 py-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={importing}>
            Batal
          </Button>
          <Button type="button" disabled={importing || preview.length === 0} onClick={() => void handleImport()}>
            {importing ? <Loader2 className="animate-spin" /> : null}
            Impor {preview.length > 0 ? preview.length : ""} soal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
