"use client";

import * as React from "react";

import { Eraser, Loader2 } from "lucide-react";

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

import { type ClearScope, clearScopeDescription, clearScopeTitle, type VisibleRange } from "./calendar-utils";

function confirmActionLabel(clearing: boolean, countLoading: boolean, pendingCount: number) {
  if (clearing) return "Menghapus...";
  if (countLoading) return "Menghitung...";
  if (pendingCount === 0) return "Tidak ada event";
  return `Hapus ${pendingCount} item`;
}

type CalendarClearMenuProps = {
  scope: ClearScope;
  range: VisibleRange;
  clearing: boolean;
  onClear: () => Promise<void>;
  onCount: () => Promise<number>;
};

export function CalendarClearMenu({ scope, range, clearing, onClear, onCount }: CalendarClearMenuProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);
  const [countLoading, setCountLoading] = React.useState(false);

  React.useEffect(() => {
    if (!confirmOpen) {
      setPendingCount(0);
      return;
    }

    let cancelled = false;
    setCountLoading(true);
    void onCount()
      .then((count) => {
        if (!cancelled) setPendingCount(count);
      })
      .finally(() => {
        if (!cancelled) setCountLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [confirmOpen, onCount]);

  return (
    <>
      <Button variant="outline" disabled={clearing} onClick={() => setConfirmOpen(true)}>
        {clearing ? <Loader2 className="animate-spin" /> : <Eraser />}
        Bersihkan
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{clearScopeTitle(scope)}</AlertDialogTitle>
            <AlertDialogDescription>
              Semua event dan due date task pada periode{" "}
              <span className="font-medium text-foreground">{clearScopeDescription(scope, range)}</span> akan dihapus
              sekaligus
              {countLoading ? " (menghitung...)" : ` (${pendingCount} item)`}. Tanggal merah tidak ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={clearing || countLoading || pendingCount === 0}
              onClick={() => void onClear().finally(() => setConfirmOpen(false))}
            >
              {confirmActionLabel(clearing, countLoading, pendingCount)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
