"use client";

import * as React from "react";

import { Download, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { interviewsApi, type PrepPackCatalogItem } from "@/lib/api/interviews";

type ImportPrepDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onImported: () => Promise<void>;
};

export function ImportPrepDialog({ open, onOpenChange, token, onImported }: ImportPrepDialogProps) {
  const [packs, setPacks] = React.useState<PrepPackCatalogItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [importingSlug, setImportingSlug] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !token) return;
    setLoading(true);
    void interviewsApi
      .listPrepPacks(token)
      .then((res) => setPacks(res.packs))
      .finally(() => setLoading(false));
  }, [open, token]);

  async function handleImport(slug: string) {
    setImportingSlug(slug);
    try {
      await interviewsApi.importPrepPack(token, slug);
      await onImported();
      onOpenChange(false);
    } finally {
      setImportingSlug(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Impor materi persiapan</DialogTitle>
          <DialogDescription>
            Pilih paket materi untuk perusahaan tertentu. Setiap paket membuat lamaran + modul persiapan wawancara.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Memuat katalog...
          </div>
        ) : packs.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">Belum ada paket materi tersedia.</p>
        ) : (
          <div className="space-y-3">
            {packs.map((pack) => (
              <div key={pack.slug} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-sm">{pack.title}</p>
                      {pack.imported ? <Badge variant="secondary">Sudah diimpor</Badge> : null}
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">{pack.company}</p>
                    <p className="mt-1 text-muted-foreground text-xs">{pack.role_title}</p>
                    {pack.description ? (
                      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{pack.description}</p>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant={pack.imported ? "outline" : "default"}
                    disabled={pack.imported || importingSlug !== null}
                    onClick={() => void handleImport(pack.slug)}
                  >
                    {importingSlug === pack.slug ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    {pack.imported ? "Diimpor" : "Impor"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
