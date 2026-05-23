import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Clock } from "lucide-react";

interface TimePickerProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export function TimePicker({ value, placeholder = "选择时间...", onChange }: TimePickerProps) {
  return (
    <Select.Root value={value || undefined} onValueChange={onChange}>
      <Select.Trigger
        aria-label="选择时间"
        className="w-full h-[45px] inline-flex items-center justify-between gap-2 bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 ring-ring/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          {value ? (
            <span className="text-foreground">{value}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className="z-[80] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
        >
          <Select.Viewport className="p-1 max-h-[240px]">
            {TIME_OPTIONS.map((time) => (
              <Select.Item
                key={time}
                value={time}
                className="relative flex cursor-default select-none items-center rounded-md px-8 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
              >
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <Check className="w-4 h-4" />
                </Select.ItemIndicator>
                <Select.ItemText>{time}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
