export type ColumnId = string;

export type Column = {
  id: ColumnId;
  title: string;
};

export type TaskTeam =
  | "Backend"
  | "Data"
  | "Design"
  | "Docs"
  | "Finance Ops"
  | "Platform"
  | "Product"
  | "QA"
  | "Security";

export type TaskPriority = "High" | "Medium" | "Low";

export type Task = {
  id: string;
  numericId: number;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  dueDateRaw: string | null;
  progress: number;
  team: TaskTeam | string;
  link: string | null;
  sortOrder: number;
  createdAt: string;
};

export type BoardState = Record<ColumnId, Task[]>;
