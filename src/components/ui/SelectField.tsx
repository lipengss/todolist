import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps<T extends string> {
  value: T;
  options: SelectOption[];
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  onChange: (value: T) => void;
}

export function SelectField<T extends string>({
  value,
  options,
  ariaLabel,
  className = "",
  disabled = false,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <Select.Root value={value} disabled={disabled} onValueChange={(nextValue) => onChange(nextValue as T)}>
      <Select.Trigger
        aria-label={ariaLabel}
        className={`h-11 inline-flex items-center justify-between gap-2 bg-card border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-ring/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className="z-[80] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
        >
          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-default select-none items-center rounded-lg px-8 py-2.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
              >
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <Check className="w-4 h-4" />
                </Select.ItemIndicator>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
