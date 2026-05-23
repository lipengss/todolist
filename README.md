# FocusWorkspace

> 专注待办 · 高效执行 — 跨平台桌面待办事项应用

基于 Electron + React + TypeScript 构建，支持 Windows / macOS / Linux。

## 功能特性

- **日历看板** — 月视图展示任务分布，优先级色块一目了然，双击日期快速添加
- **智能提醒** — 任务定时提醒 + 全天任务前一天预警 + 可配置重复通知间隔
- **快捷键操作** — `Ctrl+N` 新建 · `Ctrl+F` 搜索 · `↑↓` 导航 · `Space` 完成
- **分类管理** — 自定义分类 + 颜色标签，灵活分组筛选
- **子任务 & 备注** — 大任务拆解为子任务逐步完成，支持备注记录
- **离线优先** — 数据本地存储，无需网络即可使用

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| UI | Tailwind CSS v4 + Radix UI |
| 日历 | react-day-picker v9 + date-fns |
| 桌面端 | Electron 33 |
| 构建 | Vite 6 + electron-builder |
| 包管理 | pnpm |

## 开发环境

### 前置要求

- Node.js >= 22
- pnpm >= 10

### 安装与启动

```bash
# 安装依赖
pnpm install

# 启动 Web 开发服务器
pnpm dev

# 启动 Electron 桌面应用（Web + Electron 同时启动）
pnpm electron:dev
```

Web 开发服务器运行在 `http://localhost:5173`。

## 项目结构

```
todo-desktop/
├── electron/              # Electron 主进程
│   └── main.js
├── src/
│   ├── App.tsx            # 应用入口，弹窗管理
│   ├── components/
│   │   ├── ui/            # 通用 UI 组件
│   │   │   ├── Input.tsx        # 文本输入框
│   │   │   ├── Textarea.tsx     # 多行文本
│   │   │   ├── InputNumber.tsx  # 数字输入（带增减按钮）
│   │   │   ├── DatePicker.tsx   # 日期选择器
│   │   │   ├── TimePicker.tsx   # 时间选择器
│   │   │   ├── Form.tsx         # 表单容器
│   │   │   └── SelectField.tsx  # 下拉选择
│   │   ├── Sidebar.tsx          # 侧边导航栏
│   │   ├── Header.tsx           # 顶部搜索栏
│   │   ├── CalendarView.tsx     # 日历看板
│   │   └── TodoDetailPanel.tsx  # 任务详情面板
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useSettings.ts         # 设置持久化
│   │   └── useNotificationScheduler.ts  # 通知调度器
│   └── index.css           # 全局样式 + Design Tokens
├── public/
│   └── logo.png            # 应用图标
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## 构建打包

### 本地构建

```bash
# 仅构建 Web 产物
pnpm build

# 构建 Electron 安装包（输出到 release/）
pnpm electron:build
```

- Windows → `release/FocusWorkspace Setup x.x.x.exe`
- macOS → `release/FocusWorkspace-x.x.x.dmg`
- Linux → `release/FocusWorkspace-x.x.x.AppImage`

### 自动发版（GitHub Actions）

推送 `v*` 标签即可触发三平台自动构建并发布到 GitHub Release：

```bash
# 使用发版脚本
.\scripts\release.ps1           # patch 升级 (1.0.0 → 1.0.1)
.\scripts\release.ps1 minor     # minor 升级 (1.0.0 → 1.1.0)
.\scripts\release.ps1 major     # major 升级 (1.0.0 → 2.0.0)
```

脚本自动完成：版本号升级 → 提交 → 打 tag → 推送 → 触发 CI 构建发布。

CI 流程：三平台并行构建 → 上传产物 → 创建 GitHub Release 并附加安装包。

## 设计令牌

全局样式变量定义在 `src/index.css`：

```css
--primary:        #8B5CF6   /* 主色调 */
--background:     #0F1419   /* 背景色 */
--card:           #1A1F2A   /* 卡片背景 */
--border:         #2A2F3E   /* 边框色 */
--foreground:     #E8EDF4   /* 前景文字 */
--muted-foreground: #8892A4 /* 次要文字 */
```

## 通知机制

- 基于 Browser Notification API 的系统级通知
- 支持提前提醒（可配置分钟数）
- 支持重复提醒（可配置间隔，直到任务完成/删除）
- 全天任务在截止日期前一天提醒
- 通知设置：点击侧边栏齿轮图标 → 提醒设置
