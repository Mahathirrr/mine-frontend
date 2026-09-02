import { useSortable } from "@dnd-kit/react/sortable";
import { cn } from "cn";

import { TaskCard } from "./task-card";
import type { ColumnId, Task } from "./types";

export function SortableTaskCard({
  task,
  columnId,
  index,
  onEdit,
}: {
  task: Task;
  columnId: ColumnId;
  index: number;
  onEdit?: () => void;
}) {
  const { isDragging, ref } = useSortable({
    id: task.id,
    index,
    type: "task",
    accept: "task",
    group: columnId,
    data: { type: "task", task, columnId },
  });

  return (
    <div ref={ref} className={cn("touch-none", isDragging && "opacity-30")}>
      <TaskCard task={task} columnId={columnId} onEdit={onEdit} />
    </div>
  );
}
