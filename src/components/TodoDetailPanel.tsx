import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, CheckCircle2, Clock, Star, Trash2, X } from "lucide-react";
import { Category, Priority, Todo } from "./types";
import { SelectField } from "./ui/SelectField";

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
  categoryStyle,
  onClose,
  onUpdate,
  onDelete,
  onRestore,
}: TodoDetailPanelProps) {
  const isDeleted = Boolean(todo.deletedAt);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[576px] max-w-full bg-card border-l border-border shadow-2xl overflow-y-auto focus:outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-200">
          <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-6 py-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className="text-xs text-muted-foreground mb-1">任务详情</Dialog.Title>
              <Dialog.Description className="sr-only">编辑任务标题、备注、分类、优先级、日期和状态。</Dialog.Description>
              <h2 className="text-xl font-medium text-foreground truncate">{todo.text || "未命名任务"}</h2>
            </div>
            <Dialog.Close
              className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="关闭详情"
            >
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeleted}
                onClick={() => onUpdate(todo.id, { completed: !todo.completed })}
                className={`h-11 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                  todo.completed
                    ? "border-chart-3/40 bg-chart-3/10 text-chart-3"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                } ${isDeleted ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {todo.completed ? "已完成" : "标记完成"}
              </button>

              <button
                type="button"
                disabled={isDeleted}
                onClick={() => onUpdate(todo.id, { starred: !todo.starred })}
                className={`h-11 flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
                  todo.starred
                    ? "border-chart-1/40 bg-chart-1/10 text-chart-1"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                } ${isDeleted ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Star className={`w-4 h-4 ${todo.starred ? "fill-current" : ""}`} />
                {todo.starred ? "已收藏" : "收藏"}
              </button>
            </div>

            <section className="space-y-3">
              <label className="block space-y-2">
                <span className="text-sm text-muted-foreground">标题</span>
                <input
                  value={todo.text}
                  disabled={isDeleted}
                  onChange={(event) => onUpdate(todo.id, { text: event.target.value })}
                  className="h-11 w-full bg-card border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-ring/30 disabled:opacity-60"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-muted-foreground">详情备注</span>
                <textarea
                  value={todo.note ?? ""}
                  disabled={isDeleted}
                  onChange={(event) => onUpdate(todo.id, { note: event.target.value || undefined })}
                  rows={7}
                  placeholder="记录背景、链接、拆解步骤或下一步动作"
                  className="w-full bg-card border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-ring/30 resize-none disabled:opacity-60 placeholder:text-muted-foreground"
                />
              </label>
            </section>

            <section className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-2">
                  <span className="text-sm text-muted-foreground">分类</span>
                  <SelectField
                    value={todo.category}
                    disabled={isDeleted}
                    onChange={(category) => onUpdate(todo.id, { category })}
                    ariaLabel="任务分类"
                    className="w-full"
                    options={categories.map((category) => ({ value: category.id, label: category.name }))}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm text-muted-foreground">优先级</span>
                  <SelectField<Priority>
                    value={todo.priority}
                    disabled={isDeleted}
                    onChange={(priority) => onUpdate(todo.id, { priority })}
                    ariaLabel="任务优先级"
                    className="w-full"
                    options={[
                      { value: "high", label: "高" },
                      { value: "medium", label: "中" },
                      { value: "low", label: "低" },
                    ]}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-2">
                  <span className="text-sm text-muted-foreground">截止日期</span>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={todo.dueDate ?? ""}
                      disabled={isDeleted}
                      onChange={(event) => onUpdate(todo.id, { dueDate: event.target.value || undefined })}
                      className="h-11 w-full bg-card border border-border rounded-xl pl-11 pr-4 py-2.5 outline-none focus:ring-2 ring-ring/30 disabled:opacity-60"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm text-muted-foreground">提醒时间</span>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="time"
                      value={todo.dueTime ?? ""}
                      disabled={isDeleted}
                      onChange={(event) => onUpdate(todo.id, { dueTime: event.target.value || undefined })}
                      className="h-11 w-full bg-card border border-border rounded-xl pl-11 pr-4 py-2.5 outline-none focus:ring-2 ring-ring/30 disabled:opacity-60"
                    />
                  </div>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-background/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">当前分类</span>
                <span className={`text-xs px-2 py-0.5 rounded-md border ${categoryStyle}`}>
                  {categories.find((category) => category.id === todo.category)?.name ?? "未分类"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">创建时间</span>
                <span>{todo.createdAt}</span>
              </div>
              {todo.deletedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">删除时间</span>
                  <span>{todo.deletedAt.slice(0, 10)}</span>
                </div>
              )}
            </section>

            <div className="pt-2">
              {isDeleted ? (
                <button
                  type="button"
                  onClick={() => onRestore(todo.id)}
                  className="w-full h-11 px-4 py-2.5 rounded-xl border border-chart-3/40 text-chart-3 hover:bg-chart-3/10"
                >
                  恢复任务
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onDelete(todo.id)}
                  className="w-full h-11 px-4 py-2.5 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  移到回收站
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
