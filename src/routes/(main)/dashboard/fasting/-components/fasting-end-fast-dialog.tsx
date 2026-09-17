"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { FastingSession, FastingZone } from "@/lib/api/fasting";

import {
  formatDurationHuman,
  formatLocalDatetimeDisplay,
  parseLocalDatetimeInput,
  toLocalDatetimeInput,
  zoneIcons,
} from "./fasting-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: FastingSession;
  elapsedHours: number;
  zone: FastingZone | null;
  busy: boolean;
  onSave: (startedAt: string, endedAt: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function FastingEndFastDialog({
  open,
  onOpenChange,
  session,
  elapsedHours,
  zone,
  busy,
  onSave,
  onDelete,
}: Props) {
  const [startedAt, setStartedAt] = React.useState(() => toLocalDatetimeInput(session.started_at));
  const [endedAt, setEndedAt] = React.useState(() => toLocalDatetimeInput(new Date().toISOString()));
  const [editStart, setEditStart] = React.useState(false);
  const [editEnd, setEditEnd] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setStartedAt(toLocalDatetimeInput(session.started_at));
    setEndedAt(toLocalDatetimeInput(new Date().toISOString()));
    setEditStart(false);
    setEditEnd(false);
  }, [open, session.started_at]);

  const zoneLabel = zone?.label ?? "—";
  const zoneIcon = zone ? (zoneIcons[zone.icon] ?? "⏱") : "⏱";
  const canSave = Boolean(parseLocalDatetimeInput(startedAt) && parseLocalDatetimeInput(endedAt));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="space-y-4 bg-zinc-950 p-6 text-zinc-100">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-2xl text-white">Nice effort!</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
              Kamu menyelesaikan fast selama <strong className="text-white">{formatDurationHuman(elapsedHours)}</strong>
              . Zona tercapai:{" "}
              <strong className="text-white">
                {zoneIcon} {zoneLabel}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <p className="text-zinc-500 text-xs leading-relaxed">
            Salah selesai? Tutup dialog ini untuk lanjutkan fast. Atau edit waktu di bawah lalu Save / Delete.
          </p>

          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
            <TimeRow
              label="Started fasting"
              value={formatLocalDatetimeDisplay(startedAt)}
              editing={editStart}
              inputValue={startedAt}
              onInputChange={setStartedAt}
              onEdit={() => setEditStart(true)}
              onDone={() => setEditStart(false)}
            />
            <div className="border-zinc-800 border-t border-dashed" />
            <TimeRow
              label="Ended fasting"
              value={formatLocalDatetimeDisplay(endedAt)}
              editing={editEnd}
              inputValue={endedAt}
              onInputChange={setEndedAt}
              onEdit={() => setEditEnd(true)}
              onDone={() => setEditEnd(false)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="h-12 rounded-full bg-orange-400 font-semibold text-zinc-950 hover:bg-orange-300"
              disabled={busy}
              onClick={() => void onDelete()}
            >
              Delete
            </Button>
            <Button
              type="button"
              className="h-12 rounded-full bg-zinc-700 font-semibold text-white hover:bg-zinc-600"
              disabled={busy || !canSave}
              onClick={() => {
                const start = parseLocalDatetimeInput(startedAt);
                const end = parseLocalDatetimeInput(endedAt);
                if (!start || !end) return;
                void onSave(start.toISOString(), end.toISOString());
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TimeRow({
  label,
  value,
  editing,
  inputValue,
  onInputChange,
  onEdit,
  onDone,
}: {
  label: string;
  value: string;
  editing: boolean;
  inputValue: string;
  onInputChange: (v: string) => void;
  onEdit: () => void;
  onDone: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-zinc-500 text-xs">{label}</p>
        {editing ? (
          <div className="mt-2 space-y-2">
            <Input
              type="datetime-local"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              className="border-zinc-700 bg-zinc-800 text-white"
            />
            <Button type="button" size="sm" variant="ghost" className="text-orange-400" onClick={onDone}>
              Selesai
            </Button>
          </div>
        ) : (
          <p className="mt-1 font-medium text-sm text-white">{value}</p>
        )}
      </div>
      {!editing && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="shrink-0 text-orange-400 hover:text-orange-300"
          onClick={onEdit}
        >
          Edit
        </Button>
      )}
    </div>
  );
}
