import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "./ui/Input";

interface QuickAddBarProps {
  onAdd: (text: string) => void;
}

export function QuickAddBar({ onAdd }: QuickAddBarProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors">
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
    </div>
  );
}
