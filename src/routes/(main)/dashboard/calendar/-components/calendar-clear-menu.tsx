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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { type ClearPeriod, clearPeriodDescription, clearPeriodTitle } from "./calendar-utils";

function confirmActionLabel(clearing: boolean, countLoading: boolean, pendingCount: number) {
  if (clearing) return "Menghapus...";
  if (countLoading) return "Menghitung...";
  if (pendingCount === 0) return "Tidak ada event";
  return `Hapus ${pendingCount} item`;
}

type CalendarClearMenuProps = {
  anchorDate: Date;
  clearing: boolean;
  onClear: (period: ClearPeriod) => Promise<void>;
  onCount: (period: ClearPeriod) => Promise<number>;
};

const periods: ClearPeriod[] = ["day", "week", "month"];

export function CalendarClearMenu({ anchorDate, clearing, onClear, onCount }: CalendarClearMenuProps) {
  const [pendingPeriod, setPendingPeriod] = React.useState<ClearPeriod | null>(null);
  const [pendingCount, setPendingCount] = React.useState(0);
  const [countLoading, setCountLoading] = React.useState(false);

  React.useEffect(() => {
    if (!pendingPeriod) {
      setPendingCount(0);
      return;
    }

    let cancelled = false;
    setCountLoading(true);
    void onCount(pendingPeriod)
      .then((count) => {
        if (!cancelled) setPendingCount(count);
      })
      .finally(() => {
        if (!cancelled) setCountLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onCount, pendingPeriod]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" disabled={clearing}>
              {clearing ? <Loader2 className="animate-spin" /> : <Eraser />}
              Bersihkan
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {periods.map((period) => (
              <DropdownMenuItem key={period} variant="destructive" onClick={() => setPendingPeriod(period)}>
                {clearPeriodTitle(period)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pendingPeriod !== null} onOpenChange={(open) => !open && setPendingPeriod(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingPeriod ? clearPeriodTitle(pendingPeriod) : "Hapus event"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPeriod ? (
                <>
                  Semua event dan due date task pada periode{" "}
                  <span className="font-medium text-foreground">
                    {clearPeriodDescription(pendingPeriod, anchorDate)}
                  </span>{" "}
                  akan dihapus sekaligus
                  {countLoading ? " (menghitung...)" : ` (${pendingCount} item)`}. Tanggal merah tidak ikut terhapus.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={clearing || countLoading || pendingCount === 0}
              onClick={() => {
                if (!pendingPeriod) return;
                void onClear(pendingPeriod).finally(() => setPendingPeriod(null));
              }}
            >
              {confirmActionLabel(clearing, countLoading, pendingCount)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
