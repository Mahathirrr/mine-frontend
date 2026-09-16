import { createFileRoute } from "@tanstack/react-router";

import { Banknote } from "lucide-react";

import { MineFinanceHub } from "./-components/mine-finance-hub";

export const Route = createFileRoute("/(main)/dashboard/finance")({
  component: Page,
});

function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
          <Banknote className="size-5" />
        </div>
        <div>
          <h2 className="text-3xl tracking-tight">Keuangan</h2>
          <p className="text-muted-foreground">
            Kelola saldo, transaksi, budget, analytics, dan goals — terhubung dengan Biaya Rutin untuk perencanaan
            lengkap.
          </p>
        </div>
      </div>
      <MineFinanceHub />
    </div>
  );
}
