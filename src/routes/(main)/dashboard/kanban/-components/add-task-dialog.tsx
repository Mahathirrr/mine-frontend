"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ColumnId } from "@/lib/api/tasks";

import { columns } from "./data";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  column_id: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  team: z.string().min(1),
  due_date: z.string(),
});

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultColumn: ColumnId;
  saving: boolean;
  onSubmit: (values: {
    column_id: ColumnId;
    title: string;
    description: string;
    priority: string;
    team: string;
    due_date: string | null;
  }) => Promise<void>;
};

export function AddTaskDialog({ open, onOpenChange, defaultColumn, saving, onSubmit }: AddTaskDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      column_id: defaultColumn,
      priority: "medium",
      team: "Product",
      due_date: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        description: "",
        column_id: defaultColumn,
        priority: "medium",
        team: "Product",
        due_date: "",
      });
    }
  }, [open, defaultColumn, form]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    await onSubmit({
      column_id: values.column_id as ColumnId,
      title: values.title.trim(),
      description: values.description.trim(),
      priority: values.priority,
      team: values.team.trim(),
      due_date: values.due_date.trim() ? values.due_date : null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
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
              name="team"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Team</FieldLabel>
                  <Input {...field} />
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
