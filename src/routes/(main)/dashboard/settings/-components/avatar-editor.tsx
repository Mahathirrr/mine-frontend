"use client";

import * as React from "react";

import { Camera, Loader2, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/api/client";
import { getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth/auth-provider";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

type AvatarEditorProps = {
  user: User | null;
};

export function AvatarEditor({ user }: AvatarEditorProps) {
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar);
  const deleteAvatar = useAuthStore((s) => s.deleteAvatar);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const displayUrl = previewUrl ?? user?.avatar?.full_url ?? undefined;
  const hasAvatar = Boolean(user?.has_avatar) || previewUrl !== null;

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Hanya file gambar (JPG, PNG, WEBP) yang didukung.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Ukuran maksimal 5 MB.");
      return;
    }

    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return localPreview;
    });

    setUploading(true);
    try {
      await uploadAvatar(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch (err) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setError(err instanceof Error ? err.message : "Gagal mengunggah foto");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!hasAvatar || removing) return;
    setRemoving(true);
    setError(null);
    try {
      await deleteAvatar();
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus foto");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative">
        <Avatar className="size-24 rounded-xl">
          <AvatarImage src={displayUrl} alt={user?.name ?? "Profile"} className="rounded-xl" />
          <AvatarFallback className="rounded-xl text-lg">{getInitials(user?.name ?? "?")}</AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <p className="font-medium text-sm">Foto profil</p>
        <p className="text-muted-foreground text-sm">
          JPG, PNG, atau WEBP. Maks. 5 MB. Otomatis di-resize (512px) dan dikompresi untuk thumbnail sidebar.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || removing}
            onClick={() => inputRef.current?.click()}
          >
            <Camera data-icon="inline-start" />
            {hasAvatar ? "Ganti foto" : "Unggah foto"}
          </Button>
          {hasAvatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading || removing}
              onClick={() => void handleRemove()}
            >
              <Trash2 data-icon="inline-start" />
              {removing ? "Menghapus..." : "Hapus"}
            </Button>
          )}
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>

      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => void handleFileChange(e)} />
    </div>
  );
}
