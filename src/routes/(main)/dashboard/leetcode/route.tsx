import { createFileRoute } from "@tanstack/react-router";

import { LeetCodeLogo } from "@/components/brand/leetcode-logo";

import { LeetCodeTracker } from "./-components/leetcode-tracker";

export const Route = createFileRoute("/(main)/dashboard/leetcode")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <LeetCodeLogo className="mt-1 size-10 rounded-lg shadow-sm" />
        <div>
          <h2 className="text-3xl tracking-tight">LeetCode Tracker</h2>
          <p className="text-muted-foreground">Kerjakan di LeetCode. Di sini cuma track progress NeetCode 75 & 150.</p>
        </div>
      </div>
      <LeetCodeTracker />
    </div>
  );
}
