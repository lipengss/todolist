# 系统提醒通知 设计文档

## 概述

为到期任务提供 Windows 原生弹窗提醒，支持准时提醒和提前提醒，让用户不错过截止时间。

---

## 通知时机

| 场景 | 通知时机 |
|------|----------|
| 任务有具体时间（如 `dueTime: "14:00"`） | 准时提醒 + 提前 N 分钟提醒 |
| 任务只有日期没时间 | 截止前一天早上 9:00 提醒 |
| 提前分钟数 | 用户可自定义，默认 15 分钟 |

---

## 通知内容

```
标题: 任务提醒
内容: "[任务名称]" 即将到期 — HH:mm
     或 "[任务名称]" 明天到期
tag: todo.id（用于去重）
```

---

## 交互

- 点击通知 → 打开/聚焦应用 → 定位到对应任务详情
- 用户关闭通知 → 无额外行为

---

## 架构

```
src/
├── hooks/
│   ├── useSettings.ts              # 通用设置读写
│   └── useNotificationScheduler.ts # 通知调度核心逻辑
└── App.tsx                         # 挂载 hook
```

### useSettings

读写 localStorage 的简单 Hook：

```ts
interface Settings {
  reminderMinutes: number;  // 提前提醒分钟数，默认 15
}
```

- `getSettings(): Settings` — 读取设置
- `updateSettings(partial: Partial<Settings>): void` — 更新设置

### useNotificationScheduler

核心调度 Hook：

```ts
function useNotificationScheduler(todos: Todo[], onNotificationClick: (todoId: string) => void): void
```

**逻辑流程（每 10 秒检查一次）：**

1. 获取当前时间 `now = new Date()`
2. 遍历 `todos`（排除已完成、已删除、无截止日期的）
3. 对于有 `dueTime` 的任务：
   - 拼接 `dueDate + dueTime` 为完整时间戳
   - 检查当前时间是否 ≥ `dueTime - reminderMinutes`（提前提醒）
   - 检查当前时间是否 ≥ `dueTime`（准时提醒）
4. 对于只有 `dueDate` 没 `dueTime` 的任务：
   - 检查当前是否在截止日期前一天的 9:00 之后且不是当天
5. 通过 `notifiedMap` 记录已通知过的 `todo.id + checkpoint`，避免重复通知
6. 匹配上的任务调用 `new Notification(title, { body, tag, requireInteraction: false })`
7. 通知点击事件通知窗口 `window.focus()` + 回调 `onNotificationClick(todo.id)`

**权限处理：**
- 首次尝试通知时，浏览器会自动弹出权限请求
- 如果用户拒绝，后续请求会静默失败（Notification.permission === "denied"）

### App.tsx 改动

- 挂载 `useNotificationScheduler(activeTodos, setSelectedTodoId)`
- 当通知点击时，`setSelectedTodoId` 会打开详情面板
- （后续可添加设置入口调整 `reminderMinutes`）

---

## 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/hooks/useSettings.ts` | 新建 | 设置读写 Hook |
| `src/hooks/useNotificationScheduler.ts` | 新建 | 通知调度核心 |
| `src/App.tsx` | 修改 | 挂载 Hook |

---

## 不做（范围外）

- Electron 主进程原生 IPC 通知
- 通知声音自定义
- 重复提醒（snooze）
- 设置面板 UI（reminderMinutes 先给默认值 15，后续可在设置面板修改）
- 系统托盘图标

---

## 验证要点

1. 创建一个有具体时间（如当前时间 + 16 分钟后）的任务 → 1 分钟后应有提前提醒
2. 创建只有明天的日期没有时间的任务 → 今天早上 9:00 后应有"明天到期"提醒
3. 同一任务不会重复通知（已通知的 checkpoint 跳过）
4. 已完成/已删除的任务不触发通知
5. 点击通知 → 打开对应任务详情
