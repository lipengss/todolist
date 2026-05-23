import * as Popover from "@radix-ui/react-popover";
import { zhCN } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

interface DatePickerProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}月${parseInt(d)}日`;
}

export function DatePicker({ value, placeholder = "选择日期...", onChange }: DatePickerProps) {
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="w-full h-[45px] inline-flex items-center justify-between gap-2 bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 ring-ring/30 transition-colors"
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
          <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-[80] rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-3"
        >
          <DayPicker
            mode="single"
            locale={zhCN}
            selected={selected}
            onSelect={(day) => {
              if (day) {
                const y = day.getFullYear();
                const m = String(day.getMonth() + 1).padStart(2, "0");
                const d = String(day.getDate()).padStart(2, "0");
                onChange(`${y}-${m}-${d}`);
              }
            }}
            showOutsideDays
            fixedWeeks
            classNames={{
              root: "text-sm",
              months: "flex flex-col gap-4",
              month_caption: "flex items-center justify-between h-9 px-1",
              caption_label: "text-sm font-medium text-foreground",
              nav: "flex items-center gap-1",
              button_previous: "inline-flex items-center justify-center size-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground",
              button_next: "inline-flex items-center justify-center size-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground",
              chevron: "size-4",
              weeks: "flex flex-col gap-1",
              weekdays: "flex",
              weekday: "size-9 text-xs text-muted-foreground font-medium flex items-center justify-center",
              week: "flex",
              day: "size-9 text-sm flex items-center justify-center rounded-md hover:bg-accent text-foreground",
              day_button: "size-9",
              today: "font-semibold text-primary",
              selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              outside: "text-muted-foreground/50",
              disabled: "text-muted-foreground/30",
              hidden: "invisible",
            }}
            components={{
              Chevron: (props) => {
                if (props.orientation === "left") return <ChevronLeft className="size-4" />;
                return <ChevronRight className="size-4" />;
              },
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
