"use client";

import type * as React from "react";

import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import type { ColumnId } from "@/lib/api/tasks";

import { collectTeams, countActiveFilters, defaultFilters, type KanbanFilters } from "./kanban-board-utils";
import type { BoardState, Column, TaskPriority } from "./types";

const priorityOptions: TaskPriority[] = ["High", "Medium", "Low"];

type KanbanFilterPopoverProps = {
  board: BoardState;
  columns: Column[];
  columnIds: ColumnId[];
  filters: KanbanFilters;
  onChange: (filters: KanbanFilters) => void;
};

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function KanbanFilterPopover({ board, columns, columnIds, filters, onChange }: KanbanFilterPopoverProps) {
  const teams = collectTeams(board, columnIds);
  const activeCount = countActiveFilters(filters);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" className="w-full sm:w-auto">
            <SlidersHorizontal data-icon="inline-start" />
            Filter
            {activeCount > 0 ? (
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 tabular-nums">
                {activeCount}
              </Badge>
            ) : null}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <PopoverHeader className="flex flex-row items-center justify-between gap-2">
          <PopoverTitle>Filter tasks</PopoverTitle>
          {activeCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => onChange(defaultFilters)}>
              Clear
            </Button>
          ) : null}
        </PopoverHeader>

        <div className="space-y-4">
          <FilterSection title="Priority">
            {priorityOptions.map((priority) => (
              <FilterCheckbox
                key={priority}
                id={`priority-${priority}`}
                label={priority}
                checked={filters.priorities.includes(priority)}
                onCheckedChange={() => onChange({ ...filters, priorities: toggleValue(filters.priorities, priority) })}
              />
            ))}
          </FilterSection>

          <FilterSection title="Column">
            {columns.map((column) => (
              <FilterCheckbox
                key={column.id}
                id={`column-${column.id}`}
                label={column.title}
                checked={filters.columns.includes(column.id as ColumnId)}
                onCheckedChange={() =>
                  onChange({
                    ...filters,
                    columns: toggleValue(filters.columns, column.id as ColumnId),
                  })
                }
              />
            ))}
          </FilterSection>

          {teams.length > 0 ? (
            <FilterSection title="Team">
              {teams.map((team) => (
                <FilterCheckbox
                  key={team}
                  id={`team-${team}`}
                  label={team}
                  checked={filters.teams.includes(team)}
                  onCheckedChange={() => onChange({ ...filters, teams: toggleValue(filters.teams, team) })}
                />
              ))}
            </FilterSection>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="font-normal text-sm">
        {label}
      </Label>
    </div>
  );
}
