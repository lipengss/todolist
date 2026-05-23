import { Check, FileText, Star, Trash2, RotateCcw } from "lucide-react";
import { Todo } from "./types";

interface TodoItemProps {
  todo: Todo;
  categoryName: string;
  categoryColor: string;
  isTrashView: boolean;
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
      className="group flex items-start gap-4 p-5 bg-card rounded-2xl border border-border hover:border-primary/50 transition-colors cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
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
          {subtaskCount > 0 && (
            <span className="text-xs text-muted-foreground">
              子任务 {completedSubtaskCount}/{subtaskCount}
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
                onDelete(todo.id);
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