import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { Category, Todo } from "./types";
import { ScrollArea } from "./ui/ScrollArea";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

const PRIORITY_TEXT: Record<string, string> = {
  high: "text-chart-2",
  medium: "text-chart-1",
  low: "text-chart-4",
};

const PRIORITY_LABEL: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

interface CalendarViewProps {
  todos: Todo[];
  categories: Map<string, Category>;
  categoryStyles: Record<string, string>;
  onOpenDetail: (id: string) => void;
  onToggle: (id: string) => void;
  onAddTodo: (text: string, date: string) => void;
}

function buildMonthGrid(year: number, month: number): Date[][] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function CalendarView({
  todos,
  categories,
  categoryStyles,
  onOpenDetail,
  onToggle,
  onAddTodo,
}: CalendarViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [inlineAddDate, setInlineAddDate] = useState<string | null>(null);
  const [inlineAddText, setInlineAddText] = useState("");
  const [panelAddActive, setPanelAddActive] = useState(false);
  const [panelAddText, setPanelAddText] = useState("");

  const calendarData = useMemo(() => {
    const map = new Map<string, Todo[]>();
    for (const todo of todos) {
      if (!todo.dueDate || todo.deletedAt) continue;
      const list = map.get(todo.dueDate) ?? [];
      list.push(todo);
      map.set(todo.dueDate, list);
    }
    return map;
  }, [todos]);

  const weeks = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedTodos = selectedDateStr ? calendarData.get(selectedDateStr) ?? [] : [];

  const clearQuickAddStates = () => {
    setInlineAddDate(null);
    setInlineAddText("");
    setPanelAddActive(false);
    setPanelAddText("");
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setPanelAddActive(false);
    setPanelAddText("");
  };

  const goToPrevMonth = () => {
    const date = subMonths(new Date(viewYear, viewMonth), 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setSelectedDate(null);
    clearQuickAddStates();
  };

  const goToNextMonth = () => {
    const date = addMonths(new Date(viewYear, viewMonth), 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setSelectedDate(null);
    clearQuickAddStates();
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(today);
    clearQuickAddStates();
  };

  const handleInlineAdd = () => {
    const text = inlineAddText.trim();
    if (text && inlineAddDate) {
      onAddTodo(text, inlineAddDate);
    }
    setInlineAddDate(null);
    setInlineAddText("");
  };

  const handlePanelAdd = () => {
    const text = panelAddText.trim();
    if (text && selectedDate) {
      onAddTodo(text, format(selectedDate, "yyyy-MM-dd"));
    }
    setPanelAddActive(false);
    setPanelAddText("");
  };

  const handleCellDoubleClick = (dateStr: string) => {
    setInlineAddDate(dateStr);
    setInlineAddText("");
  };

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-accent text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold min-w-[120px] text-center">
              {viewYear}年{viewMonth + 1}月
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-accent text-foreground"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-sm text-foreground"
          >
            今天
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-xs text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-border rounded-xl overflow-hidden">
          {weeks.flat().map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const dayTodos = calendarData.get(dateStr) ?? [];
            const isCurrentMonth = isSameMonth(date, new Date(viewYear, viewMonth));
            const isTodayDate = isToday(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);

            const overflowCount = Math.max(0, dayTodos.length - 3);

            if (inlineAddDate === dateStr) {
              return (
                <div key={dateStr} className="bg-card p-1 flex flex-col gap-1 relative">
                  <span className="text-sm text-center text-muted-foreground pt-1">{format(date, "d")}</span>
                  <input
                    autoFocus
                    value={inlineAddText}
                    onChange={(e) => setInlineAddText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleInlineAdd();
                      if (e.key === "Escape") { setInlineAddDate(null); setInlineAddText(""); }
                    }}
                    onBlur={() => { setInlineAddDate(null); setInlineAddText(""); }}
                    placeholder="新任务..."
                    className="w-full bg-background border border-primary rounded-md px-2 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              );
            }

            return (
              <button
                key={dateStr}
                onClick={() => handleSelectDate(date)}
                onDoubleClick={() => handleCellDoubleClick(dateStr)}
                onMouseEnter={() => setHoveredDate(dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
                className={`relative flex flex-col items-stretch justify-start gap-0.5 pt-2 pb-1 transition-colors overflow-hidden ${
                  !isCurrentMonth
                    ? "bg-card/40 text-muted-foreground/30"
                    : isSelected
                      ? "bg-primary/15"
                      : "bg-card hover:bg-accent"
                }`}
              >
                <span
                  className={`self-center text-sm w-7 h-7 flex items-center justify-center rounded-full ${
                    isTodayDate
                      ? "bg-primary text-primary-foreground"
                      : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {format(date, "d")}
                </span>
                {isCurrentMonth && dayTodos.length > 0 && (
                  <div className="w-full px-1 space-y-0.5">
                    {dayTodos.map((t) => (
                      <div key={t.id} className="flex items-center gap-1 min-w-0">
                        <div className={`w-1 h-1 rounded-full flex-shrink-0 ${PRIORITY_TEXT[t.priority]?.replace("text-", "bg-") ?? "bg-muted-foreground"}`} />
                        <span className={`text-[10px] truncate leading-tight ${PRIORITY_TEXT[t.priority] ?? "text-foreground"}`}>
                          {t.text}
                        </span>
                      </div>
                    ))}
                    {overflowCount > 0 && (
                      <span className="text-[10px] text-muted-foreground leading-none pl-2.5">
                        +{overflowCount} 个
                      </span>
                    )}
                  </div>
                )}
                {isCurrentMonth && hoveredDate === dateStr && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellDoubleClick(dateStr);
                    }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] leading-none hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    +
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="w-80 border-l border-border flex flex-col bg-card/50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">
                  {format(selectedDate, "M月d日")} {["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][selectedDate.getDay()]}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTodos.length} 个任务
                </p>
              </div>
              <button
                onClick={() => { setPanelAddActive(true); setPanelAddText(""); }}
                className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {panelAddActive && (
              <div className="mt-3">
                <input
                  autoFocus
                  value={panelAddText}
                  onChange={(e) => setPanelAddText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePanelAdd();
                    if (e.key === "Escape") { setPanelAddActive(false); setPanelAddText(""); }
                  }}
                  placeholder="快速添加任务..."
                  className="w-full h-9 bg-background border border-primary rounded-lg px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            )}
          </div>
          <ScrollArea className="flex-1 min-h-0" viewportClassName="p-3">
            <div className="space-y-2">
              {selectedTodos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">暂无任务</p>
              ) : (
                selectedTodos.map((todo) => {
                  const category = categories.get(todo.category);
                  const catStyle =
                    categoryStyles[category?.color ?? ""] ??
                    "bg-muted text-muted-foreground border-border";
                  return (
                    <button
                      key={todo.id}
                      onClick={() => onOpenDetail(todo.id)}
                      className="w-full text-left p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          role="checkbox"
                          aria-checked={todo.completed}
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggle(todo.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              onToggle(todo.id);
                            }
                          }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-colors ${
                            todo.completed
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/40 hover:border-primary/50"
                          }`}
                        >
                          {todo.completed && (
                            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm truncate ${
                              todo.completed ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {todo.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {todo.dueTime && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {todo.dueTime}
                              </span>
                            )}
                            <span className={`text-xs font-medium ${PRIORITY_TEXT[todo.priority] ?? ""}`}>
                              {PRIORITY_LABEL[todo.priority]}
                            </span>
                            {category && (
                              <span className={`text-xs px-1.5 py-0.5 rounded border ${catStyle}`}>
                                {category.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
