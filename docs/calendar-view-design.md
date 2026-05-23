# 日历看板设计文档

## 概述

在现有待办应用中新增日历视图，以月视图网格展示任务分布，让用户直观看到每日任务安排。

---

## UI 布局

```
┌──────────────────────────────────────────────────────────┐
│  Header: [日历] 标题  │  搜索框  │  优先级筛选  │  截止日期 │
├──────────┬───────────────────────────────────────────────┤
│ Sidebar  │  ┌──────────────────────────────────────────┐ │
│          │  │  ← 4月    2026年5月    6月 →             │ │
│  + 日历  │  ├────┬────┬────┬────┬────┬────┬────┐       │ │
│          │  │ 一 │ 二 │ 三 │ 四 │ 五 │ 六 │ 日 │       │ │
│          │  ├────┼────┼────┼────┼────┼────┼────┤       │ │
│          │  │    │    │    │ 1  │ 2  │ 3  │ 4  │       │ │
│          │  │    │    │    │ ·  │ ·· │    │ ·  │       │ │
│          │  ├────┼────┼────┼────┼────┼────┼────┤       │ │
│          │  │ 5  │ 6  │ 7  │ 8  │ 9  │10  │11  │       │ │
│          │  │    │ ·· │    │ ·  │    │ ·· │    │       │ │
│          │  ├────┼────┼────┼────┼────┼────┼────┤       │ │
│          │  │ .. │ .. │ .. │ .. │ .. │ .. │ .. │       │ │
│          └──┴────┴────┴────┴────┴────┴────┴────┘       │ │
│          │                                              │ │
│          │  右侧面板：选中日期 → 当日任务列表             │ │
│          │  ┌──────────────────────────────────────┐    │ │
│          │  │ 5月23日 星期五                       │    │ │
│          │  │ ───────────────────────────────────  │    │ │
│          │  │ ☐ 完成产品设计稿     🔴高  14:00    │    │ │
│          │  │ ☐ 回复客户邮件       🟡中  16:00    │    │ │
│          │  │ ☑ 整理桌面和文件     🔵低  10:30    │    │ │
│          │  └──────────────────────────────────────┘    │ │
└──────────┴───────────────────────────────────────────────┘
```

### 日历格子内展示

- 每天格子最多显示 **3 个任务圆点**（按优先级颜色区分）
- 超过 3 个显示 "+N" 标记
- **今天**的格子有高亮边框（主题色）
- 有任务的日期用**小圆点**标记（颜色 = 最高优先级任务的颜色）

---

## 交互行为

| 操作 | 行为 |
|------|------|
| 点击日历格子 | 右侧面板显示当日任务列表 |
| 点击面板内任务 | 打开任务详情 |
| 切换月份 | ← → 箭头翻月 |
| 点击"今天"按钮 | 跳回当月，选中今天 |
| 搜索/筛选 | 日历上对应过滤（无匹配任务的日期灰掉） |

---

## 组件架构

```
src/
├── components/
│   ├── CalendarView.tsx        # 日历主组件（月视图 + 右侧面板）
│   ├── CalendarGrid.tsx        # 日历网格（可复用的纯展示组件）
│   └── CalendarDay.tsx         # 单个日期格子
├── App.tsx                     # 新增 filter="calendar" 分支
└── components/
    └── types.ts                # FilterType 新增 "calendar"
```

### 职责划分

**CalendarView** — 容器组件
- 管理月份导航状态（当前年/月）
- 管理选中日期状态
- 从 `todos` 计算 `calendarData: Map<string, Todo[]>`
- 渲染 CalendarGrid + DayTaskPanel

**CalendarGrid** — 纯展示
- Props: `year`, `month`, `calendarData`, `selectedDate`, `onSelectDate`
- 渲染 7×6 网格 + 月导航头

**CalendarDay** — 单个格子
- Props: `date`, `todos`, `isToday`, `isSelected`, `isCurrentMonth`
- 渲染日期数字 + 优先级圆点 + "+N" 标记

---

## 数据流

```
todos (App state)
  │
  ├─→ CalendarView
  │     │
  │     ├─ calendarData = groupBy(todos, todo => todo.dueDate)
  │     │
  │     ├─→ CalendarGrid
  │     │     └─→ CalendarDay × 42
  │     │
  │     └─→ DayTaskPanel (selectedDate 对应任务列表)
  │
  └─→ TodoDetailPanel (打开任务详情，已有)
```

### 核心计算

```ts
// 按日期分组任务
function groupByDate(todos: Todo[]): Map<string, Todo[]> {
  const map = new Map<string, Todo[]>();
  for (const todo of todos) {
    if (!todo.dueDate || todo.deletedAt) continue;
    const list = map.get(todo.dueDate) ?? [];
    list.push(todo);
    map.set(todo.dueDate, list);
  }
  return map;
}

// 生成月视图网格（含前后月填充）
function buildMonthGrid(year: number, month: number): Date[][] { ... }
```

---

## 与现有系统的集成

1. **Sidebar** 主视图新增 `{ id: "calendar", label: "日历", icon: CalendarDays }`（排在"今天"上面）
2. **FilterType** 新增 `"calendar"`
3. **App.tsx** 渲染分支：
   ```tsx
   {filter === "calendar" ? (
     <CalendarView todos={activeTodos} categories={categoryById} onOpenDetail={setSelectedTodoId} />
   ) : (
     <>{/* 现有 StatsCards + TodoItem 列表 */}</>
   )}
   ```
4. 日历视图内**复用**优先级颜色、分类标签样式，保持视觉一致

---

## 技术选型

| 事项 | 选择 | 理由 |
|------|------|------|
| 日历逻辑 | 手写 | 需求简单（月视图 + 分组），不需要重型库 |
| 日期工具 | `date-fns`（react-day-picker 已依赖） | 零额外安装 |
| 样式 | Tailwind CSS Grid | 7 列网格天然适配 `grid-cols-7` |

---

## 实现步骤

| 步骤 | 内容 | 预估 |
|------|------|------|
| 1 | types.ts 新增 `"calendar"` filter | 1 行 |
| 2 | Sidebar 新增日历入口 + 图标 | ~5 行 |
| 3 | 创建 `CalendarView.tsx`（月导航 + 网格 + 右侧面板） | ~150 行 |
| 4 | App.tsx 添加 `filter === "calendar"` 渲染分支 | ~10 行 |
| 5 | 构建验证 + 交互测试 | — |

---

## 不做（范围外）

- 周日历 / 周视图（只做月视图）
- 拖拽任务改日期（P1 再做）
- 日视图的时间轴（只做列表）
- Google Calendar / Outlook 同步
