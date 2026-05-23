# Batch 1：键盘快捷键 + 日历快速添加 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 FocusWorkspace 添加 8 个全局/列表快捷键和日历格快速添加任务功能。

**Architecture:** 新建 `useKeyboardShortcuts` Hook 集中管理所有快捷键逻辑，在 App 层挂载；新建 `ShortcutHelpPanel` 组件作为 ? 键弹出的帮助浮层；在 CalendarView 中添加内联输入和面板添加按钮，通过 App 暴露的 `handleQuickAddTodo` 创建任务。

**Tech Stack:** React 18 + TypeScript + Tailwind CSS v4 + date-fns v4.3.0 + lucide-react

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/hooks/useKeyboardShortcuts.ts` | 新建 | 快捷键 Hook：keydown 监听、上下文判断、焦点管理 |
| `src/components/ShortcutHelpPanel.tsx` | 新建 | ? 弹出的快捷键帮助浮层 |
| `src/App.tsx` | 修改 | 挂载 Hook、暴露 handleQuickAddTodo、传递 focusedIndex |
| `src/components/TodoItem.tsx` | 修改 | 新增 focused prop，视觉高亮 |
| `src/components/Header.tsx` | 修改 | 搜索框添加 id/ref 供 Ctrl+F 聚焦 |
| `src/components/CalendarView.tsx` | 修改 | 日期格悬停 + 按钮、双击/点击添加、面板 + 按钮 |

---

### Task 1: 创建 useKeyboardShortcuts Hook

**Files:**
- Create: `src/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: 创建 Hook 文件**

```tsx
// src/hooks/useKeyboardShortcuts.ts
import { useEffect, useState, useCallback, type RefObject } from "react";

export interface ShortcutContext {
  filter: string;
  filteredTodoCount: number;
  isAnyModalOpen: boolean;
  onCreateTodo: () => void;
  onToggleFocused: (index: number) => void;
  onOpenFocused: (index: number) => void;
  onDeleteFocused: (index: number) => void;
  onCloseAll: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export function useKeyboardShortcuts(ctx: ShortcutContext) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(false);

  const resetFocus = useCallback(() => setFocusedIndex(-1), []);

  useEffect(() => {
    const isInputFocused =
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement;

    function handleKeyDown(e: KeyboardEvent) {
      // ? key — toggle help panel (global, but not in inputs)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !isInputFocused) {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
        return;
      }

      // Esc — close help panel or modal
      if (e.key === "Escape") {
        if (helpOpen) {
          setHelpOpen(false);
          return;
        }
        if (ctx.isAnyModalOpen) {
          ctx.onCloseAll();
          return;
        }
        return;
      }

      // Help panel open — only Esc works
      if (helpOpen) return;

      // Ctrl+N — create todo (global, except in inputs)
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        ctx.onCreateTodo();
        return;
      }

      // Ctrl+F — focus search (global, except in inputs)
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        ctx.searchInputRef.current?.focus();
        return;
      }

      // Modal open — only global shortcuts work
      if (ctx.isAnyModalOpen) return;

      // Calendar view — only global shortcuts
      if (ctx.filter === "calendar") return;

      // List view shortcuts
      if (ctx.filteredTodoCount === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % ctx.filteredTodoCount);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev <= 0 ? ctx.filteredTodoCount - 1 : prev - 1
        );
      } else if (e.key === " " && focusedIndex >= 0) {
        e.preventDefault();
        ctx.onToggleFocused(focusedIndex);
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        ctx.onOpenFocused(focusedIndex);
      } else if (e.key === "Delete" && focusedIndex >= 0) {
        e.preventDefault();
        ctx.onDeleteFocused(focusedIndex);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ctx, helpOpen, focusedIndex]);

  return { focusedIndex, setFocusedIndex, helpOpen, setHelpOpen, resetFocus };
}
```

- [ ] **Step 2: 验证文件创建成功**

```bash
ls src/hooks/useKeyboardShortcuts.ts
```

---

### Task 2: 创建 ShortcutHelpPanel 组件

**Files:**
- Create: `src/components/ShortcutHelpPanel.tsx`

- [ ] **Step 1: 创建组件文件**

```tsx
// src/components/ShortcutHelpPanel.tsx
import { X } from "lucide-react";

interface ShortcutHelpPanelProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "Ctrl + N", desc: "新建任务", scope: "全局" },
  { key: "Ctrl + F", desc: "聚焦搜索框", scope: "全局" },
  { key: "?", desc: "显示/隐藏此面板", scope: "全局" },
  { key: "↑ ↓", desc: "上下切换任务焦点", scope: "列表视图" },
  { key: "Space", desc: "切换任务完成状态", scope: "列表视图（聚焦时）" },
  { key: "Enter", desc: "打开任务详情", scope: "列表视图（聚焦时）" },
  { key: "Delete", desc: "删除当前任务", scope: "列表视图（聚焦时）" },
  { key: "Esc", desc: "关闭弹窗 / 面板 / 取消输入", scope: "全局" },
];

export function ShortcutHelpPanel({ open, onClose }: ShortcutHelpPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-popover border border-border rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">键盘快捷键</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border">
                <th className="text-left py-2 px-3 font-medium">快捷键</th>
                <th className="text-left py-2 px-3 font-medium">功能</th>
                <th className="text-left py-2 px-3 font-medium">适用视图</th>
              </tr>
            </thead>
            <tbody>
              {SHORTCUTS.map((s) => (
                <tr key={s.key} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <kbd className="px-2 py-0.5 rounded-md bg-card border border-border text-primary font-mono text-xs">
                      {s.key}
                    </kbd>
                  </td>
                  <td className="py-2.5 px-3 text-foreground">{s.desc}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{s.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证文件创建成功**

---

### Task 3: 更新 Header.tsx — 搜索框添加 id 属性

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: 为搜索 input 添加 id 并支持 ref 转发**

将搜索 input 的 `id` 设为 `"search-input"`，供 hook 通过 DOM 查询聚焦。

```tsx
// src/components/Header.tsx 中搜索 input 的修改
// 在现有 className 基础上添加 id 属性

<input
  id="search-input"
  type="text"
  value={searchQuery}
  onChange={(event) => onSearchChange(event.target.value)}
  placeholder="搜索任务..."
  className="h-11 bg-card border border-border rounded-xl pl-11 pr-4 py-2.5 w-64 outline-none placeholder:text-muted-foreground focus:ring-2 ring-ring/30 transition-colors"
/>
```

具体改动：在第 36-42 行的 `<input>` 上添加 `id="search-input"`。

- [ ] **Step 2: 提交**

```bash
git add src/components/Header.tsx
git commit -m "feat: 搜索框添加 id 属性供快捷键聚焦"
```

---

### Task 4: 更新 TodoItem.tsx — 添加 focused 状态

**Files:**
- Modify: `src/components/TodoItem.tsx`

- [ ] **Step 1: 添加 focused prop 和视觉样式**

在 TodoItemProps 中添加 `focused: boolean`，当 focused 时添加 ring 效果。

```tsx
// 修改 interface TodoItemProps，添加：
focused?: boolean;
```

在顶层 div 的 className 中，当 focused 时添加 `ring-2 ring-primary/50`：

```tsx
// 修改第 46 行的 className，在末尾添加 focused 条件：
`... ${focused ? "ring-2 ring-primary/50 border-primary/50" : ""}`
```

并将 `focused` 从 props 中解构出来。

- [ ] **Step 2: 在 App.tsx 中传递 focused prop**

在 `src/App.tsx` 中 `<TodoItem>` 渲染处，添加：
```tsx
focused={index === focusedIndex}
```
（focusedIndex 来自 useKeyboardShortcuts，需要传入）

先在 TodoItem 组件中完成定义，后续 Task 会在 App.tsx 中接入。

- [ ] **Step 3: 提交**

```bash
git add src/components/TodoItem.tsx
git commit -m "feat: TodoItem 新增 focused prop 支持键盘焦点高亮"
```

---

### Task 5: 更新 App.tsx — 挂载快捷键 Hook

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 添加 import 和 hook 调用**

在文件顶部添加 import：
```tsx
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { ShortcutHelpPanel } from "./components/ShortcutHelpPanel";
```

在 App 组件内部（在 `selectedTodo` 等 useMemo 之后、return 之前），构建 context 并调用 hook：

```tsx
// 计算是否有弹窗打开
const isAnyModalOpen = isCreateOpen || isCategoryOpen || editingCategory !== null || selectedTodoId !== null;

// 搜索框 ref（通过 DOM id 获取）
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
```

筛选条件变化时 reset focusedIndex：

```tsx
// 在 filter / categoryFilter / searchQuery / priorityFilter / dueFilter 任一变化时
// 用 useEffect 调用 resetFocus
useEffect(() => {
  resetFocus();
}, [filter, categoryFilter, searchQuery, priorityFilter, dueFilter, resetFocus]);
```

- [ ] **Step 2: 传递 focusedIndex 给 TodoItem**

在 `filteredTodos.map((todo, index) => ...)` 中，`index` 改为可用变量，并传递：

```tsx
focused={index === focusedIndex}
```

- [ ] **Step 3: 渲染 ShortcutHelpPanel**

在 return 中的 JSX 末尾（`</div>` 闭合前），添加：

```tsx
<ShortcutHelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
```

- [ ] **Step 4: 提交**

```bash
git add src/App.tsx
git commit -m "feat: 挂载键盘快捷键 Hook 和帮助面板"
```

---

### Task 6: 更新 CalendarView.tsx — 日历快速添加

**Files:**
- Modify: `src/components/CalendarView.tsx`

- [ ] **Step 1: 添加新 props 和状态**

接口添加 `onAddTodo`：

```tsx
interface CalendarViewProps {
  todos: Todo[];
  categories: Map<string, Category>;
  categoryStyles: Record<string, string>;
  onOpenDetail: (id: string) => void;
  onToggle: (id: string) => void;
  onAddTodo: (text: string, date: string) => void;
}
```

组件内添加状态：

```tsx
const [hoveredDate, setHoveredDate] = useState<string | null>(null);
const [inlineAddDate, setInlineAddDate] = useState<string | null>(null);
const [inlineAddText, setInlineAddText] = useState("");
const [panelAddActive, setPanelAddActive] = useState(false);
const [panelAddText, setPanelAddText] = useState("");
```

添加处理函数：

```tsx
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
```

- [ ] **Step 2: 在日期格中添加悬停 + 按钮和内联输入**

在日期格 `<button>` 的 onClick 中增加双击检测，并修改格内内容。替换现有日期格按钮的 `onClick` 和内部分：

```tsx
// 日期格容器：当 inlineAddDate === dateStr 时显示输入框
if (inlineAddDate === dateStr) {
  return (
    <div key={dateStr} className="bg-card p-1 flex flex-col gap-1">
      <input
        autoFocus
        value={inlineAddText}
        onChange={(e) => setInlineAddText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleInlineAdd();
          if (e.key === "Escape") { setInlineAddDate(null); setInlineAddText(""); }
        }}
        placeholder="新任务..."
        className="w-full bg-background border border-primary rounded-md px-2 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
```

正常日期格渲染中，在现有 button 上添加：

```tsx
// 在 button 上增加 onDoubleClick 和 onMouseEnter/onMouseLeave
onDoubleClick={() => handleCellDoubleClick(dateStr)}
onMouseEnter={() => setHoveredDate(dateStr)}
onMouseLeave={() => setHoveredDate(null)}
```

在日期数字下方、圆点上方，悬停时显示 + 按钮：

```tsx
{/* hover + button */}
{isCurrentMonth && hoveredDate === dateStr && inlineAddDate !== dateStr && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleCellDoubleClick(dateStr);
    }}
    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs hover:opacity-80 transition-opacity"
  >
    +
  </button>
)}
```

注意：button 需要 `position: relative`，在 className 中添加 `relative`。

- [ ] **Step 3: 在右侧面板标题栏添加 + 按钮和内联输入**

修改右侧面板的 header 部分，在日期信息旁边添加 + 按钮：

```tsx
<div className="p-4 border-b border-border">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="font-semibold text-foreground">
        {format(selectedDate, "M月d日")} {["星期日", ...][selectedDate.getDay()]}
      </h3>
      <p className="text-xs text-muted-foreground mt-1">
        {selectedTodos.length} 个任务
      </p>
    </div>
    <button
      onClick={() => { setPanelAddActive(true); setPanelAddText(""); }}
      className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
  {panelAddActive && (
    <div className="mt-3 flex gap-2">
      <input
        autoFocus
        value={panelAddText}
        onChange={(e) => setPanelAddText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handlePanelAdd();
          if (e.key === "Escape") { setPanelAddActive(false); setPanelAddText(""); }
        }}
        placeholder="快速添加任务..."
        className="flex-1 h-9 bg-background border border-primary rounded-lg px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  )}
</div>
```

需要添加 `Plus` 图标到 imports：
```tsx
import { ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
```

- [ ] **Step 4: 提交**

```bash
git add src/components/CalendarView.tsx
git commit -m "feat: 日历格快速添加 — 悬停+按钮、双击输入、面板按钮"
```

---

### Task 7: 更新 App.tsx — handleQuickAddTodo

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 添加快速添加函数并传给 CalendarView**

在 App 组件的 handler 区域添加：

```tsx
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
```

在 CalendarView 渲染处添加 prop：

```tsx
<CalendarView
  todos={activeTodos}
  categories={categoryById}
  categoryStyles={CATEGORY_STYLES}
  onOpenDetail={setSelectedTodoId}
  onToggle={(id) => updateTodo(id, { completed: !todos.find((todo) => todo.id === id)?.completed })}
  onAddTodo={handleQuickAddTodo}
/>
```

- [ ] **Step 2: 提交**

```bash
git add src/App.tsx
git commit -m "feat: App 暴露快速添加任务接口给日历视图"
```

---

### Task 8: 验证与集成测试

- [ ] **Step 1: 启动开发服务器**

```bash
pnpm dev
```

- [ ] **Step 2: 验证键盘快捷键**

| 验证项 | 操作 | 预期 |
|--------|------|------|
| Ctrl+N | 在列表视图按 Ctrl+N | 弹出新建任务弹窗 |
| Ctrl+F | 按 Ctrl+F | 搜索框获得焦点 |
| ? | 按 ? | 弹出快捷键帮助面板 |
| 帮助面板关闭 | 按 Esc 或 ? | 面板关闭 |
| ↑↓ | 在列表视图按上下键 | 任务逐项高亮 |
| Space | 高亮项按 Space | 切换完成状态 |
| Enter | 高亮项按 Enter | 打开详情面板 |
| Delete | 高亮项按 Delete | 移到回收站 |
| Esc | 详情面板打开时按 Esc | 关闭面板 |

- [ ] **Step 3: 验证日历快速添加**

| 验证项 | 操作 | 预期 |
|--------|------|------|
| 悬停 + 按钮 | 鼠标移到日历格 | 右上角出现紫色 + 按钮 |
| 点击 + 添加 | 点击 + 按钮 | 格内出现输入框 |
| Enter 创建 | 输入文字后 Enter | 任务创建，日期匹配该格 |
| Esc 取消 | 输入中按 Esc | 恢复为正常日期格 |
| 双击添加 | 双击日期格 | 直接进入输入态 |
| 面板 + 按钮 | 选中日期，点击面板 + | 面板头部出现输入框 |
| 面板 Enter | 输入后 Enter | 任务创建 |

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: 完成 Batch1 — 键盘快捷键 + 日历快速添加"
```
