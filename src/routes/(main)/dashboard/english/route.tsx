import { createFileRoute } from "@tanstack/react-router";

import { Languages } from "lucide-react";

import { EnglishHub } from "./-components/english-hub";

export const Route = createFileRoute("/(main)/dashboard/english")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
          <Languages className="size-5" />
        </div>
        <div>
          <h2 className="text-3xl tracking-tight">English Tracker</h2>
          <p className="text-muted-foreground">
            Pantau persiapan TOEFL iBT dan IELTS: mock test per section, log latihan harian, word bank, insight, dan
            countdown ujian.
          </p>
        </div>
      </div>
      <EnglishHub />
    </div>
  );
}
