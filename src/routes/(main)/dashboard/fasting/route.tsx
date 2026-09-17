import { createFileRoute } from "@tanstack/react-router";

import { Flame } from "lucide-react";

import { FastingHub } from "./-components/fasting-hub";

export const Route = createFileRoute("/(main)/dashboard/fasting")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 shadow-sm dark:text-orange-400">
          <Flame className="size-5" />
        </div>
        <div>
          <h2 className="text-3xl tracking-tight">Intermittent Fasting</h2>
          <p className="text-muted-foreground">
            Timer puasa, fasting zones, statistik, log BB before/after, food tracker, badges, dan history lengkap.
          </p>
        </div>
      </div>
      <FastingHub />
    </div>
  );
}
