import * as Checkbox from "@radix-ui/react-checkbox";
import { CalendarDays, Check, Clock, FileText, Flag, Plus, Trash2, X } from "lucide-react";
import { Category, Priority, Todo } from "./types";
import { useState } from "react";
import { DatePicker } from "./ui/DatePicker";
import { TimePicker } from "./ui/TimePicker";

interface TodoDetailPanelProps {
  todo: Todo;
  categories: Omit<Category, "count">[];
  categoryStyle: string;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Todo>) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function TodoDetailPanel({
  todo,
  categories,
  categoryStyle: _categoryStyle,
  onClose,
  onUpdate,
  onDelete,
  onRestore,
}: TodoDetailPanelProps) {
  const isDeleted = Boolean(todo.deletedAt);
  const [subtasks, setSubtasks] = useState<{ id: string; text: string; completed: boolean }[]>(
    Array.isArray(todo.subtasks) ? todo.subtasks : []
  );
  const [text, setText] = useState(todo.text);
  const [newSubtask, setNewSubtask] = useState("");
  const [note, setNote] = useState(todo.note ?? "");

  const category = categories.find((c) => c.id === todo.category);

  const handleSaveText = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== todo.text) {
      onUpdate(todo.id, { text: trimmed });
    } else if (!trimmed) {
      setText(todo.text);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const newItem = { id: crypto.randomUUID(), text: newSubtask, completed: false };
    const updated = [...subtasks, newItem];
    setSubtasks(updated);
    setNewSubtask("");
    onUpdate(todo.id, { subtasks: updated });
  };

  const handleToggleSubtask = (index: number) => {
    const updated = subtasks.map((s, i) => (i === index ? { ...s, completed: !s.completed } : s));
    setSubtasks(updated);
    onUpdate(todo.id, { subtasks: updated });
  };

  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border-l border-border w-[576px] h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Checkbox.Root
              checked={todo.completed}
              onCheckedChange={() => onUpdate(todo.id, { completed: !todo.completed })}
              disabled={isDeleted}
              className="flex-shrink-0 mt-1 w-6 h-6 rounded border-2 border-muted-foreground/40 flex items-center justify-center transition-colors hover:border-primary data-[state=checked]:bg-chart-3 data-[state=checked]:border-chart-3"
            >
              <Checkbox.Indicator>
                <Check className="w-4 h-4 text-white" />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleSaveText}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="text-xl font-medium text-foreground bg-transparent border-none outline-none min-w-0 flex-1 placeholder:text-muted-foreground"
              placeholder="未命名任务"
            />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="关闭详情"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meta info with icons */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <DatePicker
                  value={todo.dueDate ?? ""}
                  placeholder="未设置日期"
                  onChange={(v) => onUpdate(todo.id, { dueDate: v || undefined })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <TimePicker
                  value={todo.dueTime ?? ""}
                  placeholder="未设置时间"
                  onChange={(v) => onUpdate(todo.id, { dueTime: v || undefined })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Flag className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex gap-1.5">
                {([
                  { value: "low" as Priority, label: "低", color: "bg-chart-4", text: "text-chart-4" },
                  { value: "medium" as Priority, label: "中", color: "bg-chart-1", text: "text-chart-1" },
                  { value: "high" as Priority, label: "高", color: "bg-chart-2", text: "text-chart-2" },
                ]).map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => onUpdate(todo.id, { priority: p.value })}
                    className={`h-[35px] px-3 rounded-lg border text-sm transition-colors flex items-center gap-1.5 ${
                      todo.priority === p.value
                        ? `${p.color} text-white border-transparent`
                        : `bg-card border-border ${p.text} hover:border-current`
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${todo.priority === p.value ? "bg-white" : p.color}`} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-2.5 ${category?.color ?? "bg-muted"} flex-shrink-0`} />
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onUpdate(todo.id, { category: cat.id })}
                    className={`h-[35px] px-3 rounded-lg border text-sm transition-colors flex items-center gap-1.5 ${
                      todo.category === cat.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Subtasks */}
          <section className="border-t border-border pt-6 space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm text-muted-foreground font-medium">子任务 ({completedCount}/{subtasks.length})</h3>
            </div>
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div key={subtask.id} className="flex items-center gap-3 bg-card rounded-xl px-3 py-3">
                  <Checkbox.Root
                    checked={subtask.completed}
                    onCheckedChange={() => handleToggleSubtask(index)}
                    className="w-4 h-4 rounded border-2 border-muted-foreground/40 flex items-center justify-center transition-colors hover:border-primary data-[state=checked]:bg-chart-3 data-[state=checked]:border-chart-3"
                  >
                    <Checkbox.Indicator>
                      <Check className="w-3 h-3 text-white" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <span className={`flex-1 text-sm ${subtask.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {subtask.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                placeholder="添加子任务..."
                className="flex-1 h-10 bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-ring/30 placeholder:text-muted-foreground"
              />
              <button
                onClick={handleAddSubtask}
                className="h-10 px-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Notes */}
          <section className="border-t border-border pt-6 space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm text-muted-foreground font-medium">备注</h3>
            </div>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                onUpdate(todo.id, { note: e.target.value || undefined });
              }}
              rows={5}
              placeholder="添加备注..."
              className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-ring/30 resize-none placeholder:text-muted-foreground"
            />
          </section>

          {/* Actions */}
          <div className="pt-4 border-t border-border">
            {isDeleted ? (
              <button
                onClick={() => onRestore(todo.id)}
                className="w-full h-11 px-4 py-2.5 rounded-xl border border-chart-3/40 text-chart-3 hover:bg-chart-3/10"
              >
                恢复任务
              </button>
            ) : (
              <button
                onClick={() => onDelete(todo.id)}
                className="w-full h-11 px-4 py-2.5 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                移到回收站
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}