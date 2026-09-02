import { createFileRoute } from "@tanstack/react-router";

import { KanbanBoard } from "./-components/kanban-board";

export const Route = createFileRoute("/(main)/dashboard/kanban")({
  component: Page,
});

function Page() {
  return (
    <div data-content-padding="false">
      <KanbanBoard />
    </div>
  );
}
