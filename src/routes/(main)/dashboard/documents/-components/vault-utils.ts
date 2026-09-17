import { formatDistanceToNow, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import type { VaultFile, VaultFolder } from "@/lib/api/vault";

import type { FileKind, FileManagerFile, FileManagerFolder } from "../../file-manager/-components/data";

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

export function mimeToKind(mime: string): FileKind {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "design";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "spreadsheet";
  if (mime.includes("zip")) return "archive";
  return "document";
}

export function toManagerFolder(folder: VaultFolder): FileManagerFolder {
  return {
    id: String(folder.id),
    name: folder.name,
    fileCount: folder.file_count,
    size: formatFileSize(folder.size_bytes),
    updatedAt: folder.updated_at
      ? formatDistanceToNow(parseISO(folder.updated_at), { addSuffix: true, locale: idLocale })
      : "Belum ada file",
  };
}

export function toManagerFile(file: VaultFile, ownerName: string): FileManagerFile {
  const initials = ownerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return {
    id: String(file.id),
    name: file.name,
    kind: mimeToKind(file.mime_type),
    size: formatFileSize(file.size_bytes),
    owner: ownerName,
    ownerInitials: initials || "ME",
    modifiedAt: formatDistanceToNow(parseISO(file.updated_at), { addSuffix: true, locale: idLocale }),
    shared: false,
    starred: file.starred,
  };
}

export const categoryLabels: Record<string, string> = {
  identity: "Identitas",
  education: "Pendidikan",
  certificate: "Sertifikat",
  career: "Karier",
  legal: "Legal & SKCK",
  other: "Lainnya",
};
