import { createFileRoute } from "@tanstack/react-router";

import { MineCommandCenter } from "./-components/home/mine-command-center";

export const Route = createFileRoute("/(main)/dashboard/")({
  component: Page,
});

function Page() {
  return <MineCommandCenter />;
}
