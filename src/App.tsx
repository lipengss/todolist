import { FormEvent, useRef, useEffect, useMemo, useState } from "react";

import { CalendarView } from "./components/CalendarView";
import { EmptyState } from "./components/EmptyState";
import { QuickAddBar } from "./components/QuickAddBar";
import { StatsView } from "./components/StatsView";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { StatsCards } from "./components/StatsCards";
import { TodoDetailPanel } from "./components/TodoDetailPanel";
import { TodoItem } from "./components/TodoItem";
import { Category, DueFilter, FilterType, Priority, PriorityFilter, Recurrence, Todo } from "./components/types";
import { DatePicker } from "./components/ui/DatePicker";
import { FormField, FormPrimitive } from "./components/ui/Form";
import { Input } from "./components/ui/Input";
import { InputNumber } from "./components/ui/InputNumber";
import { Modal } from "./components/ui/Modal";
import { ScrollArea } from "./components/ui/ScrollArea";
import { TimePicker } from "./components/ui/TimePicker";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNotificationScheduler } from "./hooks/useNotificationScheduler";
import { getSettings, updateSettings } from "./hooks/useSettings";
import { useTodos } from "./hooks/useTodos";
import { useCategories, type StoredCategory } from "./hooks/useCategories";
import { ShortcutHelpPanel } from "./components/ShortcutHelpPanel";
import { PackageOpen, Plus, Search, Trash2, CheckCircle } from "lucide-react";

const CATEGORY_STYLES: Record<string, string> = {
  "bg-chart-1": "bg-chart-1/20 text-chart-1 border-chart-1/30",
  "bg-chart-2": "bg-chart-2/20 text-chart-2 border-chart-2/30",
  "bg-chart-3": "bg-chart-3/20 text-chart-3 border-chart-3/30",
  "bg-chart-4": "bg-chart-4/20 text-chart-4 border-chart-4/30",
  "bg-chart-5": "bg-chart-5/20 text-chart-5 border-chart-5/30",
};

const CATEGORY_COLORS = Object.keys(CATEGORY_STYLES);
const getToday = () => new Date().toISOString().split("T")[0];

const DEFAULT_CATEGORIES: StoredCategory[] = [
  { id: "__default_work", name: "工作", color: "bg-chart-1" },
  { id: "__default_study", name: "学习", color: "bg-chart-2" },
  { id: "__default_life", name: "生活", color: "bg-chart-3" },
  { id: "__default_health", name: "健康", color: "bg-chart-4" },
];

interface NewTodoForm {
  text: string;
  note: string;
  category: string;
  priority: Priority;
  dueDate: string;
  dueTime: string;
  recurrence: Recurrence;
}

const createEmptyTodoForm = (): NewTodoForm => ({
  text: "",
  note: "",
  category: DEFAULT_CATEGORIES[0].id,
  priority: "medium",
  dueDate: getToday(),
  dueTime: "",
  recurrence: "none",
});

function isDueSoon(todo: Todo) {
  if (!todo.dueDate) return false;
  const today = new Date(getToday()).getTime();
  const due = new Date(todo.dueDate).getTime();
  return due >= today && due <= today + 7 * 24 * 60 * 60 * 1000;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export default function App() {
  const { todos, updateTodo, addTodo, removeTodos } = useTodos([]);
  const { categories: storedCategories, addCategory, updateCategory, deleteCategory } = useCategories(DEFAULT_CATEGORIES);

  type StatCardFilter = "pending" | "highPriority" | "dueSoon" | "completed";

  const [filter, setFilter] = useState<FilterType>("today");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [statCardFilter, setStatCardFilter] = useState<StatCardFilter | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoredCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("bg-chart-5");
  const [newTodo, setNewTodo] = useState<NewTodoForm>(createEmptyTodoForm);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState(getSettings);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());

  // Auto-clean trash older than 30 days
  useEffect(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const stale = todos.filter(t => t.deletedAt && t.deletedAt < thirtyDaysAgo);
    if (stale.length > 0) removeTodos(stale.map(t => t.id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      todos,
      categories: storedCategories,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `focusworkspace-backup-${getToday()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        if (!raw || typeof raw !== "object") throw new Error("Invalid format");
        const importedTodos = Array.isArray(raw.todos) ? raw.todos as Todo[] : [];
        const importedCategories = Array.isArray(raw.categories) ? raw.categories as StoredCategory[] : [];
        // Import categories first, skip duplicates
        for (const cat of importedCategories) {
          if (!storedCategories.some(c => c.name === cat.name)) {
            addCategory({ id: cat.id || generateId(), name: cat.name, color: cat.color });
          }
        }
        for (const todo of importedTodos) {
          addTodo({ ...todo, id: todo.id || generateId() });
        }
      } catch {
        alert("导入失败：文件格式不正确");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const activeTodos = useMemo(() => todos.filter((todo) => !todo.deletedAt && (!todo.completed || recentlyCompleted.has(todo.id))), [todos, recentlyCompleted]);
  const trashedTodos = useMemo(() => todos.filter((todo) => todo.deletedAt), [todos]);
  const selectedTodo = useMemo(() => todos.find((todo) => todo.id === selectedTodoId) ?? null, [selectedTodoId, todos]);

  const categories = useMemo<Category[]>(
    () =>
      storedCategories.map((category) => ({
        ...category,
        count: activeTodos.filter((todo) => todo.category === category.id).length,
      })),
    [activeTodos, storedCategories],
  );

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const filteredTodos = useMemo(() => {
    const today = getToday();
    let result = filter === "trash" ? trashedTodos : activeTodos;

    if (statCardFilter) {
      if (statCardFilter === "pending") result = result.filter((todo) => !todo.completed);
      if (statCardFilter === "highPriority") result = result.filter((todo) => !todo.completed && todo.priority === "high");
      if (statCardFilter === "dueSoon") result = result.filter((todo) => !todo.completed && isDueSoon(todo));
      if (statCardFilter === "completed") result = result.filter((todo) => todo.completed);
    } else {
      if (filter === "today") result = result.filter((todo) => !todo.completed && (todo.createdAt === today || todo.dueDate === today));
      if (filter === "completed") result = result.filter((todo) => todo.completed);
      if (filter === "inbox") result = result.filter((todo) => !todo.completed && todo.starred);
      if (filter === "planned") result = result.filter((todo) => !todo.completed && Boolean(todo.dueDate));
    }

    if (categoryFilter !== "all" && filter !== "trash") result = result.filter((todo) => todo.category === categoryFilter);
    if (priorityFilter !== "all") result = result.filter((todo) => todo.priority === priorityFilter);
    if (dueFilter === "today") result = result.filter((todo) => todo.dueDate === today);
    if (dueFilter === "upcoming") result = result.filter((todo) => Boolean(todo.dueDate) && todo.dueDate! > today);
    if (dueFilter === "none") result = result.filter((todo) => !todo.dueDate);

    const query = searchQuery.trim().toLowerCase();
    if (query) result = result.filter((todo) => `${todo.text} ${todo.note ?? ""}`.toLowerCase().includes(query));

    return [...result].sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return { high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority];
    });
  }, [activeTodos, categoryFilter, dueFilter, filter, priorityFilter, searchQuery, statCardFilter, trashedTodos]);

  const isAnyModalOpen = isCreateOpen || isCategoryOpen || editingCategory !== null || selectedTodoId !== null || isSettingsOpen;

  const getSearchInput = () => document.getElementById("search-input") as HTMLInputElement | null;

  const {
    focusedIndex,
    helpOpen,
    setHelpOpen,
    resetFocus,
  } = useKeyboardShortcuts({
    filter,
    filteredTodoCount: filteredTodos.length,
    isAnyModalOpen,
    onCreateTodo: () => setCreateOpen(true),
    onToggleFocused: (index) => {
      const todo = filteredTodos[index];
      if (todo) updateTodo(todo.id, { completed: !todo.completed });
    },
    onOpenFocused: (index) => {
      const todo = filteredTodos[index];
      if (todo) setSelectedTodoId(todo.id);
    },
    onDeleteFocused: (index) => {
      const todo = filteredTodos[index];
      if (todo) handleDeleteTodo(todo.id);
    },
    onCloseAll: () => {
      setSelectedTodoId(null);
      setCreateOpen(false);
      setEditingCategory(null);
      setCategoryOpen(false);
    },
    searchInputRef: { current: getSearchInput() },
  });

  useEffect(() => {
    resetFocus();
  }, [filter, categoryFilter, searchQuery, priorityFilter, dueFilter, resetFocus]);

  useNotificationScheduler(activeTodos, (todoId) => {
    setSelectedTodoId(todoId);
  });

  const stats = useMemo(() => {
    const unfinishedTodos = activeTodos.filter((todo) => !todo.completed);
    return {
      pending: unfinishedTodos.length,
      highPriority: unfinishedTodos.filter((todo) => todo.priority === "high").length,
      dueSoon: unfinishedTodos.filter(isDueSoon).length,
      completed: activeTodos.filter((todo) => todo.completed).length,
      today: unfinishedTodos.filter((todo) => todo.createdAt === getToday() || todo.dueDate === getToday()).length,
      planned: unfinishedTodos.filter((todo) => todo.dueDate).length,
      inbox: unfinishedTodos.filter((todo) => todo.starred).length,
      all: activeTodos.length,
      trash: trashedTodos.length,
      highPriorityCount: unfinishedTodos.filter((todo) => todo.priority === "high").length,
      dueSoonCount: unfinishedTodos.filter(isDueSoon).length,
      completedCount: activeTodos.filter((todo) => todo.completed).length,
    };
  }, [activeTodos, trashedTodos]);

  const handleCreateTodo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = newTodo.text.trim();
    if (!text) return;

    addTodo({
      id: generateId(),
      text,
      note: newTodo.note.trim() || undefined,
      completed: false,
      starred: false,
      priority: newTodo.priority,
      category: newTodo.category,
      dueDate: newTodo.dueDate || undefined,
      dueTime: newTodo.dueTime || undefined,
      recurrence: newTodo.recurrence === "none" ? undefined : newTodo.recurrence,
      createdAt: getToday(),
    } as Todo);

    setNewTodo(createEmptyTodoForm());
    setCreateOpen(false);
    setFilter("today");
  };

  const handleCreateCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    const category: StoredCategory = {
      id: generateId(),
      name,
      color: newCategoryColor,
    };

    addCategory(category);
    setNewCategoryName("");
    setNewCategoryColor("bg-chart-5");
    setCategoryOpen(false);
    setCategoryFilter(category.id);
    setNewTodo((current) => ({ ...current, category: category.id }));
  };

  const openEditCategory = (id: string, name: string, color: string) => {
    setEditingCategory({ id, name, color });
    setNewCategoryName(name);
    setNewCategoryColor(color);
  };

  const handleEditCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name || !editingCategory) return;

    updateCategory(editingCategory.id, { name, color: newCategoryColor });
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryColor("bg-chart-5");
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    if (categoryFilter === id) setCategoryFilter("all");
  };

  const handleDeleteTodo = (id: string) => {
    updateTodo(id, { deletedAt: new Date().toISOString() });
    if (selectedTodoId === id) setSelectedTodoId(null);
  };

  const handleRestoreTodo = (id: string) => {
    updateTodo(id, { deletedAt: undefined });
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateTodo(id, { completed });
    if (completed) {
      setRecentlyCompleted(prev => new Set(prev).add(id));
      setTimeout(() => setRecentlyCompleted(prev => { const next = new Set(prev); next.delete(id); return next; }), 400);
    }
  };

  const handleQuickAddTodo = (text: string, date: string) => {
    addTodo({
      id: generateId(),
      text,
      completed: false,
      starred: false,
      priority: "medium",
      category: storedCategories[0]?.id ?? DEFAULT_CATEGORIES[0].id,
      dueDate: date,
      createdAt: getToday(),
    } as Todo);
  };

  const titles: Record<FilterType, string> = {
    calendar: "日历",
    today: "今天",
    planned: "计划",
    inbox: "收集箱",
    all: "全部任务",
    completed: "已完成",
    trash: "垃圾箱",
    stats: "统计",
    approvals: "用户审批",
  };

  const formattedDate = (() => {
    const now = new Date();
    const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
  })();

  return (
    <div className="h-screen min-h-0 flex overflow-hidden bg-background">
      {!sidebarCollapsed && (
        <Sidebar
          activeFilter={filter}
          onFilterChange={(f) => { setFilter(f); setStatCardFilter(null); }}
          activeCategory={categoryFilter}
          onCategoryChange={(c) => { setCategoryFilter(c); setStatCardFilter(null); }}
          onCreateTodo={() => setCreateOpen(true)}
          onCreateCategory={() => setCategoryOpen(true)}
          onEditCategory={openEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onOpenSettings={() => { setSettingsOpen(true); setSettingsForm(getSettings()); }}
          categories={categories}
          stats={stats}
        />
      )}

      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <Header
            title={titles[filter]}
            date={formattedDate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            dueFilter={dueFilter}
            onDueFilterChange={setDueFilter}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          />
        </div>

        {filter === "calendar" ? (
          <CalendarView
            todos={activeTodos}
            categories={categoryById}
            categoryStyles={CATEGORY_STYLES}
            onOpenDetail={setSelectedTodoId}
            onToggle={(id) => { const t = todos.find(x => x.id === id); if (t) handleToggleComplete(id, !t.completed); }}
            onAddTodo={handleQuickAddTodo}
          />
        ) : filter === "stats" ? (
          <StatsView todos={activeTodos} categoryMap={categoryById} />
        ) : (
          <ScrollArea className="flex-1 min-h-0" viewportClassName="px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <main className="max-w-6xl mx-auto space-y-4 md:space-y-6">
              <StatsCards
                stats={stats}
                activeCard={statCardFilter}
                onCardClick={(key) => setStatCardFilter((prev) => (prev === key ? null : key))}
              />

              {filter !== "trash" && (
                <QuickAddBar onAdd={handleQuickAddTodo} />
              )}

              {filter !== "trash" && filteredTodos.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      batchMode ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {batchMode ? "退出批量模式" : "批量操作"}
                  </button>
                </div>
              )}

              {filter === "trash" && trashedTodos.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { if (window.confirm(`确定清空 ${trashedTodos.length} 个任务？此操作不可恢复。`)) removeTodos(trashedTodos.map(t => t.id)); }}
                    className="px-4 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    清空回收站
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {filteredTodos.length === 0 ? (
                  filter === "trash" ? (
                    <EmptyState icon={<Trash2 className="w-7 h-7" />} title="垃圾箱为空" description="删除的任务会出现在这里，30天后自动清除" />
                  ) : filter === "completed" ? (
                    <EmptyState icon={<CheckCircle className="w-7 h-7" />} title="还没有已完成的任务" description="完成任务后，它们会出现在这里" />
                  ) : searchQuery.trim() ? (
                    <EmptyState icon={<Search className="w-7 h-7" />} title="没有匹配的任务" description="试试使用不同的关键词搜索" />
                  ) : (
                    <EmptyState
                      icon={<PackageOpen className="w-7 h-7" />}
                      title="暂无任务"
                      description="点击下方按钮或使用 Ctrl+N 快捷键创建第一个任务"
                      action={
                        <button
                          onClick={() => setCreateOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          <Plus className="w-4 h-4" />
                          新建任务
                        </button>
                      }
                    />
                  )
                ) : (
                  filteredTodos.map((todo, index) => {
                    const category = categoryById.get(todo.category);
                    return (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        focused={index === focusedIndex}
                        categoryName={category?.name ?? "未分类"}
                        categoryColor={CATEGORY_STYLES[category?.color ?? ""] ?? "bg-muted text-muted-foreground border-border"}
                        isTrashView={filter === "trash"}
                        batchMode={batchMode}
                        selected={selectedIds.has(todo.id)}
                        onSelect={(id) => setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; })}
                        onOpenDetail={setSelectedTodoId}
                        onToggle={(id) => updateTodo(id, { completed: !todos.find((t) => t.id === id)?.completed })}
                        onToggleStar={(id) => updateTodo(id, { starred: !todos.find((t) => t.id === id)?.starred })}
                        onDelete={handleDeleteTodo}
                        onRestore={handleRestoreTodo}
                      />
                    );
                  })
                )}
              </div>
            </main>
          </ScrollArea>
        )}

        {/* Batch action bar */}
        {batchMode && selectedIds.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6 pointer-events-none">
            <div className="pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
              <span className="text-sm text-foreground font-medium">已选 {selectedIds.size} 项</span>
              <button
                onClick={() => {
                  if (window.confirm(`确定删除选中的 ${selectedIds.size} 个任务？`)) {
                    selectedIds.forEach(id => updateTodo(id, { deletedAt: new Date().toISOString() }));
                    setSelectedIds(new Set());
                    setBatchMode(false);
                  }
                }}
                className="px-4 py-1.5 bg-destructive/10 text-destructive text-sm rounded-lg hover:bg-destructive/20 transition-colors"
              >
                批量删除
              </button>
              <button
                onClick={() => { setSelectedIds(new Set()); setBatchMode(false); }}
                className="px-4 py-1.5 border border-border text-muted-foreground text-sm rounded-lg hover:text-foreground transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={isCreateOpen} title="新建任务" onOpenChange={setCreateOpen}>
        <FormPrimitive.Form noValidate onSubmit={handleCreateTodo} className="space-y-5">
          <FormField name="text" label="任务名称">
            <Input
              autoFocus
              required
              value={newTodo.text}
              onChange={(event) => setNewTodo((current) => ({ ...current, text: event.target.value }))}
              placeholder="输入任务名称..."
              className="h-[45px]"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField name="dueDate" label="截止日期">
              <DatePicker
                value={newTodo.dueDate}
                onChange={(value) => setNewTodo((current) => ({ ...current, dueDate: value }))}
              />
            </FormField>

            <FormField name="dueTime" label="时间">
              <TimePicker
                value={newTodo.dueTime}
                onChange={(value) => setNewTodo((current) => ({ ...current, dueTime: value }))}
              />
            </FormField>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">分类</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {storedCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setNewTodo((current) => ({ ...current, category: category.id }))}
                  className={`h-[45px] rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    newTodo.category === category.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${category.color}`} />
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">优先级</span>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {([
                { value: "low", label: "低", color: "bg-chart-4", text: "text-chart-4" },
                { value: "medium", label: "中", color: "bg-chart-1", text: "text-chart-1" },
                { value: "high", label: "高", color: "bg-chart-2", text: "text-chart-2" },
              ] as const).map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setNewTodo((current) => ({ ...current, priority: p.value as Priority }))}
                  className={`h-[45px] rounded-full text-sm font-medium transition-colors ${
                    newTodo.priority === p.value
                      ? `${p.color} text-white`
                      : `${p.color}/15 ${p.text} hover:${p.color}/25`
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">重复</span>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {([
                { value: "none" as Recurrence, label: "不重复" },
                { value: "daily" as Recurrence, label: "每天" },
                { value: "weekly" as Recurrence, label: "每周" },
                { value: "monthly" as Recurrence, label: "每月" },
              ]).map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setNewTodo((current) => ({ ...current, recurrence: r.value }))}
                  className={`h-[40px] rounded-lg text-sm font-medium transition-colors border ${
                    newTodo.recurrence === r.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="flex-1 h-[45px] rounded-lg border border-border text-foreground hover:bg-accent"
            >
              取消
            </button>
            <FormPrimitive.Submit asChild>
              <button
                type="submit"
                disabled={!newTodo.text.trim()}
                className="flex-1 h-[45px] rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                创建任务
              </button>
            </FormPrimitive.Submit>
          </div>
        </FormPrimitive.Form>
      </Modal>

      <Modal
        open={isCategoryOpen}
        title="添加任务分类"
        description="分类会显示在左侧，并保存到本地。"
        maxWidth="max-w-md"
        onOpenChange={setCategoryOpen}
      >
        <form onSubmit={handleCreateCategory} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground block mb-2">分类名称</span>
            <Input
              autoFocus
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="例如：项目、家庭、灵感"
              className="bg-background"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground block mb-2">颜色</span>
            <div className="flex gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCategoryColor(color)}
                  className={`w-8 h-8 rounded-full ${color} ${newCategoryColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
                  aria-label={`选择颜色 ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCategoryOpen(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-accent">
              取消
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
              添加分类
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editingCategory !== null}
        title="编辑任务分类"
        description="修改分类名称或颜色。"
        maxWidth="max-w-md"
        onOpenChange={(open) => { if (!open) setEditingCategory(null); }}
      >
        <form onSubmit={handleEditCategory} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground block mb-2">分类名称</span>
            <Input
              autoFocus
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="例如：项目、家庭、灵感"
              className="bg-background"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground block mb-2">颜色</span>
            <div className="flex gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCategoryColor(color)}
                  className={`w-8 h-8 rounded-full ${color} ${newCategoryColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
                  aria-label={`选择颜色 ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 rounded-lg border border-border hover:bg-accent">
              取消
            </button>
            <button type="submit" disabled={!newCategoryName.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
              保存修改
            </button>
          </div>
        </form>
      </Modal>

      {selectedTodo && (
        <TodoDetailPanel
          todo={selectedTodo}
          categories={storedCategories}
          categoryStyle={
            CATEGORY_STYLES[storedCategories.find((category) => category.id === selectedTodo.category)?.color ?? ""] ??
            "bg-muted text-muted-foreground border-border"
          }
          onClose={() => setSelectedTodoId(null)}
          onUpdate={updateTodo}
          onDelete={handleDeleteTodo}
          onRestore={handleRestoreTodo}
        />
      )}
      <ShortcutHelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />

      <Modal open={isSettingsOpen} title="设置" maxWidth="max-w-sm" onOpenChange={setSettingsOpen}>
        <FormPrimitive.Form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            updateSettings(settingsForm);
            setSettingsOpen(false);
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground mb-2 block">提前提醒时间（分钟）</span>
            <InputNumber
              value={settingsForm.reminderMinutes}
              min={1}
              max={120}
              onChange={(v) => setSettingsForm((s) => ({ ...s, reminderMinutes: v }))}
              className="h-[45px] w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">重复提醒</span>
            <button
              type="button"
              onClick={() => setSettingsForm((s) => ({ ...s, repeatEnabled: !s.repeatEnabled }))}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                settingsForm.repeatEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                  settingsForm.repeatEnabled ? "translate-x-6 left-0.5" : "left-1"
                }`}
              />
            </button>
          </div>

          {settingsForm.repeatEnabled && (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground mb-2 block">重复间隔（分钟）</span>
              <InputNumber
                value={settingsForm.repeatIntervalMinutes}
                min={1}
                max={60}
                onChange={(v) => setSettingsForm((s) => ({ ...s, repeatIntervalMinutes: v }))}
                className="h-[45px] w-full"
              />
            </div>
          )}

          <div className="pt-4 border-t border-border space-y-3">
            <span className="text-sm text-muted-foreground mb-2 block">数据管理</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleExportData}
                className="flex-1 h-[45px] rounded-lg border border-border text-foreground hover:bg-accent text-sm"
              >
                导出备份
              </button>
              <button
                type="button"
                onClick={handleImportData}
                className="flex-1 h-[45px] rounded-lg border border-border text-foreground hover:bg-accent text-sm"
              >
                导入恢复
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-sm"
            >
              取消
            </button>
            <FormPrimitive.Submit asChild>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm"
              >
                保存
              </button>
            </FormPrimitive.Submit>
          </div>
        </FormPrimitive.Form>
      </Modal>
    </div>
  );
}
