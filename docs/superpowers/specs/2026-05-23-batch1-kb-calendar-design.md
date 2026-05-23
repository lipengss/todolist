# Batch 1：键盘快捷键 + 日历快速添加 设计文档

## 概述

第一批优化聚焦**高效操作**，覆盖两个功能：
1. **键盘快捷键** — 常用操作无需鼠标，提升输入效率
2. **日历格快速添加** — 直接在日历格子中创建任务，日期自动填充

---

## 一、键盘快捷键

### 快捷键清单

| 快捷键 | 功能 | 适用视图 |
|--------|------|----------|
| `Ctrl+N` | 新建任务 | 全局 |
| `Ctrl+F` | 聚焦搜索框 | 全局 |
| `?` | 显示/隐藏快捷键帮助面板 | 全局 |
| `↑↓` | 上下切换任务焦点 | 列表视图 |
| `Space` | 切换任务完成状态 | 列表视图（聚焦时） |
| `Enter` | 打开任务详情 | 列表视图（聚焦时） |
| `Delete` | 删除当前任务 | 列表视图（聚焦时） |
| `Esc` | 关闭弹窗/面板/取消输入 | 弹出层内 |

### 架构

```
src/
├── hooks/
│   └── useKeyboardShortcuts.ts   # 自定义 Hook，集中管理快捷键
├── components/
│   └── ShortcutHelpPanel.tsx      # ? 键弹出的帮助浮层
└── App.tsx                        # 挂载 useKeyboardShortcuts
```

**useKeyboardShortcuts** Hook：
- 在 App 层挂载，`useEffect` 绑定 `window.keydown`
- 每个快捷键检查当前上下文决定是否触发：
  - 是否在 input/textarea 中（排除 Ctrl+N/Ctrl+F/? 的误触发）
  - 是否有弹窗打开（Esc 关闭弹窗）
  - 当前视图（↑↓/Space/Enter/Delete 仅在列表视图生效）
- 列表焦点通过 `useState focusedIndex` 管理，上下键移动
- 视觉反馈：聚焦任务用 `outline` 环展示

**ShortcutHelpPanel** 组件：
- 固定定位浮层，暗色背景 `bg-popover border-border rounded-xl shadow-xl`
- 表格展示所有快捷键，按适用视图分组
- `Esc` 或 `?` 关闭
- 点击遮罩层关闭

### 上下文感知规则

| 上下文 | 行为 |
|--------|------|
| 焦点在 input/textarea 内 | 只响应 Esc；Ctrl+N/Ctrl+F/? 正常触发 |
| Modal/Dialog 打开 | 仅 Esc 有效 |
| 日历视图 | Ctrl+N/Ctrl+F/?/Esc 有效 |
| 列表视图 | 全部快捷键有效 |

---

## 二、日历格快速添加

### 交互方案

**方案 A：日期格内联添加**
- 鼠标悬停日期格时，右上角显示小的 `+` 按钮
- 点击 `+` 或双击日期格 → 该格展开为内联输入框
- 输入任务名称后按 `Enter` 创建，日期自动填充为该格日期
- 按 `Esc` 取消，恢复为正常日期格

**方案 B：右侧面板添加按钮**
- 选中日期后，右侧面板标题栏始终显示 `+` 按钮
- 点击后在面板顶部出现输入框
- 输入 `Enter` 创建，自动关联当前选中日期
- 同样 `Esc` 取消

两种方案共存，互不冲突。

### 实现改动

**CalendarView.tsx** 修改：
- 新增 `inlineAddDate` state：记录当前内联输入的日期（方案 A）
- 新增 `panelAddActive` state：面板内输入框是否展开（方案 B）
- 日期格添加 `onMouseEnter`/`onMouseLeave` 控制 + 按钮显示
- 日期格双击事件触发内联输入
- 右侧面板标题栏添加 + 按钮

**App.tsx** 修改：
- `handleAddTodo` 支持传入预填日期参数：`handleAddTodo(date?: string)`
- 新任务的默认值：指定日期 + 默认分类 + 中优先级

### 新建任务默认值

| 字段 | 默认值 |
|------|--------|
| date | 日历格日期或选中日期 |
| category | 第一个分类 |
| priority | medium |
| time | 空 |

---

## 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/hooks/useKeyboardShortcuts.ts` | 新建 | 快捷键 Hook |
| `src/components/ShortcutHelpPanel.tsx` | 新建 | 帮助面板组件 |
| `src/components/CalendarView.tsx` | 修改 | 添加内联输入 + 面板按钮 |
| `src/App.tsx` | 修改 | 挂载 Hook，扩展 handleAddTodo |
| `src/components/TodoItem.tsx` | 可能修改 | 列表焦点视觉样式 |
| `src/components/types.ts` | 可能修改 | 如需要新增类型 |

---

## 不做（范围外）

- 自定义快捷键绑定
- 全局热键（如系统级 Ctrl+Shift+N）— 留到 Batch 2 全局快速捕获
- 日历格拖拽排序
- 快捷键国际化

---

## 验证要点

1. `?` 弹出帮助面板，Esc 或再次 `?` 关闭
2. `Ctrl+N` 打开新建任务弹窗
3. `Ctrl+F` 聚焦搜索框
4. 列表视图中 ↑↓ 切换焦点，视觉 outline 可见
5. 聚焦任务上 Space 切换完成状态
6. 聚焦任务上 Enter 打开详情面板
7. 聚焦任务上 Delete 删除任务
8. 输入框中快捷键不误触发（除 Esc）
9. 日历格悬停出现 + 按钮，点击可输入
10. 日历格双击直接进入输入态
11. 右侧面板 + 按钮创建任务，日期正确
12. Enter 创建、Esc 取消均正常工作
