"use client";

import { ExternalLink, MapPin, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { JobCompany } from "@/lib/api/job-tracker";

type Props = {
  company: JobCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrich?: () => void;
  enriching?: boolean;
};

function mapEmbedUrl(company: JobCompany) {
  if (company.latitude == null || company.longitude == null) return null;
  const lat = company.latitude;
  const lng = company.longitude;
  const d = 0.06;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function CompanyDetailSheet({ company, open, onOpenChange, onEnrich, enriching }: Props) {
  if (!company) return null;
  const mapUrl = mapEmbedUrl(company);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-start gap-3">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt=""
                className="size-12 rounded-lg border bg-white object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <SheetTitle>{company.name}</SheetTitle>
              <SheetDescription>{company.industry ?? "Perusahaan"}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-4 flex flex-wrap gap-2">
          {company.hq_location ? <Badge variant="outline">{company.hq_location}</Badge> : null}
          {company.company_size ? <Badge variant="secondary">{company.company_size}</Badge> : null}
          {onEnrich ? (
            <Button size="sm" variant="outline" onClick={onEnrich} disabled={enriching}>
              <RefreshCw className={`mr-1 size-3.5 ${enriching ? "animate-spin" : ""}`} />
              Enrich
            </Button>
          ) : null}
        </div>

        {company.description ? (
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">{company.description}</p>
        ) : null}

        {(company.address_line ?? company.city) && (
          <div className="mt-4 flex gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              {company.address_line ? <p>{company.address_line}</p> : null}
              <p className="text-muted-foreground">{[company.city, company.country].filter(Boolean).join(", ")}</p>
            </div>
          </div>
        )}

        {mapUrl ? (
          <div className="mt-4 overflow-hidden rounded-lg border">
            <iframe title={`Map ${company.name}`} src={mapUrl} className="h-52 w-full border-0" loading="lazy" />
          </div>
        ) : (
          <p className="mt-4 text-muted-foreground text-xs">
            Koordinat belum tersedia — klik Enrich untuk geocode lokasi.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {company.website ? (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
            >
              Website <ExternalLink className="size-3" />
            </a>
          ) : null}
          {company.linkedin_url ? (
            <a
              href={company.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
            >
              LinkedIn Company <ExternalLink className="size-3" />
            </a>
          ) : null}
          {company.careers_url ? (
            <a
              href={company.careers_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
            >
              Career Page <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
