import { createFileRoute } from "@tanstack/react-router";

import { ReceiptText } from "lucide-react";

import { SubscriptionTracker } from "./-components/subscription-tracker";

export const Route = createFileRoute("/(main)/dashboard/subscriptions")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
          <ReceiptText className="size-5" />
        </div>
        <div>
          <h2 className="text-3xl tracking-tight">Biaya Rutin</h2>
          <p className="text-muted-foreground">
            Lacak langganan, pulsa, AI tools, dan tagihan berkala — dengan pengingat jatuh tempo & estimasi bulanan.
          </p>
        </div>
      </div>
      <SubscriptionTracker />
    </div>
  );
}
