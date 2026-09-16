"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CreateTransactionBody, FinanceAccount, FinanceCategory, FinanceTxType } from "@/lib/api/finance";

import { expenseCategories, incomeCategories } from "./mine-finance-utils";

const formSchema = z
  .object({
    transaction_type: z.enum(["expense", "income", "transfer"]),
    account_id: z.coerce.number().min(1),
    transfer_to_account_id: z.coerce.number().optional(),
    category_id: z.coerce.number().optional(),
    amount: z.coerce.number().min(1),
    title: z.string().min(1, "Judul wajib"),
    merchant: z.string(),
    notes: z.string(),
    transaction_date: z.string().min(1),
  })
  .refine(
    (v) => v.transaction_type !== "transfer" || (v.transfer_to_account_id && v.transfer_to_account_id !== v.account_id),
    { message: "Pilih rekening tujuan transfer", path: ["transfer_to_account_id"] },
  );

type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  defaultType?: FinanceTxType;
  saving: boolean;
  onSubmit: (body: CreateTransactionBody) => Promise<void>;
};

export function MineTransactionFormDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  defaultType = "expense",
  saving,
  onSubmit,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transaction_type: defaultType,
      account_id: accounts.find((a) => a.is_default)?.id ?? accounts[0]?.id ?? 0,
      amount: 0,
      title: "",
      merchant: "",
      notes: "",
      transaction_date: new Date().toISOString().slice(0, 10),
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        transaction_type: defaultType,
        account_id: accounts.find((a) => a.is_default)?.id ?? accounts[0]?.id ?? 0,
        amount: 0,
        title: "",
        merchant: "",
        notes: "",
        transaction_date: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, defaultType, accounts, form]);

  const txType = form.watch("transaction_type");
  const catOptions = txType === "income" ? incomeCategories(categories) : expenseCategories(categories);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {txType === "expense" ? "Catat pengeluaran" : txType === "income" ? "Catat pemasukan" : "Transfer saldo"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              account_id: values.account_id,
              category_id: values.transaction_type === "transfer" ? null : values.category_id || null,
              transaction_type: values.transaction_type,
              amount: values.amount,
              currency: "IDR",
              title: values.title.trim(),
              merchant: values.merchant.trim() || null,
              notes: values.notes.trim() || null,
              transaction_date: values.transaction_date,
              transfer_to_account_id: values.transaction_type === "transfer" ? values.transfer_to_account_id : null,
            });
          })}
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Jenis</FieldLabel>
              <Controller
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Pengeluaran</SelectItem>
                      <SelectItem value="income">Pemasukan</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel>{txType === "transfer" ? "Dari rekening" : "Rekening"}</FieldLabel>
              <Controller
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {txType === "transfer" ? (
              <Field>
                <FieldLabel>Ke rekening</FieldLabel>
                <Controller
                  control={form.control}
                  name="transfer_to_account_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tujuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{form.formState.errors.transfer_to_account_id?.message}</FieldError>
              </Field>
            ) : (
              <Field>
                <FieldLabel>Kategori</FieldLabel>
                <Controller
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {catOptions.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="tx-amount">Nominal (IDR)</FieldLabel>
                <FieldContent>
                  <Input id="tx-amount" type="number" min={1} {...form.register("amount")} />
                  <FieldError>{form.formState.errors.amount?.message}</FieldError>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="tx-date">Tanggal</FieldLabel>
                <FieldContent>
                  <Input id="tx-date" type="date" {...form.register("transaction_date")} />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="tx-title">Judul</FieldLabel>
              <FieldContent>
                <Input id="tx-title" placeholder="Makan siang, Gaji, dll." {...form.register("title")} />
                <FieldError>{form.formState.errors.title?.message}</FieldError>
              </FieldContent>
            </Field>

            {txType !== "transfer" ? (
              <Field>
                <FieldLabel htmlFor="tx-merchant">Merchant / tempat</FieldLabel>
                <FieldContent>
                  <Input id="tx-merchant" {...form.register("merchant")} />
                </FieldContent>
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="tx-notes">Catatan</FieldLabel>
              <FieldContent>
                <Textarea id="tx-notes" rows={2} {...form.register("notes")} />
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
