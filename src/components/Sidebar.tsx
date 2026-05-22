import { Calendar, CheckCircle, Clock, FileText, Inbox, Plus, Trash2 } from "lucide-react";
import { Category, FilterType } from "./types";
import { ScrollArea } from "./ui/ScrollArea";

interface SidebarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onCreateTodo: () => void;
  onCreateCategory: () => void;
  categories: Category[];
  stats: {
    today: number;
    planned: number;
    inbox: number;
    all: number;
    completed: number;
    trash: number;
  };
}

export function Sidebar({
  activeFilter,
  onFilterChange,
  activeCategory,
  onCategoryChange,
  onCreateTodo,
  onCreateCategory,
  categories,
  stats,
}: SidebarProps) {
  const mainViews = [
    { id: "today" as FilterType, label: "今天", icon: Calendar, count: stats.today },
    { id: "planned" as FilterType, label: "计划", icon: Clock, count: stats.planned },
    { id: "inbox" as FilterType, label: "收集箱", icon: Inbox, count: stats.inbox },
    { id: "all" as FilterType, label: "全部任务", icon: FileText, count: stats.all },
  ];

  const bottomViews = [
    { id: "completed" as FilterType, label: "已完成", icon: CheckCircle, count: stats.completed },
    { id: "trash" as FilterType, label: "回收站", icon: Trash2, count: stats.trash },
  ];

  return (
    <aside className="w-80 h-full min-h-0 bg-sidebar flex flex-col">
      <div className="p-6 pb-0 mb-8 flex-shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl text-foreground">FocusWorkspace</h1>
        </div>
        <button
          type="button"
          onClick={onCreateTodo}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>新建任务</span>
        </button>
      </div>

      <ScrollArea className="flex-1 min-h-0 px-6 pb-6" viewportClassName="pr-2">
        <div className="space-y-8">
          <section>
            <h2 className="text-xs text-sidebar-foreground px-3 mb-3">主视图</h2>
            <div className="space-y-1">
              {mainViews.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => onFilterChange(view.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeFilter === view.id ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <view.icon className="w-5 h-5" />
                    <span>{view.label}</span>
                  </div>
                  <span className="text-sm">{view.count}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between px-3 mb-3">
              <h2 className="text-xs text-sidebar-foreground">任务分类</h2>
              <button type="button" onClick={onCreateCategory} className="text-sidebar-foreground hover:text-foreground" aria-label="添加分类">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onCategoryChange("all")}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeCategory === "all" ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span>全部分类</span>
                </div>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryChange(category.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    activeCategory === category.id ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${category.color}`} />
                    <span className="truncate">{category.name}</span>
                  </div>
                  <span className="text-sm">{category.count}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-1 pt-4 border-t border-border">
            {bottomViews.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => onFilterChange(view.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeFilter === view.id ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <view.icon className="w-5 h-5" />
                  <span>{view.label}</span>
                </div>
                <span className="text-sm">{view.count}</span>
              </button>
            ))}
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}
