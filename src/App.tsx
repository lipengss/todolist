import { FormEvent, useEffect, useMemo, useState } from "react";


import { CalendarView } from "./components/CalendarView";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { StatsCards } from "./components/StatsCards";
import { TodoDetailPanel } from "./components/TodoDetailPanel";
import { TodoItem } from "./components/TodoItem";
import { Category, DueFilter, FilterType, Priority, PriorityFilter, Todo } from "./components/types";
import { DatePicker } from "./components/ui/DatePicker";
import { FormField, FormPrimitive } from "./components/ui/Form";
import { Modal } from "./components/ui/Modal";
import { ScrollArea } from "./components/ui/ScrollArea";
import { TimePicker } from "./components/ui/TimePicker";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNotificationScheduler } from "./hooks/useNotificationScheduler";
import { getSettings, updateSettings } from "./hooks/useSettings";
import { ShortcutHelpPanel } from "./components/ShortcutHelpPanel";

type StoredCategory = Omit<Category, "count">;

const DEFAULT_CATEGORIES: StoredCategory[] = [
  { id: "work", name: "工作", color: "bg-chart-5" },
  { id: "study", name: "学习", color: "bg-chart-4" },
  { id: "life", name: "生活", color: "bg-chart-1" },
  { id: "health", name: "健康", color: "bg-chart-3" },
];

const CATEGORY_STYLES: Record<string, string> = {
  "bg-chart-1": "bg-chart-1/20 text-chart-1 border-chart-1/30",
  "bg-chart-2": "bg-chart-2/20 text-chart-2 border-chart-2/30",
  "bg-chart-3": "bg-chart-3/20 text-chart-3 border-chart-3/30",
  "bg-chart-4": "bg-chart-4/20 text-chart-4 border-chart-4/30",
  "bg-chart-5": "bg-chart-5/20 text-chart-5 border-chart-5/30",
};

const CATEGORY_COLORS = Object.keys(CATEGORY_STYLES);
const TODOS_STORAGE_KEY = "focusworkspace.todos.v1";
const CATEGORIES_STORAGE_KEY = "focusworkspace.categories.v1";
const getToday = () => new Date().toISOString().split("T")[0];

const INITIAL_TODOS: Todo[] = [
  {
    id: "1",
    text: "完成产品设计稿",
    note: "检查任务详情、分类筛选和桌面端保存体验。",
    completed: false,
    starred: true,
    priority: "high",
    category: "work",
    dueDate: getToday(),
    dueTime: "14:00",
    subtasks: [
      { id: "s1", text: "设计首页", completed: true },
      { id: "s2", text: "设计详情页", completed: false },
      { id: "s3", text: "设计用户中心", completed: false },
    ],
    createdAt: getToday(),
  },
  {
    id: "2",
    text: "回复客户邮件",
    completed: false,
    starred: false,
    priority: "medium",
    category: "work",
    dueDate: getToday(),
    dueTime: "16:00",
    createdAt: getToday(),
  },
  {
    id: "3",
    text: "阅读《深度工作》第三章",
    completed: false,
    starred: false,
    priority: "medium",
    category: "study",
    dueDate: getToday(),
    dueTime: "20:00",
    subtasks: [{ id: "s4", text: "完成章节练习", completed: false }],
    createdAt: getToday(),
  },
  {
    id: "4",
    text: "健身 30 分钟",
    completed: false,
    starred: false,
    priority: "low",
    category: "health",
    dueDate: getToday(),
    dueTime: "18:30",
    createdAt: getToday(),
  },
  {
    id: "5",
    text: "整理桌面和文件",
    completed: true,
    starred: false,
    priority: "low",
    category: "life",
    dueDate: getToday(),
    dueTime: "10:30",
    createdAt: getToday(),
  },
  {
    id: "6",
    text: "购买日常用品",
    completed: true,
    starred: false,
    priority: "low",
    category: "life",
    dueDate: getToday(),
    dueTime: "11:00",
    createdAt: getToday(),
  },
];

interface NewTodoForm {
  text: string;
  note: string;
  category: string;
  priority: Priority;
  dueDate: string;
  dueTime: string;
}

const createEmptyTodoForm = (): NewTodoForm => ({
  text: "",
  note: "",
  category: "work",
  priority: "medium",
  dueDate: getToday(),
  dueTime: "",
});

function readJsonArray<T>(key: string, fallback: T[]) {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function isDueSoon(todo: Todo) {
  if (!todo.dueDate) return false;
  const today = new Date(getToday()).getTime();
  const due = new Date(todo.dueDate).getTime();
  return due >= today && due <= today + 7 * 24 * 60 * 60 * 1000;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => readJsonArray<Todo>(TODOS_STORAGE_KEY, INITIAL_TODOS));
  const [storedCategories, setStoredCategories] = useState<StoredCategory[]>(() =>
    readJsonArray<StoredCategory>(CATEGORIES_STORAGE_KEY, DEFAULT_CATEGORIES),
  );
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

  useEffect(() => {
    window.localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(storedCategories));
  }, [storedCategories]);

  const activeTodos = useMemo(() => todos.filter((todo) => !todo.deletedAt), [todos]);
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

  const updateTodo = (id: string, patch: Partial<Todo>) => {
    setTodos((currentTodos) => currentTodos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)));
  };

  const handleCreateTodo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = newTodo.text.trim();
    if (!text) return;

    const todo: Todo = {
      id: crypto.randomUUID(),
      text,
      note: newTodo.note.trim() || undefined,
      completed: false,
      starred: false,
      priority: newTodo.priority,
      category: newTodo.category,
      dueDate: newTodo.dueDate || undefined,
      dueTime: newTodo.dueTime || undefined,
      createdAt: getToday(),
    };

    setTodos((currentTodos) => [todo, ...currentTodos]);
    setNewTodo(createEmptyTodoForm());
    setCreateOpen(false);
    setFilter("today");
    setSelectedTodoId(todo.id);
  };

  const handleCreateCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    const category: StoredCategory = {
      id: `category-${crypto.randomUUID()}`,
      name,
      color: newCategoryColor,
    };

    setStoredCategories((current) => [...current, category]);
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

    setStoredCategories((current) =>
      current.map((cat) => (cat.id === editingCategory.id ? { ...cat, name, color: newCategoryColor } : cat)),
    );
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryColor("bg-chart-5");
  };

  const handleDeleteCategory = (id: string) => {
    setStoredCategories((current) => current.filter((cat) => cat.id !== id));
    if (categoryFilter === id) setCategoryFilter("all");
  };

  const handleDeleteTodo = (id: string) => {
    updateTodo(id, { deletedAt: new Date().toISOString() });
    if (selectedTodoId === id) setSelectedTodoId(null);
  };

  const handleRestoreTodo = (id: string) => {
    updateTodo(id, { deletedAt: undefined });
  };

  const handleQuickAddTodo = (text: string, date: string) => {
    const todo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      starred: false,
      priority: "medium",
      category: storedCategories[0]?.id ?? "work",
      dueDate: date,
      createdAt: getToday(),
    };
    setTodos((currentTodos) => [todo, ...currentTodos]);
  };

  const titles: Record<FilterType, string> = {
    calendar: "日历",
    today: "今天",
    planned: "计划",
    inbox: "收集箱",
    all: "全部任务",
    completed: "已完成",
    trash: "垃圾箱",
  };

  const formattedDate = (() => {
    const now = new Date();
    const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    return `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
  })();

  return (
    <div className="h-screen min-h-0 flex overflow-hidden bg-background">
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
          />
        </div>

        {filter === "calendar" ? (
          <CalendarView
            todos={activeTodos}
            categories={categoryById}
            categoryStyles={CATEGORY_STYLES}
            onOpenDetail={setSelectedTodoId}
            onToggle={(id) => updateTodo(id, { completed: !todos.find((todo) => todo.id === id)?.completed })}
            onAddTodo={handleQuickAddTodo}
          />
        ) : (
          <ScrollArea className="flex-1 min-h-0" viewportClassName="px-8 py-6">
            <main className="max-w-6xl mx-auto space-y-6">
              <StatsCards
                stats={stats}
                activeCard={statCardFilter}
                onCardClick={(key) => setStatCardFilter((prev) => (prev === key ? null : key))}
              />

              {filter === "trash" && trashedTodos.length > 0 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setTodos((currentTodos) => currentTodos.filter((todo) => !todo.deletedAt))}
                    className="px-4 py-2 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    清空回收站
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {filteredTodos.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <p>{filter === "trash" ? "垃圾箱为空" : "暂无任务"}</p>
                  </div>
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
                        onOpenDetail={setSelectedTodoId}
                        onToggle={(id) => updateTodo(id, { completed: !todos.find((todo) => todo.id === id)?.completed })}
                        onToggleStar={(id) => updateTodo(id, { starred: !todos.find((todo) => todo.id === id)?.starred })}
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
      </div>

      <Modal open={isCreateOpen} title="新建任务" onOpenChange={setCreateOpen}>
        <FormPrimitive.Form onSubmit={handleCreateTodo} className="space-y-5">
          <FormField name="text" label="任务名称">
            <input
              autoFocus
              required
              value={newTodo.text}
              onChange={(event) => setNewTodo((current) => ({ ...current, text: event.target.value }))}
              placeholder="输入任务名称..."
              className="w-full h-[45px] bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 ring-ring/30 placeholder:text-muted-foreground"
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
            <input
              autoFocus
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="例如：项目、家庭、灵感"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 ring-ring/30"
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
            <input
              autoFocus
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="例如：项目、家庭、灵感"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 ring-ring/30"
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

      <Modal open={isSettingsOpen} title="通知设置" maxWidth="max-w-sm" onOpenChange={setSettingsOpen}>
        <FormPrimitive.Form
          onSubmit={(e) => {
            e.preventDefault();
            updateSettings(settingsForm);
            setSettingsOpen(false);
          }}
          className="space-y-5"
        >
          <FormField name="reminderMinutes" label="提前提醒时间（分钟）">
            <input
              type="number"
              required
              min={1}
              max={120}
              value={settingsForm.reminderMinutes}
              onChange={(e) => setSettingsForm((s) => ({ ...s, reminderMinutes: Number(e.target.value) || 1 }))}
              className="w-full h-[45px] bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 ring-ring/30"
            />
          </FormField>

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
            <FormField name="repeatIntervalMinutes" label="重复间隔（分钟）">
              <input
                type="number"
                required
                min={1}
                max={60}
                value={settingsForm.repeatIntervalMinutes}
                onChange={(e) => setSettingsForm((s) => ({ ...s, repeatIntervalMinutes: Number(e.target.value) || 1 }))}
                className="w-full h-[45px] bg-card border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 ring-ring/30"
              />
            </FormField>
          )}

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
