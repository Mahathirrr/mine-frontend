"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ColumnId } from "@/lib/api/tasks";

import type { Column, Task } from "./types";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  column_id: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  team: z.string().min(1),
  due_date: z.string(),
  progress: z.coerce.number().min(0).max(100),
  link: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\/.+/i.test(value) || /^[\w.-]+\.[a-z]{2,}/i.test(value), {
      message: "Enter a valid URL",
    }),
});

export type TaskFormValues = {
  column_id: ColumnId;
  title: string;
  description: string;
  priority: string;
  team: string;
  due_date: string | null;
  progress: number;
  link: string;
};

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  task?: Task | null;
  columns: Column[];
  defaultColumn?: ColumnId;
  saving: boolean;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function priorityToForm(priority: Task["priority"]): "high" | "medium" | "low" {
  switch (priority) {
    case "High":
      return "high";
    case "Low":
      return "low";
    default:
      return "medium";
  }
}

export function TaskFormDialog({
  open,
  onOpenChange,
  mode,
  task,
  columns,
  defaultColumn = "todo",
  saving,
  onSubmit,
  onDelete,
}: TaskFormDialogProps) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      column_id: defaultColumn,
      priority: "medium",
      team: "Product",
      due_date: "",
      progress: 0,
      link: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;

    if (mode === "edit" && task) {
      form.reset({
        title: task.title,
        description: task.description,
        column_id: defaultColumn,
        priority: priorityToForm(task.priority),
        team: task.team,
        due_date: task.dueDateRaw ?? "",
        progress: task.progress,
        link: task.link ?? "",
      });
      return;
    }

    form.reset({
      title: "",
      description: "",
      column_id: defaultColumn,
      priority: "medium",
      team: "Product",
      due_date: "",
      progress: 0,
      link: "",
    });
  }, [open, mode, task, defaultColumn, form]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    await onSubmit({
      column_id: values.column_id as ColumnId,
      title: values.title.trim(),
      description: values.description.trim(),
      priority: values.priority,
      team: values.team.trim(),
      due_date: values.due_date.trim() ? values.due_date : null,
      progress: values.progress,
      link: values.link.trim(),
    });
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!onDelete) return;
    await onDelete();
    setDeleteOpen(false);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit task" : "Add task"}</DialogTitle>
          </DialogHeader>
          <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FieldGroup className="gap-4">
              <Controller
                control={form.control}
                name="title"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Title</FieldLabel>
                    <Input {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea {...field} rows={3} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="column_id"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Column</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Priority</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Due date</FieldLabel>
                      <Input {...field} type="date" />
                    </Field>
                  )}
                />
              </div>
              <Controller
                control={form.control}
                name="link"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Link (optional)</FieldLabel>
                    <Input {...field} type="url" placeholder="https://example.com" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  control={form.control}
                  name="team"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Team</FieldLabel>
                      <Input {...field} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Progress (%)</FieldLabel>
                      <Input {...field} type="number" min={0} max={100} />
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
            <DialogFooter className="gap-2 sm:justify-between">
              {mode === "edit" && onDelete ? (
                <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)} disabled={saving}>
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Create task"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The task will be removed from your board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={saving}>
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
