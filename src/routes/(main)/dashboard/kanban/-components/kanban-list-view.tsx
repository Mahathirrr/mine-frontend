import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { tagTones } from "./data";
import { DueDateIndicator } from "./due-date-indicator";
import type { SortOption } from "./kanban-board-utils";
import { sortFlatTasks } from "./kanban-board-utils";
import type { BoardState, Column, ColumnId, Task } from "./types";

export function KanbanListView({
  columns,
  board,
  dense = false,
  sort = "manual",
  onEditTask,
}: {
  columns: Column[];
  board: BoardState;
  dense?: boolean;
  sort?: SortOption;
  onEditTask?: (task: Task, columnId: ColumnId) => void;
}) {
  const rows = sortFlatTasks(
    columns.flatMap((column) =>
      (board[column.id] ?? []).map((task) => ({
        ...task,
        columnTitle: column.title,
        columnId: column.id,
      })),
    ),
    sort,
  );

  if (rows.length === 0) {
    return <p className="py-12 text-center text-muted-foreground text-sm">No tasks found.</p>;
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Column</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Team</TableHead>
            {!dense && <TableHead>Due</TableHead>}
            {!dense && <TableHead>Link</TableHead>}
            <TableHead className="text-right">Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((task) => (
            <TableRow
              key={task.id}
              className={onEditTask ? "cursor-pointer hover:bg-muted/50" : undefined}
              onClick={onEditTask ? () => onEditTask(task, task.columnId) : undefined}
            >
              <TableCell>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{task.title}</p>
                  {!dense && <p className="line-clamp-1 text-muted-foreground text-xs">{task.description}</p>}
                </div>
              </TableCell>
              <TableCell className="text-sm">{task.columnTitle}</TableCell>
              <TableCell className="text-sm">{task.priority}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={tagTones[task.team as keyof typeof tagTones] ?? "bg-muted text-foreground"}
                >
                  {task.team}
                </Badge>
              </TableCell>
              {!dense && (
                <TableCell>
                  <DueDateIndicator
                    dueDateRaw={task.dueDateRaw}
                    displayDate={task.dueDate}
                    isDone={task.columnId === "done"}
                  />
                </TableCell>
              )}
              {!dense && (
                <TableCell className="max-w-40 truncate text-sm">
                  {task.link ? (
                    <a
                      href={task.link.startsWith("http") ? task.link : `https://${task.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {task.link}
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
              )}
              <TableCell className="text-right text-sm tabular-nums">{task.progress}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
