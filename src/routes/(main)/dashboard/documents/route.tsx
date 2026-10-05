import { createFileRoute, useNavigate } from "@tanstack/react-router";

import type { FileManagerView } from "../file-manager/-components/data";
import { DocumentsHub } from "./-components/documents-hub";

export const Route = createFileRoute("/(main)/dashboard/documents")({
  validateSearch: (search: Record<string, unknown>): { view: FileManagerView; folder?: number } => ({
    view: search.view === "list" ? "list" : "grid",
    folder:
      typeof search.folder === "string"
        ? Number(search.folder)
        : typeof search.folder === "number"
          ? search.folder
          : undefined,
  }),
  component: Page,
});

function Page() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { view, folder } = Route.useSearch();

  return (
    <DocumentsHub
      activeView={view}
      folderId={folder ?? null}
      onFolderChange={(folderId) => {
        void navigate({
          search: (prev) => ({
            ...prev,
            folder: folderId ?? undefined,
          }),
          replace: true,
        });
      }}
    />
  );
}
