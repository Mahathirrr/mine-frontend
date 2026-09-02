"use client";

import * as React from "react";

import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { ArrowUpDown, Columns3, Kanban as KanbanIcon, List, Loader2, Plus, Search, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/api-error";
import { type ColumnId, tasksApi } from "@/lib/api/tasks";
import { useAuthStore } from "@/stores/auth/auth-provider";

import { ColumnFormDialog } from "./column-form-dialog";
import {
  defaultFilters,
  filterBoard,
  type KanbanFilters,
  type SortOption,
  sortBoard,
  sortOptions,
} from "./kanban-board-utils";
import { KanbanColumn } from "./kanban-column";
import { KanbanFilterPopover } from "./kanban-filter-popover";
import { KanbanListView } from "./kanban-list-view";
import { apiBoardToState, columnsFromApi, emptyBoard, findTaskColumn, findTaskIndex } from "./kanban-utils";
import { TaskCard } from "./task-card";
import { TaskFormDialog, type TaskFormValues } from "./task-form-dialog";
import type { BoardState, Column, Task } from "./types";

type TaskDragData = {
  type: "task";
  task: Task;
  columnId: ColumnId;
};

function isColumnId(value: unknown, columnIds: ColumnId[]): value is ColumnId {
  return typeof value === "string" && columnIds.includes(value);
}

function isTaskDragData(value: unknown): value is TaskDragData {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "task" &&
    "task" in value &&
    typeof value.task === "object" &&
    value.task !== null &&
    "columnId" in value &&
    typeof value.columnId === "string"
  );
}

export function KanbanBoard() {
  const token = useAuthStore((s) => s.token);
  const [columns, setColumns] = React.useState<Column[]>([]);
  const [columnIds, setColumnIds] = React.useState<ColumnId[]>([]);
  const [board, setBoard] = React.useState<BoardState>({});
  const [sourceBoard, setSourceBoard] = React.useState<BoardState>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<KanbanFilters>(defaultFilters);
  const [sort, setSort] = React.useState<SortOption>("manual");
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [formColumn, setFormColumn] = React.useState<ColumnId>("todo");
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [columnDialogOpen, setColumnDialogOpen] = React.useState(false);
  const [columnDialogMode, setColumnDialogMode] = React.useState<"create" | "rename">("create");
  const [renamingColumn, setRenamingColumn] = React.useState<Column | null>(null);
  const [view, setView] = React.useState("board");
  const boardBeforeDrag = React.useRef<BoardState>({});

  const loadBoard = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await tasksApi.board(token);
      const nextColumns = columnsFromApi(res.columns);
      const ids = nextColumns.map((column) => column.id);
      const mapped = apiBoardToState(res.board, ids);
      setColumns(nextColumns);
      setColumnIds(ids);
      setBoard(mapped);
      setSourceBoard(mapped);
      boardBeforeDrag.current = mapped;
    } catch (e) {
      toast.add({
        title: "Failed to load board",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const visibleBoard = React.useMemo(
    () => sortBoard(filterBoard(board, columnIds, search, filters), columnIds, sort),
    [board, columnIds, search, filters, sort],
  );

  async function handleMoveTask(taskId: number, columnId: ColumnId, sortOrder: number) {
    if (!token) return;
    setSaving(true);
    try {
      await tasksApi.move(token, taskId, { column_id: columnId, sort_order: sortOrder });
      await loadBoard();
    } catch (e) {
      setBoard(sourceBoard);
      toast.add({
        title: "Failed to move task",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTask(values: TaskFormValues) {
    if (!token) return;
    setSaving(true);
    try {
      await tasksApi.create(token, values);
      await loadBoard();
      toast.add({ title: "Task created", type: "success" });
    } catch (e) {
      toast.add({
        title: "Failed to create task",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTask(values: TaskFormValues) {
    if (!token || !editingTask) return;
    setSaving(true);
    try {
      const currentColumn = findTaskColumn(board, editingTask.id, columnIds);
      await tasksApi.update(token, editingTask.numericId, values);
      if (currentColumn && currentColumn !== values.column_id) {
        const targetIndex = board[values.column_id]?.length ?? 0;
        await tasksApi.move(token, editingTask.numericId, {
          column_id: values.column_id,
          sort_order: targetIndex,
        });
      }
      await loadBoard();
      toast.add({ title: "Task updated", type: "success" });
    } catch (e) {
      toast.add({
        title: "Failed to update task",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTask() {
    if (!token || !editingTask) return;
    setSaving(true);
    try {
      await tasksApi.delete(token, editingTask.numericId);
      await loadBoard();
      toast.add({ title: "Task deleted", type: "success" });
    } catch (e) {
      toast.add({
        title: "Failed to delete task",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateColumn(title: string) {
    if (!token) return;
    setSaving(true);
    try {
      await tasksApi.createColumn(token, { title });
      await loadBoard();
      toast.add({ title: "Column added", type: "success" });
    } catch (e) {
      toast.add({
        title: "Failed to add column",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function handleRenameColumn(title: string) {
    if (!token || !renamingColumn) return;
    setSaving(true);
    try {
      await tasksApi.updateColumn(token, renamingColumn.id, { title });
      await loadBoard();
      toast.add({ title: "Column renamed", type: "success" });
    } catch (e) {
      toast.add({
        title: "Failed to rename column",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteColumn(column: Column) {
    if (!token) return;
    setSaving(true);
    try {
      await tasksApi.deleteColumn(token, column.id);
      await loadBoard();
      toast.add({ title: "Column deleted", type: "success" });
    } catch (e) {
      toast.add({
        title: "Failed to delete column",
        description: e instanceof ApiError ? e.message : "Something went wrong.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    if (event.operation.source?.type === "task") {
      boardBeforeDrag.current = board;
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.operation.source?.type === "task") {
      setBoard((current) => move(current, event));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation;
    if (source?.type !== "task") return;

    if (event.canceled) {
      setBoard(boardBeforeDrag.current);
      return;
    }

    const data = isTaskDragData(source.data) ? source.data : null;
    const newColumnId = isSortable(source) && isColumnId(source.group, columnIds) ? source.group : data?.columnId;

    if (!data || !newColumnId || !isColumnId(newColumnId, columnIds)) {
      setBoard(sourceBoard);
      return;
    }

    const newIndex = findTaskIndex(board, newColumnId, data.task.id);
    const oldColumnId = findTaskColumn(boardBeforeDrag.current, data.task.id, columnIds);

    if (oldColumnId === newColumnId && newIndex === data.task.sortOrder) {
      return;
    }

    setSourceBoard(board);
    void handleMoveTask(data.task.numericId, newColumnId, Math.max(0, newIndex));
  }

  function openCreateDialog(columnId: ColumnId = columnIds[0] ?? "todo") {
    setFormMode("create");
    setEditingTask(null);
    setFormColumn(columnId);
    setFormOpen(true);
  }

  function openEditDialog(task: Task, columnId: ColumnId) {
    setFormMode("edit");
    setEditingTask(task);
    setFormColumn(columnId);
    setFormOpen(true);
  }

  function openCreateColumnDialog() {
    setColumnDialogMode("create");
    setRenamingColumn(null);
    setColumnDialogOpen(true);
  }

  function openRenameColumnDialog(column: Column) {
    setColumnDialogMode("rename");
    setRenamingColumn(column);
    setColumnDialogOpen(true);
  }

  const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? "Sort";
  const defaultColumnId = columnIds[0] ?? "todo";

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-var(--dashboard-header-height))] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <Tabs value={view} onValueChange={setView} className="min-w-0">
          <TabsList className="w-full *:data-[slot=tabs-trigger]:flex-1 sm:w-fit sm:*:data-[slot=tabs-trigger]:flex-none">
            <TabsTrigger value="board" className="gap-2">
              <KanbanIcon />
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List />
              List
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table2 />
              Table
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center 2xl:justify-end">
          <InputGroup className="min-w-0 sm:w-64 2xl:w-48">
            <InputGroupInput
              type="search"
              placeholder="Search tasks"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <KanbanFilterPopover
            board={board}
            columns={columns}
            columnIds={columnIds}
            filters={filters}
            onChange={setFilters}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowUpDown data-icon="inline-start" />
                  {sort === "manual" ? "Sort" : sortLabel}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as SortOption)}>
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="w-full sm:w-auto" onClick={openCreateColumnDialog} disabled={saving}>
            <Columns3 data-icon="inline-start" />
            Add column
          </Button>
          <Button className="w-full sm:w-auto" onClick={() => openCreateDialog(defaultColumnId)} disabled={saving}>
            <Plus data-icon="inline-start" />
            Add task
          </Button>
        </div>
      </div>

      {view === "board" ? (
        <DragDropProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden bg-muted/25 px-4 pt-4 pb-0 [scrollbar-color:var(--border)_transparent] lg:px-5 lg:pt-5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
            <div
              className="inline-grid h-full min-w-full gap-4"
              style={{ gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(20rem, 1fr))` }}
            >
              {columns.map((column, index) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  index={index}
                  tasks={visibleBoard[column.id] ?? []}
                  onAddTask={() => openCreateDialog(column.id)}
                  onEditTask={(task) => openEditDialog(task, column.id)}
                  onRenameColumn={() => openRenameColumnDialog(column)}
                  onDeleteColumn={() => void handleDeleteColumn(column)}
                />
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {(source) => {
              if (source.type !== "task" || !isTaskDragData(source.data)) return null;
              const columnId =
                isSortable(source) && isColumnId(source.group, columnIds) ? source.group : source.data.columnId;
              return <TaskCard task={source.data.task} columnId={columnId} isOverlay />;
            }}
          </DragOverlay>
        </DragDropProvider>
      ) : null}

      {view === "list" ? (
        <div className="min-h-0 flex-1 overflow-auto p-4 lg:p-6">
          <KanbanListView columns={columns} board={visibleBoard} sort={sort} onEditTask={openEditDialog} />
        </div>
      ) : null}

      {view === "table" ? (
        <div className="min-h-0 flex-1 overflow-auto p-4 lg:p-6">
          <KanbanListView columns={columns} board={visibleBoard} dense sort={sort} onEditTask={openEditDialog} />
        </div>
      ) : null}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        task={editingTask}
        columns={columns}
        defaultColumn={formColumn}
        saving={saving}
        onSubmit={formMode === "edit" ? handleUpdateTask : handleCreateTask}
        onDelete={formMode === "edit" ? handleDeleteTask : undefined}
      />

      <ColumnFormDialog
        open={columnDialogOpen}
        onOpenChange={setColumnDialogOpen}
        mode={columnDialogMode}
        initialTitle={renamingColumn?.title ?? ""}
        saving={saving}
        onSubmit={columnDialogMode === "create" ? handleCreateColumn : handleRenameColumn}
      />
    </div>
  );
}
