import type { ColumnId } from "@/lib/api/tasks";

import type { BoardState, Task, TaskPriority } from "./types";

export type KanbanFilters = {
  priorities: TaskPriority[];
  columns: ColumnId[];
  teams: string[];
};

export type SortOption =
  | "manual"
  | "due-asc"
  | "due-desc"
  | "priority-desc"
  | "priority-asc"
  | "title-asc"
  | "title-desc"
  | "created-desc"
  | "created-asc";

export const defaultFilters: KanbanFilters = {
  priorities: [],
  columns: [],
  teams: [],
};

const priorityRank: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

function matchesSearch(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    task.title.toLowerCase().includes(q) ||
    task.description.toLowerCase().includes(q) ||
    task.team.toLowerCase().includes(q)
  );
}

function matchesFilters(task: Task, columnId: ColumnId, filters: KanbanFilters): boolean {
  if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
    return false;
  }
  if (filters.columns.length > 0 && !filters.columns.includes(columnId)) {
    return false;
  }
  if (filters.teams.length > 0 && !filters.teams.includes(task.team)) {
    return false;
  }
  return true;
}

export function filterBoard(
  board: BoardState,
  columnIds: ColumnId[],
  query: string,
  filters: KanbanFilters,
): BoardState {
  const next = Object.fromEntries(columnIds.map((id) => [id, []])) as BoardState;

  for (const col of columnIds) {
    next[col] = (board[col] ?? []).filter((task) => matchesSearch(task, query) && matchesFilters(task, col, filters));
  }

  return next;
}

function dueDateValue(task: Task): number | null {
  if (!task.dueDateRaw) return null;
  const time = Date.parse(task.dueDateRaw);
  return Number.isNaN(time) ? null : time;
}

function compareTasks(a: Task, b: Task, sort: SortOption): number {
  switch (sort) {
    case "due-asc": {
      const aDue = dueDateValue(a);
      const bDue = dueDateValue(b);
      if (aDue === null && bDue === null) return a.sortOrder - b.sortOrder;
      if (aDue === null) return 1;
      if (bDue === null) return -1;
      return aDue - bDue || a.sortOrder - b.sortOrder;
    }
    case "due-desc": {
      const aDue = dueDateValue(a);
      const bDue = dueDateValue(b);
      if (aDue === null && bDue === null) return a.sortOrder - b.sortOrder;
      if (aDue === null) return 1;
      if (bDue === null) return -1;
      return bDue - aDue || a.sortOrder - b.sortOrder;
    }
    case "priority-desc":
      return priorityRank[b.priority] - priorityRank[a.priority] || a.sortOrder - b.sortOrder;
    case "priority-asc":
      return priorityRank[a.priority] - priorityRank[b.priority] || a.sortOrder - b.sortOrder;
    case "title-asc":
      return a.title.localeCompare(b.title) || a.sortOrder - b.sortOrder;
    case "title-desc":
      return b.title.localeCompare(a.title) || a.sortOrder - b.sortOrder;
    case "created-desc":
      return b.createdAt.localeCompare(a.createdAt) || a.sortOrder - b.sortOrder;
    case "created-asc":
      return a.createdAt.localeCompare(b.createdAt) || a.sortOrder - b.sortOrder;
    default:
      return a.sortOrder - b.sortOrder;
  }
}

export function sortBoard(board: BoardState, columnIds: ColumnId[], sort: SortOption): BoardState {
  if (sort === "manual") return board;

  const next = Object.fromEntries(columnIds.map((id) => [id, []])) as BoardState;

  for (const col of columnIds) {
    next[col] = [...(board[col] ?? [])].sort((a, b) => compareTasks(a, b, sort));
  }

  return next;
}

export function collectTeams(board: BoardState, columnIds: ColumnId[]): string[] {
  const teams = new Set<string>();
  for (const col of columnIds) {
    for (const task of board[col] ?? []) {
      if (task.team.trim()) teams.add(task.team);
    }
  }
  return [...teams].sort((a, b) => a.localeCompare(b));
}

export function countActiveFilters(filters: KanbanFilters): number {
  return filters.priorities.length + filters.columns.length + filters.teams.length;
}

export function sortFlatTasks<T extends Task>(tasks: T[], sort: SortOption): T[] {
  if (sort === "manual") return tasks;
  return [...tasks].sort((a, b) => compareTasks(a, b, sort));
}

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "manual", label: "Manual order" },
  { value: "due-asc", label: "Due date (soonest)" },
  { value: "due-desc", label: "Due date (latest)" },
  { value: "priority-desc", label: "Priority (high first)" },
  { value: "priority-asc", label: "Priority (low first)" },
  { value: "title-asc", label: "Title (A to Z)" },
  { value: "title-desc", label: "Title (Z to A)" },
  { value: "created-desc", label: "Newest first" },
  { value: "created-asc", label: "Oldest first" },
];
