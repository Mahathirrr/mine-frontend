import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { IncomeBreakdownRow } from "./mine-finance-utils";
import { formatIDR } from "./mine-finance-utils";

type IncomeBreakdownProps = {
  rows: IncomeBreakdownRow[];
};

const barTones = ["bg-chart-3", "bg-chart-3/75", "bg-chart-3/50"];

export function IncomeBreakdown({ rows }: IncomeBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Sumber pemasukan</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-1 md:grid-cols-3">
        {rows.length === 0 ? (
          <p className="col-span-full py-6 text-center text-muted-foreground text-sm">Belum ada pemasukan bulan ini.</p>
        ) : (
          rows.map((row, index) => (
            <section className="isolate flex gap-[0.5px]" key={row.name}>
              <Separator
                orientation="vertical"
                className="mb-1 h-auto self-auto border-muted-foreground/50 border-l border-dashed bg-transparent"
              />
              <div className="flex min-h-24 flex-1 flex-col justify-between">
                <div className="flex min-w-0 flex-col gap-1 px-1">
                  <p className="wrap-break-word text-muted-foreground text-xs leading-none">
                    {row.name} · {Math.round(row.percent)}%
                  </p>
                  <div className="font-heading text-lg leading-none tracking-tight">{formatIDR(row.amount)}</div>
                </div>
                <div className={`-ml-0.5 h-5 rounded-sm ${barTones[index] ?? "bg-chart-3/40"}`} />
              </div>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
}
