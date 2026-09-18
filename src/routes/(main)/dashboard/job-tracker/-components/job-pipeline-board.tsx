"use client";

import * as React from "react";

import { CollisionPriority } from "@dnd-kit/abstract";
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { cn } from "cn";

import type { JobApplicationWithRounds, JobStatus } from "@/lib/api/job-tracker";

import { JobApplicationCard, type JobPipelineBoardState } from "./job-application-card";
import { JOB_STATUS_LABEL, JOB_STATUS_ORDER, JOB_STATUS_TONE } from "./job-tracker-constants";

type AppDragData = { type: "application"; app: JobApplicationWithRounds; status: JobStatus };

function isJobStatus(v: unknown): v is JobStatus {
  return typeof v === "string" && JOB_STATUS_ORDER.includes(v as JobStatus);
}

function isAppDragData(v: unknown): v is AppDragData {
  return typeof v === "object" && v !== null && "type" in v && v.type === "application";
}

function emptyBoard(): JobPipelineBoardState {
  return Object.fromEntries(JOB_STATUS_ORDER.map((s) => [s, []])) as JobPipelineBoardState;
}

function buildBoard(apps: JobApplicationWithRounds[]): JobPipelineBoardState {
  const board = emptyBoard();
  for (const app of apps) {
    const status = isJobStatus(app.status) ? app.status : "saved";
    board[status].push(app);
  }
  for (const status of JOB_STATUS_ORDER) {
    board[status].sort((a, b) => b.priority - a.priority || b.updated_at.localeCompare(a.updated_at));
  }
  return board;
}

function SortableCard({
  app,
  status,
  index,
  onOpen,
}: {
  app: JobApplicationWithRounds;
  status: JobStatus;
  index: number;
  onOpen: (app: JobApplicationWithRounds) => void;
}) {
  const { isDragging, ref } = useSortable({
    id: `jt-app-${app.id}`,
    index,
    type: "application",
    accept: "application",
    group: status,
    data: { type: "application", app, status } satisfies AppDragData,
  });
  return (
    <div ref={ref} className={cn("touch-none", isDragging && "opacity-30")}>
      <JobApplicationCard app={app} onClick={() => onOpen(app)} />
    </div>
  );
}

function Column({
  status,
  apps,
  onOpen,
}: {
  status: JobStatus;
  apps: JobApplicationWithRounds[];
  onOpen: (app: JobApplicationWithRounds) => void;
}) {
  const dropTarget = useDroppable({
    id: status,
    type: "application-container",
    accept: "application",
    collisionPriority: CollisionPriority.Low,
    data: { type: "application-container", status },
  });
  return (
    <section
      className={cn(
        "flex min-h-[18rem] w-[16.5rem] shrink-0 flex-col rounded-xl border bg-muted/40",
        dropTarget.isDropTarget && "border-primary/40 bg-muted/60",
      )}
    >
      <div className="border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full border", JOB_STATUS_TONE[status])} />
          <h3 className="font-medium text-sm">{JOB_STATUS_LABEL[status]}</h3>
          <span className="ml-auto text-muted-foreground text-xs tabular-nums">{apps.length}</span>
        </div>
      </div>
      <div ref={dropTarget.ref} className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {apps.map((app, i) => (
          <SortableCard key={app.id} app={app} status={status} index={i} onOpen={onOpen} />
        ))}
        {apps.length === 0 ? (
          <p className="px-2 py-6 text-center text-muted-foreground text-xs">Tarik lamaran ke sini</p>
        ) : null}
      </div>
    </section>
  );
}

type Props = {
  applications: JobApplicationWithRounds[];
  onOpen: (app: JobApplicationWithRounds) => void;
  onStatusChange: (appId: number, status: JobStatus) => void;
};

export function JobPipelineBoard({ applications, onOpen, onStatusChange }: Props) {
  const [board, setBoard] = React.useState(() => buildBoard(applications));
  const before = React.useRef(board);
  React.useEffect(() => {
    setBoard(buildBoard(applications));
  }, [applications]);

  return (
    <DragDropProvider
      onDragStart={(e: DragStartEvent) => {
        if (e.operation.source?.type === "application") before.current = board;
      }}
      onDragOver={(e: DragOverEvent) => {
        if (e.operation.source?.type === "application") setBoard((c) => move(c, e));
      }}
      onDragEnd={(e: DragEndEvent) => {
        const { source } = e.operation;
        if (source?.type !== "application") return;
        if (e.canceled) {
          setBoard(before.current);
          return;
        }
        const data = isAppDragData(source.data) ? source.data : null;
        const newStatus = isSortable(source) && isJobStatus(source.group) ? source.group : data?.status;
        if (!data || !newStatus || newStatus === data.status) {
          setBoard(buildBoard(applications));
          return;
        }
        onStatusChange(data.app.id, newStatus);
      }}
    >
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-min gap-3">
          {JOB_STATUS_ORDER.map((status) => (
            <Column key={status} status={status} apps={board[status]} onOpen={onOpen} />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {(source) => {
          if (source.type !== "application" || !isAppDragData(source.data)) return null;
          return <JobApplicationCard app={source.data.app} onClick={() => undefined} isOverlay />;
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
