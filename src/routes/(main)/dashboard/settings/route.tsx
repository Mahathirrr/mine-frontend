import { createFileRoute } from "@tanstack/react-router";

import { SettingsHub } from "./-components/settings-hub";

export const Route = createFileRoute("/(main)/dashboard/settings")({
  component: Page,
});

function Page() {
  return <SettingsHub />;
}
