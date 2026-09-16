"use client";

import * as React from "react";

import { FileUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Impor dari file .txt</DialogTitle>
          <DialogDescription>
            Tempel teks atau unggah file berisi pertanyaan dan jawaban. Tidak perlu JSON atau format teknis lain.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
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
                <SelectTrigger id="txt-fallback-category" className="w-full">
                  <SelectValue />
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
              <Button type="button" variant="outline" className="w-full justify-start" asChild>
                <label htmlFor="txt-upload" className="cursor-pointer">
                  <FileUp className="size-4" />
                  Pilih file .txt
                  <input
                    id="txt-upload"
                    type="file"
                    accept=".txt,text/plain"
                    className="sr-only"
                    onChange={(e) => void handleFileChange(e)}
                  />
                </label>
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="txt-content">Atau tempel isi file</Label>
              <Textarea
                id="txt-content"
                value={text}
                onChange={(e) => handleParse(e.target.value)}
                rows={10}
                placeholder={"# Pengetahuan Perusahaan\nQ: Apa yang kamu tahu tentang perusahaan?\nA: Jawaban..."}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="mb-2 font-medium text-xs">Format yang didukung</p>
              <pre className="whitespace-pre-wrap text-[11px] text-muted-foreground leading-relaxed">
                {INTERVIEW_TXT_FORMAT_HELP}
              </pre>
            </div>

            <div className="min-h-[120px] rounded-xl border p-3">
              <p className="mb-2 font-medium text-sm">Pratinjau ({preview.length} soal)</p>
              {parseError ? <p className="text-destructive text-sm">{parseError}</p> : null}
              {!parseError && preview.length === 0 ? (
                <p className="text-muted-foreground text-sm">Pratinjau muncul setelah teks valid dibaca.</p>
              ) : null}
              {preview.length > 0 ? (
                <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
                  {preview.slice(0, 8).map((item) => (
                    <li key={`${item.category}:${item.question}`} className="border-b pb-2 last:border-0">
                      <p className="font-medium leading-snug">{item.question}</p>
                      <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">{item.answer || "—"}</p>
                    </li>
                  ))}
                  {preview.length > 8 ? (
                    <li className="text-muted-foreground text-xs">+{preview.length - 8} soal lainnya</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter>
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
