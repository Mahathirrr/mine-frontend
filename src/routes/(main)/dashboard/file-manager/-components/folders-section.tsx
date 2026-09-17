import { cn } from "cn";
import { Clock, Folder, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

import type { FileManagerFolder } from "./data";

type Props = {
  folders: FileManagerFolder[];
  activeFolderId?: string | null;
  onOpenFolder?: (folderId: string) => void;
};

export function FoldersSection({ folders, activeFolderId, onOpenFolder }: Props) {
  return (
    <section className="flex flex-col gap-2" aria-labelledby="folders-heading">
      <div className="flex items-center justify-between">
        <h2 id="folders-heading" className="font-medium text-lg">
          Folder
        </h2>
        <span className="text-muted-foreground text-sm">{folders.length} folder</span>
      </div>
      {folders.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {folders.map((folder) => {
            const active = activeFolderId === folder.id;
            return (
              <Card
                key={folder.id}
                size="sm"
                className={cn("cursor-pointer transition-colors", active && "border-primary/40 bg-primary/5")}
                onClick={() => onOpenFolder?.(folder.id)}
              >
                <CardHeader>
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Folder className="size-4.5" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <CardTitle className="truncate leading-none">{folder.name}</CardTitle>
                      <CardDescription className="text-xs">{folder.fileCount} file</CardDescription>
                    </div>
                  </div>
                  <CardAction>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${folder.name}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                      >
                        <MoreVertical />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuGroup>
                          <DropdownMenuItem onSelect={() => onOpenFolder?.(folder.id)}>Buka folder</DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3 text-muted-foreground text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>{folder.updatedAt}</span>
                  </div>
                  <span>{folder.size}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty className="min-h-32">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Folder />
            </EmptyMedia>
            <EmptyTitle>Belum ada folder</EmptyTitle>
            <EmptyDescription>Folder default akan dibuat otomatis saat pertama kali dibuka.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}
