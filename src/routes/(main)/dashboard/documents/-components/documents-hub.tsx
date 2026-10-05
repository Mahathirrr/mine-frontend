"use client";

import * as React from "react";

import { Link } from "@tanstack/react-router";

import { FolderPlus, Grid2X2, List, Loader2, Upload, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { VaultOverview } from "@/lib/api/vault";
import { vaultApi } from "@/lib/api/vault";
import { useAuthStore } from "@/stores/auth/auth-provider";

import type { FileManagerView } from "../../file-manager/-components/data";
import { FileGridView } from "../../file-manager/-components/file-grid-view";
import { FileListView } from "../../file-manager/-components/file-list-view";
import { FileManagerToolbar } from "../../file-manager/-components/file-manager-toolbar";
import { FoldersSection } from "../../file-manager/-components/folders-section";
import { formatFileSize, toManagerFile, toManagerFolder } from "./vault-utils";

type Props = {
  activeView: FileManagerView;
  folderId: number | null;
  onFolderChange: (folderId: number | null) => void;
};

export function DocumentsHub({ activeView, folderId, onFolderChange }: Props) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [data, setData] = React.useState<VaultOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "starred">("all");
  const [sort, setSort] = React.useState<"modified" | "name" | "size">("modified");
  const [uploading, setUploading] = React.useState(false);
  const [folderOpen, setFolderOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setData(
        await vaultApi.overview(token, {
          folderId: folderId ?? undefined,
          q: search.trim() || undefined,
          filter: filter === "starred" ? "starred" : undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat dokumen");
    } finally {
      setLoading(false);
    }
  }, [token, folderId, search, filter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const ownerName = user?.name ?? "Saya";

  const managerFolders = React.useMemo(() => (data?.folders ?? []).map(toManagerFolder), [data?.folders]);

  const managerFiles = React.useMemo(() => {
    const rows = (data?.files ?? []).map((file) => toManagerFile(file, ownerName));
    return [...rows].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return parseSize(a.size) - parseSize(b.size);
      return 0;
    });
  }, [data?.files, ownerName, sort]);

  const activeFolder = data?.folders.find((f) => f.id === folderId) ?? null;

  async function handleUpload(files: FileList | null) {
    if (!token || !files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await vaultApi.upload(token, file, { folderId: folderId ?? undefined });
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleToggleStar(fileId: string) {
    if (!token || !data) return;
    const row = data.files.find((f) => String(f.id) === fileId);
    if (!row) return;
    await vaultApi.updateFile(token, row.id, { starred: !row.starred });
    await load();
  }

  async function handleDownload(fileId: string) {
    if (!token || !data) return;
    const row = data.files.find((f) => String(f.id) === fileId);
    if (!row) return;
    await vaultApi.download(token, row.id, row.original_name);
  }

  async function handleDelete(fileId: string) {
    if (!token) return;
    await vaultApi.deleteFile(token, Number(fileId));
    await load();
  }

  async function handleCreateFolder() {
    if (!token || !newFolderName.trim()) return;
    await vaultApi.createFolder(token, { name: newFolderName.trim() });
    setNewFolderName("");
    setFolderOpen(false);
    await load();
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Gagal memuat arsip dokumen</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl leading-none tracking-tight">Dokumen Penting</h1>
            {data && (
              <Badge variant="outline" className="font-normal">
                {data.stats.total_files} file · {formatFileSize(data.stats.total_bytes)}
              </Badge>
            )}
          </div>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Arsip aman untuk KTP, KK, sertifikat LIDM/DBS, CV, portfolio PDF, SKCK, ijazah, transkrip, dan dokumen
            penting lainnya.
          </p>
          {activeFolder && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Folder aktif:</span>
              <Badge>{activeFolder.name}</Badge>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onFolderChange(null)}>
                <X className="size-3.5" />
                Semua
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.zip"
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <Button variant="outline" onClick={() => setFolderOpen(true)}>
            <FolderPlus data-icon="inline-start" />
            Folder baru
          </Button>
          <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            {uploading ? "Mengupload..." : "Upload"}
          </Button>
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <FileManagerToolbar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
      />

      <FoldersSection
        folders={managerFolders}
        activeFolderId={folderId ? String(folderId) : null}
        onOpenFolder={(id) => onFolderChange(Number(id))}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-medium text-lg">{activeFolder ? activeFolder.name : "Semua dokumen"}</h2>
          <ToggleGroup variant="outline" size="sm" spacing={0} value={[activeView]} aria-label="File view">
            <ToggleGroupItem
              value="grid"
              nativeButton={false}
              render={
                <Link from="/dashboard/documents" search={(previous) => ({ ...previous, view: "grid" })} replace />
              }
            >
              <Grid2X2 />
              Grid
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              nativeButton={false}
              render={
                <Link from="/dashboard/documents" search={(previous) => ({ ...previous, view: "list" })} replace />
              }
            >
              <List />
              List
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {managerFiles.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="font-medium">Belum ada dokumen di folder ini</p>
            <p className="mt-1 text-muted-foreground text-sm">
              Upload KTP, sertifikat, CV, atau PDF penting lainnya. File akan otomatis masuk ke folder yang sesuai.
            </p>
            <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
              <Upload data-icon="inline-start" />
              Upload dokumen
            </Button>
          </div>
        ) : activeView === "list" ? (
          <FileListView
            files={managerFiles}
            onToggleStar={(id) => void handleToggleStar(id)}
            onDownload={(id) => void handleDownload(id)}
            onDelete={(id) => void handleDelete(id)}
          />
        ) : (
          <FileGridView
            files={managerFiles}
            onToggleStar={(id) => void handleToggleStar(id)}
            onDownload={(id) => void handleDownload(id)}
            onDelete={(id) => void handleDelete(id)}
          />
        )}
      </div>

      <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Folder baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="folder-name">Nama folder</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Mis. Lamaran 2026"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderOpen(false)}>
              Batal
            </Button>
            <Button onClick={() => void handleCreateFolder()} disabled={!newFolderName.trim()}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function parseSize(label: string): number {
  const [value, unit] = label.split(" ");
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  switch (unit) {
    case "GB":
      return n * 1024 * 1024 * 1024;
    case "MB":
      return n * 1024 * 1024;
    case "KB":
      return n * 1024;
    default:
      return n;
  }
}
