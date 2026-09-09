import { createFileRoute } from "@tanstack/react-router";

import { BriefcaseBusiness } from "lucide-react";

import { InterviewTracker } from "./-components/interview-tracker";

export const Route = createFileRoute("/(main)/dashboard/interviews")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
          <BriefcaseBusiness className="size-5" />
        </div>
        <div>
          <h2 className="text-3xl tracking-tight">Wawancara</h2>
          <p className="text-muted-foreground">
            Track lamaran kerja, tahap wawancara, jadwal, dan bank soal persiapan.
          </p>
        </div>
      </div>
      <InterviewTracker />
    </div>
  );
}
