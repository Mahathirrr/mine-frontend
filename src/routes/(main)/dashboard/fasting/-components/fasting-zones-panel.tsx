"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { FastingOverview } from "@/lib/api/fasting";

import { formatDurationShort, zoneIcons } from "./fasting-utils";

type Props = { data: FastingOverview };

export function FastingZonesPanel({ data }: Props) {
  const zones = data.zone?.all_zones ?? [];
  const elapsed = data.zone?.elapsed_hours ?? 0;
  const activeSlug = data.zone?.zone.slug;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Fasting zones</CardTitle>
          <CardDescription>
            Zona metabolis estimasi berdasarkan jam puasa. Bukan diagnosis medis, hanya panduan edukatif.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {zones
            .filter((z) => z.end_hour < 9999)
            .map((z) => {
              const isActive = z.slug === activeSlug;
              const inZone = elapsed >= z.start_hour && elapsed < z.end_hour;
              const zoneProgress =
                inZone && z.end_hour > z.start_hour
                  ? (elapsed - z.start_hour) / (z.end_hour - z.start_hour)
                  : isActive
                    ? (data.zone?.zone_progress ?? 0)
                    : elapsed > z.end_hour
                      ? 1
                      : 0;
              return (
                <div
                  key={z.slug}
                  className={`rounded-2xl border p-4 transition-colors ${isActive ? "border-orange-500/40 bg-orange-500/5" : "bg-card"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{zoneIcons[z.icon] ?? "⏱"}</span>
                      <div>
                        <p className="font-semibold">{z.label}</p>
                        <p className="text-muted-foreground text-xs">
                          {z.start_hour}h – {z.end_hour >= 72 ? "72h+" : `${z.end_hour}h`}
                        </p>
                      </div>
                    </div>
                    {isActive && data.zone && (
                      <span className="font-medium text-orange-600 text-sm dark:text-orange-400">
                        Sisa {formatDurationShort(data.zone.remaining_hours)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm">{z.description}</p>
                  {(isActive || elapsed > z.start_hour) && (
                    <Progress value={zoneProgress * 100} className="mt-3 h-1.5" />
                  )}
                </div>
              );
            })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autophagy</CardTitle>
          <CardDescription>Estimasi daur ulang selular ~16 jam+</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Latihan fisik dan makan karbohidrat tinggi sebelum fast bisa menggeser estimasi zona. Konsultasikan fast
          panjang dengan dokter.
        </CardContent>
      </Card>
    </div>
  );
}
