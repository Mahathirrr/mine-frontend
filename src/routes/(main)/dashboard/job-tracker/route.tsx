import { createFileRoute } from "@tanstack/react-router";

import { Target } from "lucide-react";

import { JobTracker } from "./-components/job-tracker";

export const Route = createFileRoute("/(main)/dashboard/job-tracker")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
          <Target className="size-5" />
        </div>
        <div>
          <h2 className="text-3xl tracking-tight">Job Tracker</h2>
          <p className="text-muted-foreground">
            Pipeline lamaran, company hub, kontak recruiter, thread komunikasi, dan auto-feed lowongan setiap 3 jam.
          </p>
        </div>
      </div>
      <JobTracker />
    </div>
  );
}
