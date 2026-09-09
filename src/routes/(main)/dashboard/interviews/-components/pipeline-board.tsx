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

import type { AppStatus, InterviewApplicationWithRounds } from "@/lib/api/interviews";

import { ApplicationCard } from "./application-card";
import { APP_STATUS_LABEL, APP_STATUS_ORDER, APP_STATUS_TONE } from "./interview-constants";

export type PipelineBoardState = Record<AppStatus, InterviewApplicationWithRounds[]>;

type AppDragData = {
  type: "application";
  app: InterviewApplicationWithRounds;
  status: AppStatus;
};

function isAppStatus(value: unknown): value is AppStatus {
  return typeof value === "string" && APP_STATUS_ORDER.includes(value as AppStatus);
}

function isAppDragData(value: unknown): value is AppDragData {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "application" &&
    "app" in value &&
    "status" in value &&
    isAppStatus(value.status)
  );
}

function emptyBoard(): PipelineBoardState {
  return {
    wishlist: [],
    applied: [],
    screening: [],
    interviewing: [],
    offer: [],
    rejected: [],
    withdrawn: [],
  };
}

function buildBoard(applications: InterviewApplicationWithRounds[]): PipelineBoardState {
  const board = emptyBoard();
  for (const app of applications) {
    const status = isAppStatus(app.status) ? app.status : "applied";
    board[status].push(app);
  }
  for (const status of APP_STATUS_ORDER) {
    board[status].sort((a, b) => b.priority - a.priority || b.updated_at.localeCompare(a.updated_at));
  }
  return board;
}

function SortableApplicationCard({
  app,
  status,
  index,
  onOpen,
}: {
  app: InterviewApplicationWithRounds;
  status: AppStatus;
  index: number;
  onOpen: (app: InterviewApplicationWithRounds) => void;
}) {
  const { isDragging, ref } = useSortable({
    id: `app-${app.id}`,
    index,
    type: "application",
    accept: "application",
    group: status,
    data: { type: "application", app, status } satisfies AppDragData,
  });

  return (
    <div ref={ref} className={cn("touch-none", isDragging && "opacity-30")}>
      <ApplicationCard app={app} status={status} onClick={() => onOpen(app)} />
    </div>
  );
}

function PipelineColumn({
  status,
  apps,
  onOpen,
}: {
  status: AppStatus;
  apps: InterviewApplicationWithRounds[];
  onOpen: (app: InterviewApplicationWithRounds) => void;
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
        "flex min-h-[18rem] w-[18rem] shrink-0 flex-col rounded-xl border bg-muted/40",
        dropTarget.isDropTarget && "border-primary/40 bg-muted/60",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full border", APP_STATUS_TONE[status])} />
            <h3 className="truncate font-medium text-sm">{APP_STATUS_LABEL[status]}</h3>
          </div>
          <p className="mt-0.5 pl-4 text-muted-foreground text-xs tabular-nums">{apps.length} lamaran</p>
        </div>
      </div>

      <div
        ref={dropTarget.ref}
        className="scrollbar-thin flex flex-1 flex-col gap-2 overflow-y-auto p-2 [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1"
      >
        {apps.map((app, index) => (
          <SortableApplicationCard key={app.id} app={app} status={status} index={index} onOpen={onOpen} />
        ))}
        {apps.length === 0 ? (
          <p className="px-2 py-6 text-center text-muted-foreground text-xs">Tarik lamaran ke sini</p>
        ) : null}
      </div>
    </section>
  );
}

type PipelineBoardProps = {
  applications: InterviewApplicationWithRounds[];
  onOpen: (app: InterviewApplicationWithRounds) => void;
  onStatusChange: (appId: number, status: AppStatus) => void;
};

export function PipelineBoard({ applications, onOpen, onStatusChange }: PipelineBoardProps) {
  const [board, setBoard] = React.useState<PipelineBoardState>(() => buildBoard(applications));
  const boardBeforeDrag = React.useRef<PipelineBoardState>(board);

  React.useEffect(() => {
    setBoard(buildBoard(applications));
  }, [applications]);

  function handleDragStart(event: DragStartEvent) {
    if (event.operation.source?.type === "application") {
      boardBeforeDrag.current = board;
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.operation.source?.type === "application") {
      setBoard((current) => move(current, event));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation;
    if (source?.type !== "application") return;

    if (event.canceled) {
      setBoard(boardBeforeDrag.current);
      return;
    }

    const data = isAppDragData(source.data) ? source.data : null;
    const newStatus = isSortable(source) && isAppStatus(source.group) ? source.group : (data?.status ?? null);

    if (!data || !newStatus || newStatus === data.status) {
      setBoard(buildBoard(applications));
      return;
    }

    onStatusChange(data.app.id, newStatus);
  }

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="scrollbar-thin -mx-1 overflow-x-auto pb-2 [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
        <div className="flex min-w-min gap-3 px-1">
          {APP_STATUS_ORDER.map((status) => (
            <PipelineColumn key={status} status={status} apps={board[status]} onOpen={onOpen} />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {(source) => {
          if (source.type !== "application" || !isAppDragData(source.data)) return null;
          const status = isSortable(source) && isAppStatus(source.group) ? source.group : source.data.status;
          return <ApplicationCard app={source.data.app} status={status} onClick={() => undefined} isOverlay />;
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
