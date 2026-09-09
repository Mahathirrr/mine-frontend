import { format, parseISO } from "date-fns";

import type { ColumnId, KanbanColumnRecord, KanbanTask } from "@/lib/api/tasks";

import type { BoardState, Column, Task, TaskPriority } from "./types";

export function emptyBoard(columnIds: ColumnId[] = []): BoardState {
  return Object.fromEntries(columnIds.map((id) => [id, []])) as BoardState;
}

export function columnsFromApi(records: KanbanColumnRecord[]): Column[] {
  return records.map((record) => ({
    id: record.id,
    title: record.title,
  }));
}

export function apiBoardToState(board: Record<string, KanbanTask[]>, columnIds: ColumnId[]): BoardState {
  const state = emptyBoard(columnIds);
  for (const col of columnIds) {
    state[col] = (board[col] ?? []).map(apiTaskToUi);
  }
  return state;
}

export function apiTaskToUi(task: KanbanTask): Task {
  const priorityMap: Record<string, TaskPriority> = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return {
    id: String(task.id),
    numericId: task.id,
    title: task.title,
    description: task.description,
    priority: priorityMap[task.priority] ?? "Medium",
    dueDate: task.due_date ? format(parseISO(task.due_date), "MMM d") : "No date",
    dueDateRaw: task.due_date,
    progress: task.progress,
    team: task.team as Task["team"],
    link: task.link?.trim() ? task.link.trim() : null,
    sortOrder: task.sort_order,
    createdAt: task.created_at,
  };
}

export function findTaskColumn(board: BoardState, taskId: string, columnIds: ColumnId[]): ColumnId | null {
  for (const col of columnIds) {
    if (board[col]?.some((t) => t.id === taskId)) return col;
  }
  return null;
}

export function findTaskIndex(board: BoardState, columnId: ColumnId, taskId: string): number {
  return board[columnId]?.findIndex((t) => t.id === taskId) ?? -1;
}
