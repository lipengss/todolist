import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import { Input } from "./ui/Input";

interface QuickAddBarProps {
  onAdd: (text: string, date: string) => void;
}

const getToday = () => new Date().toISOString().split("T")[0];

export function QuickAddBar({ onAdd }: QuickAddBarProps) {
  const [text, setText] = useState("");
  const [date, setDate] = useState(getToday());
  const [showDate, setShowDate] = useState(false);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, date);
    setText("");
    setDate(getToday());
    setShowDate(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors">
      <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        placeholder="快速添加任务，按 Enter 创建..."
        className="flex-1 bg-transparent border-none shadow-none h-10 text-sm placeholder:text-muted-foreground/60"
      />
      <div className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => setShowDate(!showDate)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            showDate ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
          title="设置日期"
        >
          <CalendarDays className="w-4 h-4" />
        </button>
        {showDate && (
          <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-xl p-2 shadow-lg">
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setShowDate(false); }}
              className="w-36 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        )}
      </div>
    </div>
  );
}
