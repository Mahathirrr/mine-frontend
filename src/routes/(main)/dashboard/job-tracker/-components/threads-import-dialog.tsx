"use client";

import * as React from "react";

import { Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { jobTrackerApi, type ThreadsIntelParse } from "@/lib/api/job-tracker";

const SIGNAL_TONE: Record<string, string> = {
  hiring: "border-emerald-500/40 bg-emerald-500/5",
  referral: "border-sky-500/40 bg-sky-500/5",
  action: "border-violet-500/40 bg-violet-500/5",
  warning: "border-amber-500/40 bg-amber-500/5",
  intel: "border-slate-500/40 bg-muted/50",
  benefit: "border-teal-500/40 bg-teal-500/5",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onImported: () => void;
};

export function ThreadsImportDialog({ open, onOpenChange, token, onImported }: Props) {
  const [rawText, setRawText] = React.useState("");
  const [postURL, setPostURL] = React.useState("");
  const [createInbox, setCreateInbox] = React.useState(true);
  const [preview, setPreview] = React.useState<ThreadsIntelParse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [duplicate, setDuplicate] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      setDuplicate(false);
    }
  }, [open]);

  async function handlePreview() {
    if (!rawText.trim() && !postURL.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const parsed = await jobTrackerApi.parseThreadsIntel(token, {
        raw_text: rawText,
        post_url: postURL,
      });
      setPreview(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menganalisis teks");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!rawText.trim() && !postURL.trim()) return;
    setImporting(true);
    setError(null);
    try {
      const res = await jobTrackerApi.importThreadsIntel(token, {
        raw_text: rawText,
        post_url: postURL,
        create_ingestion_item: createInbox,
      });
      setDuplicate(res.duplicate);
      setPreview(res.parsed);
      onImported();
      if (!res.duplicate) {
        setRawText("");
        setPostURL("");
        onOpenChange(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal impor");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4" /> Import dari Threads
          </DialogTitle>
          <DialogDescription>
            Tempel posting Threads (teks + link). Sistem mendeteksi keyword lamaran, link apply, perusahaan, lalu
            menyimpan thread + opsional inbox lowongan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="threads-url">Link post (opsional)</Label>
            <Input
              id="threads-url"
              placeholder="https://www.threads.net/@user/post/..."
              value={postURL}
              onChange={(e) => setPostURL(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="threads-text">Isi posting</Label>
            <Textarea
              id="threads-text"
              rows={6}
              placeholder="We're hiring… #loker link apply…"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="threads-inbox" checked={createInbox} onCheckedChange={(v) => setCreateInbox(Boolean(v))} />
            <Label htmlFor="threads-inbox" className="font-normal text-sm">
              Buat item inbox jika ada link lamaran
            </Label>
          </div>
        </div>

        {preview ? (
          <div className="space-y-3 rounded-lg border p-3 text-sm">
            <p className="font-medium">{preview.subject}</p>
            {preview.company_name ? (
              <p className="text-muted-foreground text-xs">Perusahaan: {preview.company_name}</p>
            ) : null}
            {preview.job_url ? (
              <a
                href={preview.job_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary text-xs hover:underline"
              >
                {preview.job_url}
              </a>
            ) : null}
            {preview.keywords.length > 0 ? (
              <ul className="space-y-2">
                {preview.keywords.map((k) => (
                  <li
                    key={k.id}
                    className={`rounded-md border px-2 py-1.5 ${SIGNAL_TONE[k.signal] ?? SIGNAL_TONE.intel}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {k.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{k.explanation}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-xs">Belum ada keyword katalog — teks tetap disimpan.</p>
            )}
          </div>
        ) : null}

        {duplicate ? (
          <p className="text-amber-700 text-sm dark:text-amber-300">Post ini sudah pernah diimpor (thread duplikat).</p>
        ) : null}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => void handlePreview()} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Pratinjau keyword"}
          </Button>
          <Button type="button" onClick={() => void handleImport()} disabled={importing}>
            {importing ? <Loader2 className="size-4 animate-spin" /> : "Simpan ke Threads"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
