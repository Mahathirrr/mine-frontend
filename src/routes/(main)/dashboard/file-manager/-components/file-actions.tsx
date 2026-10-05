import { Download, MoreVertical, Share2, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { FileManagerFile } from "./data";

export function FileActions({
  file,
  onToggleStar,
  onDownload,
  onDelete,
}: {
  file: FileManagerFile;
  onToggleStar: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${file.name}`} />}>
        <MoreVertical />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onToggleStar}>
            <Star />
            {file.starred ? "Remove from starred" : "Add to starred"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDownload}>
            <Download />
            Download
          </DropdownMenuItem>
          {!onDelete && (
            <DropdownMenuItem>
              <Share2 />
              Copy share link
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
