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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CreateSubscriptionBody, Subscription } from "@/lib/api/subscriptions";

import {
  BILLING_CYCLE_LABEL,
  PRESET_COLORS,
  SUBSCRIPTION_CATEGORY_LABEL,
  SUBSCRIPTION_CATEGORY_ORDER,
  SUBSCRIPTION_STATUS_LABEL,
} from "./subscription-constants";

const linkSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\/.+/i.test(value) || /^[\w.-]+\.[a-z]{2,}/i.test(value), {
    message: "URL tidak valid",
  });

const formSchema = z
  .object({
    name: z.string().min(1, "Nama wajib diisi"),
    category: z.enum(["ai", "telecom", "cloud", "productivity", "entertainment", "finance", "utility", "other"]),
    amount: z.coerce.number().min(0, "Nominal minimal 0"),
    currency: z.string().min(1),
    billing_cycle: z.enum(["weekly", "monthly", "quarterly", "yearly", "custom"]),
    billing_interval_days: z.coerce.number().optional(),
    next_due_date: z.string().min(1, "Tanggal jatuh tempo wajib"),
    start_date: z.string(),
    status: z.enum(["active", "paused", "cancelled"]),
    auto_pay: z.boolean(),
    remind_days_before: z.coerce.number().min(0).max(60),
    payment_url: linkSchema,
    notes: z.string(),
    color: z.string(),
  })
  .refine((values) => values.billing_cycle !== "custom" || (values.billing_interval_days ?? 0) >= 1, {
    message: "Interval hari wajib untuk siklus kustom",
    path: ["billing_interval_days"],
  });

export type SubscriptionFormValues = z.infer<typeof formSchema>;

type SubscriptionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  subscription?: Subscription | null;
  saving: boolean;
  onSubmit: (values: CreateSubscriptionBody) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function defaultValues(sub?: Subscription | null): SubscriptionFormValues {
  return {
    name: sub?.name ?? "",
    category: sub?.category ?? "other",
    amount: sub?.amount ?? 0,
    currency: sub?.currency ?? "IDR",
    billing_cycle: sub?.billing_cycle ?? "monthly",
    billing_interval_days: sub?.billing_interval_days ?? 30,
    next_due_date: sub?.next_due_date?.slice(0, 10) ?? "",
    start_date: sub?.start_date?.slice(0, 10) ?? "",
    status: sub?.status ?? "active",
    auto_pay: sub?.auto_pay ?? false,
    remind_days_before: sub?.remind_days_before ?? 3,
    payment_url: sub?.payment_url ?? "",
    notes: sub?.notes ?? "",
    color: sub?.color ?? PRESET_COLORS[0],
  };
}

function toPayload(values: SubscriptionFormValues): CreateSubscriptionBody {
  return {
    name: values.name.trim(),
    category: values.category,
    amount: values.amount,
    currency: values.currency.toUpperCase(),
    billing_cycle: values.billing_cycle,
    billing_interval_days: values.billing_cycle === "custom" ? values.billing_interval_days : null,
    next_due_date: values.next_due_date,
    start_date: values.start_date.trim() ? values.start_date : null,
    status: values.status,
    auto_pay: values.auto_pay,
    remind_days_before: values.remind_days_before,
    payment_url: values.payment_url.trim() ? values.payment_url.trim() : null,
    notes: values.notes.trim() ? values.notes.trim() : null,
    color: values.color || null,
  };
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  mode,
  subscription,
  saving,
  onSubmit,
  onDelete,
}: SubscriptionFormDialogProps) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues(subscription),
  });

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues(subscription));
      setConfirmDelete(false);
    }
  }, [open, subscription, form]);

  const billingCycle = form.watch("billing_cycle");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Tambah biaya rutin" : "Edit langganan"}</DialogTitle>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit(toPayload(values));
            })}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="sub-name">Nama</FieldLabel>
                <FieldContent>
                  <Input id="sub-name" placeholder="ChatGPT Plus, Pulsa, Netflix…" {...form.register("name")} />
                  <FieldError>{form.formState.errors.name?.message}</FieldError>
                </FieldContent>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Kategori</FieldLabel>
                  <FieldContent>
                    <Controller
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBSCRIPTION_CATEGORY_ORDER.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {SUBSCRIPTION_CATEGORY_LABEL[cat]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <FieldContent>
                    <Controller
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(["active", "paused", "cancelled"] as const).map((status) => (
                              <SelectItem key={status} value={status}>
                                {SUBSCRIPTION_STATUS_LABEL[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FieldContent>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="sub-amount">Nominal</FieldLabel>
                  <FieldContent>
                    <Input id="sub-amount" type="number" min={0} step={1} {...form.register("amount")} />
                    <FieldError>{form.formState.errors.amount?.message}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="sub-currency">Mata uang</FieldLabel>
                  <FieldContent>
                    <Input id="sub-currency" maxLength={8} {...form.register("currency")} />
                  </FieldContent>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Siklus tagihan</FieldLabel>
                  <FieldContent>
                    <Controller
                      control={form.control}
                      name="billing_cycle"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(BILLING_CYCLE_LABEL).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FieldContent>
                </Field>

                {billingCycle === "custom" ? (
                  <Field>
                    <FieldLabel htmlFor="sub-interval">Interval (hari)</FieldLabel>
                    <FieldContent>
                      <Input
                        id="sub-interval"
                        type="number"
                        min={1}
                        max={365}
                        {...form.register("billing_interval_days")}
                      />
                      <FieldError>{form.formState.errors.billing_interval_days?.message}</FieldError>
                    </FieldContent>
                  </Field>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="sub-due">Jatuh tempo berikutnya</FieldLabel>
                  <FieldContent>
                    <Input id="sub-due" type="date" {...form.register("next_due_date")} />
                    <FieldError>{form.formState.errors.next_due_date?.message}</FieldError>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="sub-start">Mulai langganan</FieldLabel>
                  <FieldContent>
                    <Input id="sub-start" type="date" {...form.register("start_date")} />
                  </FieldContent>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="sub-remind">Ingatkan (hari sebelum)</FieldLabel>
                  <FieldContent>
                    <Input id="sub-remind" type="number" min={0} max={60} {...form.register("remind_days_before")} />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="sub-url">Link pembayaran</FieldLabel>
                  <FieldContent>
                    <Input id="sub-url" placeholder="https://…" {...form.register("payment_url")} />
                    <FieldError>{form.formState.errors.payment_url?.message}</FieldError>
                  </FieldContent>
                </Field>
              </div>

              <Field>
                <FieldLabel>Warna label</FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            aria-label={`Pilih warna ${color}`}
                            className="size-8 rounded-full border-2 transition-transform hover:scale-105"
                            style={{
                              backgroundColor: color,
                              borderColor: field.value === color ? "var(--foreground)" : "transparent",
                            }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                    )}
                  />
                </FieldContent>
              </Field>

              <Field orientation="horizontal">
                <Controller
                  control={form.control}
                  name="auto_pay"
                  render={({ field }) => (
                    <Checkbox
                      id="sub-autopay"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  )}
                />
                <FieldLabel htmlFor="sub-autopay" className="font-normal">
                  Auto-pay / debit otomatis
                </FieldLabel>
              </Field>

              <Field>
                <FieldLabel htmlFor="sub-notes">Catatan</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="sub-notes"
                    rows={3}
                    placeholder="Detail paket, nomor pelanggan, dll."
                    {...form.register("notes")}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2 sm:justify-between">
              {mode === "edit" && onDelete ? (
                <Button type="button" variant="destructive" disabled={saving} onClick={() => setConfirmDelete(true)}>
                  Hapus
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={saving}>
                  {mode === "create" ? "Simpan" : "Perbarui"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus langganan?</AlertDialogTitle>
            <AlertDialogDescription>
              Riwayat pembayaran untuk item ini juga akan dihapus. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (onDelete) await onDelete();
                setConfirmDelete(false);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
