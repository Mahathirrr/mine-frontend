import { cn } from "cn";

import { eventColorPalette } from "./calendar-config";

type EventColorPickerProps = {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
};

export function EventColorPicker({ value, onChange, disabled }: EventColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="listbox" aria-label="Event color">
      {eventColorPalette.map((entry) => {
        const selected = value.toLowerCase() === entry.hex;
        return (
          <button
            key={entry.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={entry.label}
            disabled={disabled}
            title={entry.label}
            onClick={() => onChange(entry.hex)}
            className={cn(
              "size-7 rounded-full border-2 transition-transform hover:scale-105",
              selected ? "border-foreground ring-2 ring-ring/40" : "border-transparent",
              disabled && "pointer-events-none opacity-50",
            )}
            style={{ backgroundColor: entry.hex }}
          />
        );
      })}
    </div>
  );
}
