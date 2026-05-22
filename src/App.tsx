import { FormEvent, useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { StatsCards } from "./components/StatsCards";
import { TodoDetailPanel } from "./components/TodoDetailPanel";
import { TodoItem } from "./components/TodoItem";
import { Category, DueFilter, FilterType, Priority, PriorityFilter, Todo } from "./components/types";
import { Modal } from "./components/ui/Modal";
import { ScrollArea } from "./components/ui/ScrollArea";
import { SelectField } from "./components/ui/SelectField";

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
    text: "完成产品设计流程",
    note: "检查任务详情、分类筛选和桌面端保存体验。",
    completed: false,
    starred: true,
    priority: "high",
    category: "work",
    dueDate: getToday(),
    dueTime: "14:00",
    subtasks: { total: 3, completed: 1 },
    createdAt: getToday(),
  },
  {
    id: "2",
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
    id: "3",
    text: "购买日常用品",
    completed: true,
    starred: false,
    priority: "low",
    category: "life",
    dueDate: getToday(),
    dueTime: "11:00",
    createdAt: getToday(),
  },
  {
    id: "4",
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
    id: "5",
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
    id: "6",
    text: "阅读《深度工作》第三章",
    completed: false,
    starred: false,
    priority: "medium",
    category: "study",
    dueDate: getToday(),
    dueTime: "20:00",
    subtasks: { total: 1, completed: 0 },
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
  const [filter, setFilter] = useState<FilterType>("today");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("bg-chart-5");
  const [newTodo, setNewTodo] = useState<NewTodoForm>(createEmptyTodoForm);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);

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

    if (filter === "today") result = result.filter((todo) => !todo.completed && (todo.createdAt === today || todo.dueDate === today));
    if (filter === "completed") result = result.filter((todo) => todo.completed);
    if (filter === "inbox") result = result.filter((todo) => !todo.completed && !todo.dueDate);
    if (filter === "planned") result = result.filter((todo) => !todo.completed && Boolean(todo.dueDate));
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
  }, [activeTodos, categoryFilter, dueFilter, filter, priorityFilter, searchQuery, trashedTodos]);

  const stats = useMemo(() => {
    const unfinishedTodos = activeTodos.filter((todo) => !todo.completed);
    return {
      pending: unfinishedTodos.length,
      highPriority: unfinishedTodos.filter((todo) => todo.priority === "high").length,
      dueSoon: unfinishedTodos.filter(isDueSoon).length,
      completed: activeTodos.filter((todo) => todo.completed).length,
      today: unfinishedTodos.filter((todo) => todo.createdAt === getToday() || todo.dueDate === getToday()).length,
      planned: unfinishedTodos.filter((todo) => todo.dueDate).length,
      inbox: unfinishedTodos.filter((todo) => !todo.dueDate).length,
      all: activeTodos.length,
      trash: trashedTodos.length,
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

  const handleDeleteTodo = (id: string) => {
    updateTodo(id, { deletedAt: new Date().toISOString() });
    if (selectedTodoId === id) setSelectedTodoId(null);
  };

  const handleRestoreTodo = (id: string) => {
    updateTodo(id, { deletedAt: undefined });
  };

  const titles: Record<FilterType, string> = {
    today: "今天",
    planned: "计划",
    inbox: "收集箱",
    all: "全部任务",
    completed: "已完成",
    trash: "回收站",
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
        onFilterChange={setFilter}
        activeCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onCreateTodo={() => setCreateOpen(true)}
        onCreateCategory={() => setCategoryOpen(true)}
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

        <ScrollArea className="flex-1 min-h-0" viewportClassName="px-8 py-6">
          <main className="max-w-6xl mx-auto space-y-6">
            <StatsCards stats={stats} />

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
                  <p>{filter === "trash" ? "回收站为空" : "暂无任务"}</p>
                </div>
              ) : (
                filteredTodos.map((todo) => {
                  const category = categoryById.get(todo.category);
                  return (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
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
      </div>

      <Modal open={isCreateOpen} title="新建任务" description="任务会自动保存到本地。" onOpenChange={setCreateOpen}>
        <form onSubmit={handleCreateTodo} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">任务内容</span>
            <input
              autoFocus
              value={newTodo.text}
              onChange={(event) => setNewTodo((current) => ({ ...current, text: event.target.value }))}
              placeholder="输入要完成的事情"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 ring-ring/30"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted-foreground">备注</span>
            <textarea
              value={newTodo.note}
              onChange={(event) => setNewTodo((current) => ({ ...current, note: event.target.value }))}
              placeholder="补充任务详情"
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 ring-ring/30 resize-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">分类</span>
              <SelectField
                value={newTodo.category}
                onChange={(category) => setNewTodo((current) => ({ ...current, category }))}
                ariaLabel="任务分类"
                className="w-full bg-background"
                options={storedCategories.map((category) => ({ value: category.id, label: category.name }))}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">优先级</span>
              <SelectField<Priority>
                value={newTodo.priority}
                onChange={(priority) => setNewTodo((current) => ({ ...current, priority }))}
                ariaLabel="任务优先级"
                className="w-full bg-background"
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
              <input
                type="date"
                value={newTodo.dueDate}
                onChange={(event) => setNewTodo((current) => ({ ...current, dueDate: event.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 ring-ring/30"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-muted-foreground">时间</span>
              <input
                type="time"
                value={newTodo.dueTime}
                onChange={(event) => setNewTodo((current) => ({ ...current, dueTime: event.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 ring-ring/30"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-border hover:bg-accent">
              取消
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
              创建任务
            </button>
          </div>
        </form>
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
            <span className="text-sm text-muted-foreground">分类名称</span>
            <input
              autoFocus
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="例如：项目、家庭、灵感"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 ring-ring/30"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">颜色</span>
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
    </div>
  );
}
