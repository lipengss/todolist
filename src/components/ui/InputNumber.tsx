import { ChevronDown, ChevronUp } from "lucide-react";

interface InputNumberProps {
  value: number;
  min?: number;
  max?: number;
  className?: string;
  onChange: (value: number) => void;
}

export function InputNumber({
  value,
  min,
  max,
  className = "",
  onChange,
}: InputNumberProps) {
  const stepDown = () => {
    const next = value - 1;
    if (min !== undefined && next < min) return;
    onChange(next);
  };

  const stepUp = () => {
    const next = value + 1;
    if (max !== undefined && next > max) return;
    onChange(next);
  };

  return (
    <div className={`inline-flex items-stretch bg-card border border-border rounded-lg overflow-hidden focus-within:ring-2 ring-ring/30 transition-colors ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        readOnly
        className="w-full bg-transparent text-foreground text-sm text-center px-3 py-2.5 outline-none"
      />
      <div className="flex flex-col border-l border-border">
        <button
          type="button"
          onClick={stepUp}
          disabled={max !== undefined && value >= max}
          className="flex-1 px-2 flex items-center justify-center hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={stepDown}
          disabled={min !== undefined && value <= min}
          className="flex-1 px-2 flex items-center justify-center border-t border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
