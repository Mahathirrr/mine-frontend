import { createFileRoute } from "@tanstack/react-router";

import { GraduationCap } from "lucide-react";
import { z } from "zod";

import { SkillsHub } from "./-components/skills-hub";

const searchSchema = z.object({
  domain: z.coerce.number().optional(),
});

export const Route = createFileRoute("/(main)/dashboard/skills")({
  validateSearch: searchSchema,
  component: Page,
});

function Page() {
  const { domain } = Route.useSearch();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
          <GraduationCap className="size-5" />
        </div>
        <div>
          <h2 className="text-3xl tracking-tight">Skill Tracker</h2>
          <p className="text-muted-foreground">
            Roadmap belajar, checklist penguasaan, materi, dan project portfolio per bidang IT.
          </p>
        </div>
      </div>
      <SkillsHub domainId={domain} />
    </div>
  );
}
