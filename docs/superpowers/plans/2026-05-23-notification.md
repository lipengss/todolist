# 系统提醒通知 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为到期任务提供系统原生弹窗提醒，支持准时提醒和提前提醒两种模式。

**Architecture:** 新建 `useSettings` Hook 管理提醒设置的 localStorage 读写；新建 `useNotificationScheduler` Hook 以 30 秒间隔轮询检查所有任务的到期状态，通过 Notification API 弹窗，用 `notifiedRef` 记录已通知的 checkpoint 避免重复。在 App 层挂载，通知点击后定位到对应任务详情。

**Tech Stack:** React 18 + TypeScript + Browser Notification API + localStorage

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/hooks/useSettings.ts` | 新建 | 通用设置读写（reminderMinutes） |
| `src/hooks/useNotificationScheduler.ts` | 新建 | 通知调度：轮询任务、检测到期、弹通知 |
| `src/App.tsx` | 修改 | 挂载 useNotificationScheduler |

---

### Task 1: 创建 useSettings Hook

**Files:**
- Create: `src/hooks/useSettings.ts`

- [ ] **Step 1: 创建 useSettings.ts**

```ts
// src/hooks/useSettings.ts

const SETTINGS_KEY = "focusworkspace.settings.v1";

export interface Settings {
  reminderMinutes: number;
}

const DEFAULT_SETTINGS: Settings = {
  reminderMinutes: 15,
};

function readSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSettings(): Settings {
  return readSettings();
}

export function updateSettings(partial: Partial<Settings>): void {
  const current = readSettings();
  const updated = { ...current, ...partial };
  writeSettings(updated);
}
```

- [ ] **Step 2: 验证 TypeScript 编译通过**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/hooks/useSettings.ts
git commit -m "feat: add useSettings hook for persistent settings"
```

---

### Task 2: 创建 useNotificationScheduler Hook

**Files:**
- Create: `src/hooks/useNotificationScheduler.ts`

- [ ] **Step 1: 创建 useNotificationScheduler.ts**

```ts
// src/hooks/useNotificationScheduler.ts
import { useEffect, useRef } from "react";
import type { Todo } from "../components/types";
import { getSettings } from "./useSettings";

function parseDueDateTime(dueDate: string, dueTime?: string): Date {
  const [h, m] = (dueTime ?? "00:00").split(":").map(Number);
  const date = new Date(dueDate + "T00:00:00");
  date.setHours(h, m, 0, 0);
  return date;
}

function todayAt9am(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

type Checkpoint = string; // "${todoId}:reminder" | "${todoId}:ontime" | "${todoId}:daybefore"

export function useNotificationScheduler(
  todos: Todo[],
  onNotificationClick: (todoId: string) => void,
) {
  const notifiedRef = useRef<Set<Checkpoint>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const settings = getSettings();
      const now = new Date();
      const nineAm = todayAt9am();

      for (const todo of todos) {
        if (todo.completed || todo.deletedAt || !todo.dueDate) continue;

        if (todo.dueTime) {
          const dueTime = parseDueDateTime(todo.dueDate, todo.dueTime);
          const reminderTime = new Date(
            dueTime.getTime() - settings.reminderMinutes * 60 * 1000,
          );

          // Advance reminder
          const reminderKey: Checkpoint = `${todo.id}:reminder`;
          if (
            now >= reminderTime &&
            now < dueTime &&
            !notifiedRef.current.has(reminderKey)
          ) {
            notifiedRef.current.add(reminderKey);
            const n = new Notification("任务提醒", {
              body: `"${todo.text}" ${settings.reminderMinutes}分钟后到期 — ${todo.dueTime}`,
              tag: reminderKey,
            });
            n.onclick = () => {
              window.focus();
              onNotificationClick(todo.id);
              n.close();
            };
          }

          // On-time notification
          const ontimeKey: Checkpoint = `${todo.id}:ontime`;
          if (
            now >= dueTime &&
            !notifiedRef.current.has(ontimeKey)
          ) {
            notifiedRef.current.add(ontimeKey);
            const n = new Notification("任务提醒", {
              body: `"${todo.text}" 已到期 — ${todo.dueTime}`,
              tag: ontimeKey,
            });
            n.onclick = () => {
              window.focus();
              onNotificationClick(todo.id);
              n.close();
            };
          }
        } else {
          // Date-only tasks: notify one day before at 9am
          const dueDate = new Date(todo.dueDate + "T00:00:00");
          const dayBeforeKey: Checkpoint = `${todo.id}:daybefore`;

          if (
            now >= nineAm &&
            now < dueDate &&
            new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() ===
              new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() - 1).getTime() &&
            !notifiedRef.current.has(dayBeforeKey)
          ) {
            notifiedRef.current.add(dayBeforeKey);
            const n = new Notification("任务提醒", {
              body: `"${todo.text}" 明天到期`,
              tag: dayBeforeKey,
            });
            n.onclick = () => {
              window.focus();
              onNotificationClick(todo.id);
              n.close();
            };
          }
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [todos, onNotificationClick]);
}
```

- [ ] **Step 2: 验证 TypeScript 编译通过**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/hooks/useNotificationScheduler.ts
git commit -m "feat: add useNotificationScheduler hook"
```

---

### Task 3: 在 App.tsx 中挂载通知调度器

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 添加 import 和挂载**

在 `src/App.tsx` 文件顶部已有 import 区域添加：

```tsx
import { useNotificationScheduler } from "./hooks/useNotificationScheduler";
```

在 App 组件内部（在 `useEffect` 区域之后、`return` 之前）添加：

```tsx
useNotificationScheduler(activeTodos, (todoId) => {
  setSelectedTodoId(todoId);
});
```

具体位置：放在现有的 `resetFocus` useEffect（约第 265-267 行）之后。

- [ ] **Step 2: 验证 TypeScript 编译通过**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/App.tsx
git commit -m "feat: mount useNotificationScheduler in App"
```

---

### Task 4: 验证测试

- [ ] **Step 1: 启动开发服务器**

```bash
pnpm dev
```

- [ ] **Step 2: 验证准时提醒**

创建一个任务，设置时间为当前时间 + 2 分钟后 → 等待 2 分钟 → 应弹出"已到期"通知

- [ ] **Step 3: 验证提前提醒**

创建一个任务，设置时间为当前时间 + 20 分钟后 → 等待约 5 分钟后 → 应弹出"15分钟后到期"通知

- [ ] **Step 4: 验证日期提醒**

创建一个只有明天日期、没有时间的任务 → 应弹出"明天到期"通知

- [ ] **Step 5: 验证点击跳转**

点击通知 → 应打开应用并定位到对应任务详情

- [ ] **Step 6: 验证去重**

同一个检查点不会重复弹通知（刷新后会重置）

- [ ] **Step 7: 最终提交**

```bash
git add -A
git commit -m "feat: 系统提醒通知功能完整实现"
```
