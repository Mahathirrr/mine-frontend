import { createFileRoute } from "@tanstack/react-router";

import { BookOpen } from "lucide-react";

import { JournalHub } from "./-components/journal-hub";

export const Route = createFileRoute("/(main)/dashboard/journal")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
          <BookOpen className="size-5" />
        </div>
        <div>
          <h2 className="text-3xl tracking-tight">Jurnal</h2>
          <p className="text-muted-foreground">
            Menulis essay & refleksi seperti Google Docs, dengan topik custom dan spin wheel untuk prompt acak.
          </p>
        </div>
      </div>
      <JournalHub />
    </div>
  );
}
