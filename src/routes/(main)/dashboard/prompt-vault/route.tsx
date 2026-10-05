import { createFileRoute } from "@tanstack/react-router";

import { PromptVaultHub } from "./-components/prompt-vault-hub";

export const Route = createFileRoute("/(main)/dashboard/prompt-vault")({
  component: Page,
});

function Page() {
  return <PromptVaultHub />;
}
