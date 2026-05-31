import { Check, FileText, Repeat, Star, Trash2, RotateCcw } from "lucide-react";
import { Todo } from "./types";

interface TodoItemProps {
  todo: Todo;
  categoryName: string;
  categoryColor: string;
  isTrashView: boolean;
  focused?: boolean;
  onOpenDetail: (id: string) => void;
  onToggle: (id: string) => void;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function TodoItem({
  todo,
  categoryName,
  categoryColor,
  isTrashView,
  focused = false,
  onOpenDetail,
  onToggle,
  onToggleStar,
  onDelete,
  onRestore,
}: TodoItemProps) {
  const priorityColors = {
    high: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    medium: "bg-chart-1/20 text-chart-1 border-chart-1/30",
    low: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  };
  const priorityLabels = { high: "高", medium: "中", low: "低" };
  const dateLabel = todo.dueDate ? todo.dueDate : "无日期";

  const subtaskCount = Array.isArray(todo.subtasks) ? todo.subtasks.length : 0;
  const completedSubtaskCount = Array.isArray(todo.subtasks) ? todo.subtasks.filter((s) => s.completed).length : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(todo.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpenDetail(todo.id);
      }}
      className={`group flex items-start gap-4 p-5 bg-card rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none ${todo.completed ? "animate-complete" : "animate-fade-in"} ${focused ? "border-primary/50 ring-2 ring-primary/50" : "border-border hover:border-primary/50 hover:shadow-md"}`}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle(todo.id);
        }}
        disabled={isTrashView}
        className={`flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          todo.completed
            ? "bg-chart-3 border-chart-3"
            : "border-muted-foreground/40 hover:border-primary"
        } ${isTrashView ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label={todo.completed ? "标记为未完成" : "标记为已完成"}
      >
        {todo.completed && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-2">
          <p className={`flex-1 leading-normal transition-colors ${todo.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {todo.text}
          </p>
          {todo.note && <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleStar(todo.id);
            }}
            disabled={isTrashView}
            className={`w-8 h-8 -mt-1 rounded-lg inline-flex items-center justify-center transition-colors ${
              todo.starred ? "text-chart-1" : "text-muted-foreground hover:text-chart-1 hover:bg-accent"
            } ${isTrashView ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label={todo.starred ? "取消收藏" : "收藏任务"}
          >
            <Star className={`w-4 h-4 ${todo.starred ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-md border ${categoryColor}`}>{categoryName}</span>
          <span className={`text-xs px-2 py-0.5 rounded-md border ${priorityColors[todo.priority]}`}>
            {priorityLabels[todo.priority]}
          </span>
          {todo.recurrence && todo.recurrence !== "none" && (
            <span className="inline-flex items-center gap-1 text-xs text-chart-5">
              <Repeat className="w-3 h-3" />
              {{ daily: "每天", weekly: "每周", monthly: "每月" }[todo.recurrence]}
            </span>
          )}
          {subtaskCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-12 h-1 bg-muted rounded-full overflow-hidden flex-shrink-0">
                <span
                  className="block h-full bg-chart-5 rounded-full transition-all duration-300"
                  style={{ width: `${(completedSubtaskCount / subtaskCount) * 100}%` }}
                />
              </span>
              {completedSubtaskCount}/{subtaskCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 text-right min-w-24">
        <p className="text-sm text-muted-foreground">{dateLabel}</p>
        {todo.dueTime && <p className="text-xs text-muted-foreground mt-0.5">{todo.dueTime}</p>}
        <div className="flex justify-end gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {isTrashView ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRestore(todo.id);
              }}
              className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-chart-3 hover:bg-accent"
              aria-label="恢复任务"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (window.confirm("确定要删除这个任务吗？")) {
                  onDelete(todo.id);
                }
              }}
              className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-accent"
              aria-label="移到回收站"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}