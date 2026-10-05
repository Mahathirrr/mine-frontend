import { cn } from "cn";

import { googleEventColors } from "./calendar-config";

type EventColorPickerProps = {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
};

export function EventColorPicker({ value, onChange, disabled }: EventColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="listbox" aria-label="Event color">
      {googleEventColors.map((entry) => {
        const selected = value.toLowerCase() === entry.accent.toLowerCase();
        return (
          <button
            key={entry.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={entry.label}
            disabled={disabled}
            title={entry.label}
            onClick={() => onChange(entry.accent)}
            className={cn(
              "size-8 rounded-full border-2 transition-[transform,box-shadow] hover:scale-105 hover:shadow-sm",
              selected ? "border-foreground ring-2 ring-ring/50" : "border-background shadow-sm",
              disabled && "pointer-events-none opacity-50",
            )}
            style={{ backgroundColor: entry.accent }}
          />
        );
      })}
    </div>
  );
}
