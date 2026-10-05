"use client";

import * as React from "react";

import { Link } from "@tanstack/react-router";

import { Plus, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { SkillDomainSummary } from "@/lib/api/skills";
import { skillsApi } from "@/lib/api/skills";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { formatProgress } from "./skills-utils";

export function SkillsOverview() {
  const token = useAuthStore((s) => s.token);
  const [domains, setDomains] = React.useState<SkillDomainSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await skillsApi.overview(token);
      setDomains(res.domains);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat skill tracker");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function createDomain() {
    if (!token || !name.trim()) return;
    setSaving(true);
    try {
      await skillsApi.createDomain(token, { name: name.trim() });
      setDialogOpen(false);
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat domain");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {["a", "b", "c", "d", "e", "f"].map((key) => (
          <Skeleton key={key} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{domains.length} bidang skill</p>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus data-icon="inline-start" />
          Domain baru
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {domains.map((domain) => (
          <Link key={domain.id} to="/dashboard/skills" search={{ domain: domain.id }} className="block">
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">{domain.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{domain.description || "—"}</CardDescription>
                  </div>
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: domain.color }} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{formatProgress(domain.overall_progress)}</span>
                  </div>
                  <Progress value={domain.overall_progress} />
                </div>
                <div className="flex flex-wrap gap-2 text-muted-foreground text-xs">
                  <span>
                    Checklist {domain.checklist_checked}/{domain.checklist_total}
                  </span>
                  <span>·</span>
                  <span>
                    Project {domain.valid_project_count}/{domain.min_projects}
                  </span>
                </div>
                {domain.mastered && (
                  <Badge variant="outline" className="border-green-500/40 text-green-700 dark:text-green-300">
                    <Trophy data-icon="inline-start" />
                    Mastered
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Domain skill baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="domain-name">Nama</Label>
            <Input
              id="domain-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mis. Blockchain"
            />
          </div>
          <DialogFooter>
            <Button disabled={saving} onClick={() => void createDomain()}>
              {saving ? "Menyimpan..." : "Buat domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
