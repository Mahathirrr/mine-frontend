"use client";

import * as React from "react";

import { Link } from "@tanstack/react-router";

import {
  ArrowLeft,
  Check,
  Code2,
  Download,
  ExternalLink,
  FolderPlus,
  ListPlus,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { SkillChecklistItem, SkillDomainDetail, SkillMaterial, SkillProject, SkillTopic } from "@/lib/api/skills";
import { parseTechStack, skillsApi } from "@/lib/api/skills";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { formatBytes, formatProgress } from "./skills-utils";

type SkillDomainViewProps = {
  domainId: number;
};

export function SkillDomainView({ domainId }: SkillDomainViewProps) {
  const token = useAuthStore((s) => s.token);
  const [data, setData] = React.useState<SkillDomainDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setData(await skillsApi.domainDetail(token, domainId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat domain");
    } finally {
      setLoading(false);
    }
  }, [token, domainId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-muted-foreground text-sm">Memuat roadmap...</p>;
  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (!data) return null;

  const { domain, phases, materials, projects } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" render={<Link to="/dashboard/skills" />}>
          <ArrowLeft data-icon="inline-start" />
          Semua domain
        </Button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-xl">{domain.name}</h3>
          <p className="text-muted-foreground text-sm">{domain.description}</p>
        </div>
        {domain.mastered && <Badge className="bg-green-600/90">Mastered</Badge>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Roadmap</CardDescription>
            <CardTitle>{formatProgress(domain.roadmap_progress)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={domain.roadmap_progress} />
            <p className="mt-2 text-muted-foreground text-xs">
              {domain.checklist_checked}/{domain.checklist_total} checklist
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projects</CardDescription>
            <CardTitle>{formatProgress(domain.project_progress)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={domain.project_progress} />
            <p className="mt-2 text-muted-foreground text-xs">
              {domain.valid_project_count}/{domain.min_projects} dengan GitHub
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall</CardDescription>
            <CardTitle>{formatProgress(domain.overall_progress)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={domain.overall_progress} />
            <p className="mt-2 text-muted-foreground text-xs">70% roadmap + 30% project</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roadmap">
        <TabsList>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="materials">Materi ({materials.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap" className="space-y-4 pt-2">
          <RoadmapPanel domainId={domainId} phases={phases} onRefresh={load} />
        </TabsContent>

        <TabsContent value="materials" className="space-y-4 pt-2">
          <MaterialsPanel domainId={domainId} materials={materials} onRefresh={load} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4 pt-2">
          <ProjectsPanel domainId={domainId} projects={projects} onRefresh={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RoadmapPanel({
  domainId,
  phases,
  onRefresh,
}: {
  domainId: number;
  phases: SkillDomainDetail["phases"];
  onRefresh: () => Promise<void>;
}) {
  const token = useAuthStore((s) => s.token);
  const [phaseDialog, setPhaseDialog] = React.useState(false);
  const [phaseName, setPhaseName] = React.useState("");

  async function addPhase() {
    if (!token || !phaseName.trim()) return;
    await skillsApi.createPhase(token, { domain_id: domainId, name: phaseName.trim() });
    setPhaseDialog(false);
    setPhaseName("");
    await onRefresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setPhaseDialog(true)}>
          <FolderPlus data-icon="inline-start" />
          Tambah fase
        </Button>
      </div>

      {phases.map((phase) => (
        <Collapsible key={phase.id} defaultOpen className="rounded-lg border">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left font-medium">
            {phase.name}
            <span className="text-muted-foreground text-xs">{phase.topics?.length ?? 0} topik</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 border-t px-4 py-3">
            {(phase.topics ?? []).map((topic) => (
              <TopicCard key={topic.id} topic={topic} onRefresh={onRefresh} />
            ))}
            <AddTopicButton domainId={domainId} phaseId={phase.id} onRefresh={onRefresh} />
          </CollapsibleContent>
        </Collapsible>
      ))}

      <Dialog open={phaseDialog} onOpenChange={setPhaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fase baru</DialogTitle>
          </DialogHeader>
          <Input value={phaseName} onChange={(e) => setPhaseName(e.target.value)} placeholder="Nama fase" />
          <DialogFooter>
            <Button onClick={() => void addPhase()}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddTopicButton({
  domainId,
  phaseId,
  onRefresh,
}: {
  domainId: number;
  phaseId: number;
  onRefresh: () => Promise<void>;
}) {
  const token = useAuthStore((s) => s.token);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");

  async function submit() {
    if (!token || !name.trim()) return;
    await skillsApi.createTopic(token, { domain_id: domainId, phase_id: phaseId, name: name.trim() });
    setOpen(false);
    setName("");
    await onRefresh();
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Topik
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Topik baru</DialogTitle>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama topik" />
          <DialogFooter>
            <Button onClick={() => void submit()}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TopicCard({ topic, onRefresh }: { topic: SkillTopic; onRefresh: () => Promise<void> }) {
  const token = useAuthStore((s) => s.token);
  const [addOpen, setAddOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");

  const checkedCount = topic.checklist_items?.filter((i) => i.checked).length ?? 0;
  const totalCount = topic.checklist_items?.length ?? 0;

  async function addChecklist() {
    if (!token || !newTitle.trim()) return;
    await skillsApi.createChecklistItem(token, {
      topic_id: topic.id,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
    });
    setAddOpen(false);
    setNewTitle("");
    setNewDescription("");
    await onRefresh();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{topic.name}</CardTitle>
          <span className="text-muted-foreground text-xs">
            {checkedCount}/{totalCount}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-3">
          {(topic.checklist_items ?? []).map((item) => (
            <ChecklistItemRow key={item.id} item={item} onRefresh={onRefresh} />
          ))}
        </ul>

        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <ListPlus data-icon="inline-start" />
          Tambah poin
        </Button>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Poin checklist baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Judul poin</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Mis. Binary search"
                />
              </div>
              <div>
                <Label>Detail / catatan (opsional)</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Penjelasan, referensi, atau catatan pribadi untuk poin ini..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => void addChecklist()}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function ChecklistItemRow({ item, onRefresh }: { item: SkillChecklistItem; onRefresh: () => Promise<void> }) {
  const token = useAuthStore((s) => s.token);
  const [editOpen, setEditOpen] = React.useState(false);
  const [title, setTitle] = React.useState(item.title);
  const [description, setDescription] = React.useState(item.description ?? "");

  React.useEffect(() => {
    setTitle(item.title);
    setDescription(item.description ?? "");
  }, [item.title, item.description]);

  async function save() {
    if (!token) return;
    await skillsApi.updateChecklistItem(token, item.id, {
      title: title.trim(),
      description: description.trim(),
    });
    setEditOpen(false);
    await onRefresh();
  }

  return (
    <li className="flex gap-2 rounded-md border p-3">
      <Checkbox
        className="mt-0.5"
        checked={item.checked}
        onCheckedChange={() => {
          if (!token) return;
          void skillsApi.toggleChecklistItem(token, item.id).then(onRefresh);
        }}
      />
      <div className="min-w-0 flex-1">
        <p className={`font-medium text-sm ${item.checked ? "text-muted-foreground line-through" : ""}`}>
          {item.title}
        </p>
        {item.description && (
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">{item.description}</p>
        )}
      </div>
      <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => setEditOpen(true)}>
        <Pencil className="size-3.5" />
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit poin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Judul</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Detail / catatan</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan, tips, atau link catatan untuk poin ini..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void save()}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

function MaterialsPanel({
  domainId,
  materials,
  onRefresh,
}: {
  domainId: number;
  materials: SkillMaterial[];
  onRefresh: () => Promise<void>;
}) {
  const token = useAuthStore((s) => s.token);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [linkTitle, setLinkTitle] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  async function addLink() {
    if (!token || !linkTitle.trim() || !linkUrl.trim()) return;
    await skillsApi.createMaterial(token, {
      domain_id: domainId,
      title: linkTitle.trim(),
      material_type: "link",
      url: linkUrl.trim(),
    });
    setLinkTitle("");
    setLinkUrl("");
    await onRefresh();
  }

  async function uploadFile(file: File) {
    if (!token) return;
    setUploading(true);
    try {
      await skillsApi.uploadMaterial(token, domainId, file);
      await onRefresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Semua materi domain ini</CardTitle>
          <CardDescription>
            Upload PDF, dokumen, atau link di satu tempat — tidak per topik/fase. Cocok untuk file gabungan seperti
            ebook atau slide lengkap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {materials.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada materi. Upload PDF atau tambah link di bawah.</p>
          ) : (
            <div className="space-y-2">
              {materials.map((m) => (
                <MaterialRow key={m.id} material={m} onRefresh={onRefresh} />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Judul link"
              className="h-9 max-w-44 text-sm"
            />
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="h-9 min-w-0 flex-1 text-sm"
            />
            <Button size="sm" variant="outline" onClick={() => void addLink()}>
              Tambah link
            </Button>
            <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Upload data-icon="inline-start" />
              {uploading ? "Mengupload..." : "Upload file"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadFile(f);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MaterialRow({ material, onRefresh }: { material: SkillMaterial; onRefresh: () => Promise<void> }) {
  const token = useAuthStore((s) => s.token);

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="min-w-0 truncate">
        <span className="font-medium">{material.title}</span>
        {material.material_type === "file" && material.size_bytes != null && (
          <span className="ml-2 text-muted-foreground text-xs">{formatBytes(material.size_bytes)}</span>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        {material.material_type === "file" && token && (
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() =>
              void skillsApi.downloadMaterial(token, material.id, material.original_name ?? material.title)
            }
          >
            <Download className="size-3.5" />
          </Button>
        )}
        {material.material_type === "link" && material.url && (
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            render={<a href={material.url} target="_blank" rel="noreferrer" />}
          >
            <ExternalLink className="size-3.5" />
          </Button>
        )}
        {token && (
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-destructive"
            onClick={() => void skillsApi.deleteMaterial(token, material.id).then(onRefresh)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ProjectsPanel({
  domainId,
  projects,
  onRefresh,
}: {
  domainId: number;
  projects: SkillProject[];
  onRefresh: () => Promise<void>;
}) {
  const token = useAuthStore((s) => s.token);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", description: "", github_url: "", demo_url: "", tech_stack: "" });

  async function create() {
    if (!token || !form.title.trim()) return;
    const stack = form.tech_stack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await skillsApi.createProject(token, {
      domain_id: domainId,
      title: form.title.trim(),
      description: form.description,
      github_url: form.github_url || undefined,
      demo_url: form.demo_url || undefined,
      tech_stack: stack,
    });
    setOpen(false);
    setForm({ title: "", description: "", github_url: "", demo_url: "", tech_stack: "" });
    await onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus data-icon="inline-start" />
          Project baru
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} onRefresh={onRefresh} />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Project baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Judul</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label>Tech stack (pisah koma)</Label>
              <Input
                value={form.tech_stack}
                onChange={(e) => setForm((f) => ({ ...f, tech_stack: e.target.value }))}
                placeholder="Go, React, PostgreSQL"
              />
            </div>
            <div>
              <Label>GitHub URL</Label>
              <Input value={form.github_url} onChange={(e) => setForm((f) => ({ ...f, github_url: e.target.value }))} />
            </div>
            <div>
              <Label>Demo URL (opsional)</Label>
              <Input value={form.demo_url} onChange={(e) => setForm((f) => ({ ...f, demo_url: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void create()}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectCard({ project, onRefresh }: { project: SkillProject; onRefresh: () => Promise<void> }) {
  const token = useAuthStore((s) => s.token);
  const stack = parseTechStack(project.tech_stack);
  const coverRef = React.useRef<HTMLInputElement>(null);

  async function uploadCover(file: File) {
    if (!token) return;
    await skillsApi.uploadProjectCover(token, project.id, file);
    await onRefresh();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{project.title}</CardTitle>
          {token && (
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-destructive"
              onClick={() => void skillsApi.deleteProject(token, project.id).then(onRefresh)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        <CardDescription className="line-clamp-3">{project.description || "—"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {stack.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {project.github_url && (
            <Button
              size="sm"
              variant="outline"
              render={<a href={project.github_url} target="_blank" rel="noreferrer" />}
            >
              <Code2 data-icon="inline-start" />
              GitHub
            </Button>
          )}
          {project.demo_url && (
            <Button size="sm" variant="outline" render={<a href={project.demo_url} target="_blank" rel="noreferrer" />}>
              <ExternalLink data-icon="inline-start" />
              Demo
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => coverRef.current?.click()}>
            <Upload data-icon="inline-start" />
            Cover
          </Button>
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void uploadCover(f);
            }}
          />
        </div>
        {project.github_url && (
          <p className="flex items-center gap-1 text-green-700 text-xs dark:text-green-300">
            <Check className="size-3" />
            Valid untuk progress project
          </p>
        )}
      </CardContent>
    </Card>
  );
}
