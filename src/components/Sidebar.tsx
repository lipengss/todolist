import { CalendarDays, CheckCircle, CirclePlus, Clock, FileText, Pencil, Plus, Settings, SquarePen, Star, Trash2, Plane } from "lucide-react";
import { useState } from "react";
import { Category, FilterType } from "./types";
import { ScrollArea } from "./ui/ScrollArea";

interface SidebarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onCreateTodo: () => void;
  onCreateCategory: () => void;
  onEditCategory: (id: string, name: string, color: string) => void;
  onDeleteCategory: (id: string) => void;
  onOpenSettings: () => void;
  categories: Category[];
  stats: {
    today: number;
    planned: number;
    inbox: number;
    all: number;
    completed: number;
    trash: number;
    highPriorityCount?: number;
    dueSoonCount?: number;
    completedCount?: number;
  };
}

export function Sidebar({
  activeFilter,
  onFilterChange,
  activeCategory,
  onCategoryChange,
  onCreateTodo,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  onOpenSettings,
  categories,
  stats,
}: SidebarProps) {
  const [categoryEditMode, setCategoryEditMode] = useState(false);
  const mainViews: { id: FilterType; label: string; icon: typeof CalendarDays; count?: number }[] = [
    { id: "calendar", label: "日历", icon: CalendarDays },
    { id: "today", label: "今天", icon: Clock, count: stats.today },
    { id: "planned" as FilterType, label: "计划", icon: Plane, count: stats.planned },
    { id: "inbox" as FilterType, label: "收集箱", icon: Star, count: stats.inbox },
    { id: "all" as FilterType, label: "全部任务", icon: FileText, count: stats.all },
  ];

  const bottomViews: { id: FilterType; label: string; icon: typeof CheckCircle; count?: number }[] = [
    { id: "completed", label: "已完成", icon: CheckCircle, count: stats.completed },
    { id: "trash", label: "垃圾箱", icon: Trash2, count: stats.trash },
  ];

  return (
    <aside className="w-80 h-full min-h-0 bg-sidebar flex flex-col">
      <div className="p-6 pb-0 mb-8 flex-shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl text-foreground flex-1">FocusWorkspace</h1>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
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
                  {view.count !== undefined && <span className="text-sm">{view.count}</span>}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between px-3 mb-3">
              <h2 className="text-xs text-sidebar-foreground">任务分类</h2>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setCategoryEditMode((prev) => !prev)}
                  className={`p-1 rounded transition-colors ${
                    categoryEditMode ? "text-primary" : "text-sidebar-foreground hover:text-foreground"
                  }`}
                  aria-label="编辑分类"
                >
                  <SquarePen className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { onCreateCategory(); setCategoryEditMode(false); }}
                  className="text-sidebar-foreground hover:text-foreground p-1 rounded"
                  aria-label="添加分类"
                >
                  <CirclePlus className="w-4 h-4" />
                </button>
              </div>
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
                <div key={category.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onCategoryChange(category.id)}
                    className={`flex-1 min-w-0 flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      activeCategory === category.id ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${category.color}`} />
                      <span className="truncate">{category.name}</span>
                    </div>
                    <span className="text-sm">{category.count}</span>
                  </button>
                  {categoryEditMode && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditCategory(category.id, category.name, category.color)}
                        className="p-1.5 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                        aria-label={`编辑 ${category.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(category.id)}
                        className="p-1.5 rounded-lg text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`删除 ${category.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
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
