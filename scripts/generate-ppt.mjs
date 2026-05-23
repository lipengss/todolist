import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();

pptx.defineLayout({ name: "CUSTOM", width: 13.333, height: 7.5 });
pptx.layout = "CUSTOM";

const PRIMARY = "8B5CF6";
const DARK_BG = "0F1419";
const CARD_BG = "1A1F2E";
const WHITE = "FFFFFF";
const MUTED = "8892A4";
const ACCENT_BLUE = "3B82F6";
const ACCENT_RED = "EF4444";
const ACCENT_GREEN = "22C55E";

// ===== Slide 1: Cover =====
const s1 = pptx.addSlide();
s1.background = { fill: DARK_BG };
s1.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: "100%", h: "100%",
  fill: { color: DARK_BG },
});
s1.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 1.5, w: 0.8, h: 0.8,
  fill: { color: PRIMARY },
  rectRadius: 0.15,
});
s1.addText("✓", {
  x: 0.8, y: 1.5, w: 0.8, h: 0.8,
  fontSize: 28, color: WHITE, bold: true,
  align: "center", valign: "middle",
});
s1.addText("FocusWorkspace", {
  x: 1.8, y: 1.5, w: 8, h: 0.8,
  fontSize: 40, color: WHITE, bold: true,
  fontFace: "Microsoft YaHei",
});
s1.addText("待办事项桌面应用 — 技术架构与产品演示", {
  x: 1.8, y: 2.4, w: 8, h: 0.6,
  fontSize: 18, color: MUTED,
  fontFace: "Microsoft YaHei",
});
s1.addText("2026.05", {
  x: 1.8, y: 3.1, w: 4, h: 0.4,
  fontSize: 14, color: MUTED,
  fontFace: "Microsoft YaHei",
});

// ===== Slide 2: 项目概览 =====
const s2 = pptx.addSlide();
s2.background = { fill: DARK_BG };
s2.addText("项目概览", {
  x: 0.8, y: 0.5, w: 5, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
  fontFace: "Microsoft YaHei",
});
s2.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 1.1, w: 1.2, h: 0.05,
  fill: { color: PRIMARY },
});

const overviewItems = [
  ["定位", "跨平台桌面端待办事项管理工具，支持 Windows / macOS / Linux"],
  ["技术架构", "Electron + React 18 + TypeScript + Vite"],
  ["UI 框架", "Tailwind CSS v4 + Radix UI 组件库"],
  ["数据存储", "localStorage 本地持久化，无需后端服务"],
  ["设计风格", "深色主题，紫色 (#8B5CF6) 品牌色，token 化色彩体系"],
];

overviewItems.forEach(([label, desc], i) => {
  const y = 1.6 + i * 1.0;
  s2.addShape(pptx.ShapeType.rect, {
    x: 0.8, y, w: 11, h: 0.8,
    fill: { color: CARD_BG },
    rectRadius: 0.1,
  });
  s2.addText(label, {
    x: 1.1, y, w: 2, h: 0.8,
    fontSize: 14, color: PRIMARY, bold: true,
    fontFace: "Microsoft YaHei", valign: "middle",
  });
  s2.addText(desc, {
    x: 3.2, y, w: 8.3, h: 0.8,
    fontSize: 13, color: WHITE,
    fontFace: "Microsoft YaHei", valign: "middle",
  });
});

// ===== Slide 3: 技术栈 =====
const s3 = pptx.addSlide();
s3.background = { fill: DARK_BG };
s3.addText("技术栈", {
  x: 0.8, y: 0.5, w: 5, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
  fontFace: "Microsoft YaHei",
});
s3.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 1.1, w: 1.2, h: 0.05,
  fill: { color: PRIMARY },
});

const techs = [
  { cat: "前端框架", items: "React 18 + TypeScript 5.8" },
  { cat: "构建工具", items: "Vite 6 + pnpm" },
  { cat: "桌面框架", items: "Electron 33 + electron-builder" },
  { cat: "样式方案", items: "Tailwind CSS v4 + tw-animate-css" },
  { cat: "UI 组件", items: "Radix UI (Dialog, Popover, Select, Checkbox, ScrollArea, Form)" },
  { cat: "日期处理", items: "date-fns v4 + react-day-picker v9" },
  { cat: "图标库", items: "lucide-react" },
  { cat: "通知系统", items: "Browser Notification API" },
];

techs.forEach((t, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.8 + col * 5.8;
  const y = 1.5 + row * 1.3;
  s3.addShape(pptx.ShapeType.rect, {
    x, y, w: 5.5, h: 1.1,
    fill: { color: CARD_BG },
    rectRadius: 0.1,
  });
  s3.addText(t.cat, {
    x: x + 0.3, y: y + 0.15, w: 4.9, h: 0.35,
    fontSize: 13, color: PRIMARY, bold: true,
    fontFace: "Microsoft YaHei",
  });
  s3.addText(t.items, {
    x: x + 0.3, y: y + 0.55, w: 4.9, h: 0.35,
    fontSize: 12, color: MUTED,
    fontFace: "Microsoft YaHei",
  });
});

// ===== Slide 4: 功能矩阵 =====
const s4 = pptx.addSlide();
s4.background = { fill: DARK_BG };
s4.addText("核心功能", {
  x: 0.8, y: 0.5, w: 5, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
  fontFace: "Microsoft YaHei",
});
s4.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 1.1, w: 1.2, h: 0.05,
  fill: { color: PRIMARY },
});

const features = [
  ["📋  任务管理", "创建、编辑、删除任务\n子任务拆分、备注、优先级标记\n任务收藏（收集箱）"],
  ["📅  日历看板", "月视图日历展示任务分布\n日期格子显示优先级色块\n快速双击添加当天任务"],
  ["🔔  智能提醒", "定时任务提前 N 分钟通知\n全天任务提前一天 9:00 提醒\n可配置重复提醒间隔"],
  ["⌨  键盘快捷键", "? 查看快捷键面板\nCtrl+N 新建 / Ctrl+F 搜索\n↑↓ 导航 / Space 完成 / Enter 详情"],
  ["🏷  分类系统", "自定义分类 + 颜色标签\n按分类筛选任务列表\n分类编辑 / 删除管理"],
  ["🗑  回收站", "软删除机制，可恢复\n清空回收站批量清理"],
];

features.forEach(([title, desc], i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 0.8 + col * 4.0;
  const y = 1.5 + row * 2.9;
  s4.addShape(pptx.ShapeType.rect, {
    x, y, w: 3.7, h: 2.6,
    fill: { color: CARD_BG },
    rectRadius: 0.12,
  });
  s4.addText(title, {
    x: x + 0.25, y: y + 0.2, w: 3.2, h: 0.45,
    fontSize: 14, color: WHITE, bold: true,
    fontFace: "Microsoft YaHei",
  });
  s4.addText(desc, {
    x: x + 0.25, y: y + 0.8, w: 3.2, h: 1.6,
    fontSize: 11, color: MUTED,
    fontFace: "Microsoft YaHei", lineSpacingMultiple: 1.5,
  });
});

// ===== Slide 5: 组件架构 =====
const s5 = pptx.addSlide();
s5.background = { fill: DARK_BG };
s5.addText("组件架构", {
  x: 0.8, y: 0.5, w: 5, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
  fontFace: "Microsoft YaHei",
});
s5.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 1.1, w: 1.2, h: 0.05,
  fill: { color: PRIMARY },
});

// Architecture diagram using shapes
const drawBox = (x, y, w, h, text, color, subtext = "") => {
  s5.addShape(pptx.ShapeType.rect, {
    x, y, w, h,
    fill: { color },
    rectRadius: 0.08,
  });
  s5.addText(text, {
    x: x + 0.15, y: y + 0.08, w: w - 0.3, h: subtext ? h * 0.5 : h - 0.16,
    fontSize: 12, color: WHITE, bold: true,
    fontFace: "Microsoft YaHei", align: "center", valign: "middle",
  });
  if (subtext) {
    s5.addText(subtext, {
      x: x + 0.15, y: y + h * 0.5, w: w - 0.3, h: h * 0.45,
      fontSize: 9, color: MUTED,
      fontFace: "Consolas", align: "center", valign: "middle",
    });
  }
};

// App.tsx - root
drawBox(5.0, 1.6, 3.3, 0.8, "App.tsx", PRIMARY, "状态管理 · 路由 · 数据流");

// Layout components
drawBox(1.5, 2.9, 2.5, 0.7, "Sidebar", ACCENT_BLUE, "导航 · 分类 · 统计");
drawBox(5.0, 2.9, 3.3, 0.7, "Content Area", ACCENT_BLUE, "日历视图 / 任务列表");
drawBox(8.9, 2.9, 3.0, 0.7, "TodoDetailPanel", ACCENT_BLUE, "任务详情侧面板");

// Feature components
drawBox(0.8, 4.1, 2.0, 0.6, "Header", ACCENT_GREEN, "搜索 · 筛选");
drawBox(3.2, 4.1, 2.0, 0.6, "StatsCards", ACCENT_GREEN, "统计卡片");
drawBox(5.6, 4.1, 2.0, 0.6, "CalendarView", ACCENT_GREEN, "日历 + 侧面板");
drawBox(9.0, 4.1, 2.5, 0.6, "TodoItem", ACCENT_GREEN, "任务列表项");

// Hooks layer
drawBox(0.8, 5.4, 11, 0.65, "Hooks Layer", ACCENT_RED, "useKeyboardShortcuts  ·  useNotificationScheduler  ·  useSettings");

// UI Primitives
drawBox(0.8, 6.3, 11, 0.55, "UI Primitives", MUTED, "Modal · DatePicker · TimePicker · SelectField · Input · InputNumber · Textarea · ScrollArea · FormField");

// Arrows (simplified as lines)
s5.addShape(pptx.ShapeType.line, { x: 5.8, y: 2.4, w: 0, h: 0.5, line: { color: PRIMARY, width: 1.5 } });
s5.addShape(pptx.ShapeType.line, { x: 2.7, y: 2.4, w: 0, h: 0.5, line: { color: ACCENT_BLUE, width: 1.5 } });
s5.addShape(pptx.ShapeType.line, { x: 6.5, y: 2.4, w: 0, h: 0.5, line: { color: ACCENT_BLUE, width: 1.5 } });
s5.addShape(pptx.ShapeType.line, { x: 10.4, y: 2.4, w: 0, h: 0.5, line: { color: ACCENT_BLUE, width: 1.5 } });

// ===== Slide 6: 通知系统设计 =====
const s6 = pptx.addSlide();
s6.background = { fill: DARK_BG };
s6.addText("通知系统设计", {
  x: 0.8, y: 0.5, w: 5, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
  fontFace: "Microsoft YaHei",
});
s6.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 1.1, w: 1.2, h: 0.05,
  fill: { color: PRIMARY },
});

const notifyFlow = [
  { step: "1", title: "定时轮询", desc: "useNotificationScheduler\n每 30 秒扫描活跃任务" },
  { step: "2", title: "触发判断", desc: "有截止时间 → 提前 N 分钟提醒\n无截止时间 → 前一天 9:00 提醒" },
  { step: "3", title: "重复机制", desc: "首次提醒后每隔 M 分钟重复\n直到任务完成或过期" },
  { step: "4", title: "点击跳转", desc: "点击通知 → 聚焦窗口\n自动打开对应任务详情" },
];

notifyFlow.forEach(({ step, title, desc }, i) => {
  const x = 0.8 + i * 3.15;
  s6.addShape(pptx.ShapeType.rect, {
    x, y: 1.6, w: 2.85, h: 2.4,
    fill: { color: CARD_BG },
    rectRadius: 0.1,
  });
  s6.addShape(pptx.ShapeType.rect, {
    x: x + 0.25, y: 1.85, w: 0.5, h: 0.5,
    fill: { color: PRIMARY },
    rectRadius: 0.25,
  });
  s6.addText(step, {
    x: x + 0.25, y: 1.85, w: 0.5, h: 0.5,
    fontSize: 16, color: WHITE, bold: true,
    align: "center", valign: "middle",
  });
  s6.addText(title, {
    x: x + 0.9, y: 1.85, w: 1.7, h: 0.5,
    fontSize: 14, color: WHITE, bold: true,
    fontFace: "Microsoft YaHei", valign: "middle",
  });
  s6.addText(desc, {
    x: x + 0.25, y: 2.6, w: 2.35, h: 1.2,
    fontSize: 11, color: MUTED,
    fontFace: "Microsoft YaHei", lineSpacingMultiple: 1.4,
  });
  if (i < 3) {
    s6.addText("→", {
      x: x + 2.85, y: 2.4, w: 0.3, h: 0.5,
      fontSize: 20, color: PRIMARY, bold: true,
      align: "center", valign: "middle",
    });
  }
});

// Settings panel
s6.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 4.4, w: 11, h: 2.5,
  fill: { color: CARD_BG },
  rectRadius: 0.1,
});
s6.addText("可配置参数", {
  x: 1.1, y: 4.55, w: 10, h: 0.45,
  fontSize: 14, color: PRIMARY, bold: true,
  fontFace: "Microsoft YaHei",
});
const params = [
  "reminderMinutes: 提前提醒分钟数（默认 15）",
  "repeatEnabled: 是否启用重复提醒（默认 true）",
  "repeatIntervalMinutes: 重复间隔分钟数（默认 5）",
];
s6.addText(params.join("\n"), {
  x: 1.1, y: 5.1, w: 10, h: 1.6,
  fontSize: 12, color: MUTED,
  fontFace: "Consolas", lineSpacingMultiple: 1.6,
});

// ===== Slide 7: 设计系统 =====
const s7 = pptx.addSlide();
s7.background = { fill: DARK_BG };
s7.addText("设计系统", {
  x: 0.8, y: 0.5, w: 5, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
  fontFace: "Microsoft YaHei",
});
s7.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 1.1, w: 1.2, h: 0.05,
  fill: { color: PRIMARY },
});

// Color palette
const colors = [
  ["Primary", PRIMARY, "品牌色 / 按钮 / 选中态"],
  ["Background", DARK_BG, "页面背景"],
  ["Card", "1A1F2E", "卡片 / 输入框背景"],
  ["Border", "2A2F3E", "边框 / 分割线"],
  ["Muted", MUTED, "次要文字"],
  ["Chart-1", "3B82F6", "蓝色 / 中优先级"],
  ["Chart-2", "EF4444", "红色 / 高优先级"],
  ["Chart-3", "22C55E", "绿色 / 已完成"],
  ["Chart-4", "9CA3AF", "灰色 / 低优先级"],
  ["Chart-5", "F97316", "橙色 / 工作分类"],
];

colors.forEach(([name, hex, desc], i) => {
  const y = 1.5 + i * 0.55;
  s7.addShape(pptx.ShapeType.rect, {
    x: 1.0, y, w: 0.4, h: 0.4,
    fill: { color: hex },
    rectRadius: 0.06,
  });
  s7.addText(name, {
    x: 1.6, y, w: 1.5, h: 0.4,
    fontSize: 12, color: WHITE, bold: true,
    fontFace: "Consolas", valign: "middle",
  });
  s7.addText(`#${hex}`, {
    x: 3.2, y, w: 1.8, h: 0.4,
    fontSize: 11, color: MUTED,
    fontFace: "Consolas", valign: "middle",
  });
  s7.addText(desc, {
    x: 5.2, y, w: 6, h: 0.4,
    fontSize: 11, color: MUTED,
    fontFace: "Microsoft YaHei", valign: "middle",
  });
});

// Priority vs Category distinction
s7.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 7.0, w: 11, h: 0.4,
  fill: { color: CARD_BG },
  rectRadius: 0.06,
});
s7.addText("视觉区分：优先级 → 胶囊圆角 (rounded-full) | 分类 → 边框按钮+圆点 (rounded-lg border + dot)", {
  x: 1.1, y: 7.0, w: 10.4, h: 0.4,
  fontSize: 11, color: MUTED,
  fontFace: "Microsoft YaHei", valign: "middle",
});

// ===== Slide 8: 项目文件结构 =====
const s8 = pptx.addSlide();
s8.background = { fill: DARK_BG };
s8.addText("项目结构", {
  x: 0.8, y: 0.5, w: 5, h: 0.7,
  fontSize: 28, color: WHITE, bold: true,
  fontFace: "Microsoft YaHei",
});
s8.addShape(pptx.ShapeType.rect, {
  x: 0.8, y: 1.1, w: 1.2, h: 0.05,
  fill: { color: PRIMARY },
});

const tree = [
  "todo-desktop/",
  "├── src/",
  "│   ├── App.tsx                    # 应用根组件，状态管理",
  "│   ├── components/",
  "│   │   ├── CalendarView.tsx       # 日历看板",
  "│   │   ├── Sidebar.tsx            # 侧边导航",
  "│   │   ├── Header.tsx             # 搜索/筛选栏",
  "│   │   ├── TodoItem.tsx           # 任务列表项",
  "│   │   ├── TodoDetailPanel.tsx    # 任务详情面板",
  "│   │   ├── StatsCards.tsx         # 统计卡片",
  "│   │   ├── ShortcutHelpPanel.tsx  # 快捷键帮助",
  "│   │   ├── types.ts               # 类型定义",
  "│   │   └── ui/                    # UI 基础组件 (9个)",
  "│   └── hooks/",
  "│       ├── useKeyboardShortcuts.ts",
  "│       ├── useNotificationScheduler.ts",
  "│       └── useSettings.ts",
  "├── electron/                      # Electron 主进程",
  "├── package.json",
  "└── public/logo.png",
];

s8.addText(tree.join("\n"), {
  x: 1.0, y: 1.5, w: 11, h: 5.8,
  fontSize: 11, color: WHITE,
  fontFace: "Consolas",
  lineSpacingMultiple: 1.25,
});

// ===== Slide 9: 总结 =====
const s9 = pptx.addSlide();
s9.background = { fill: DARK_BG };
s9.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: "100%", h: "100%",
  fill: { color: PRIMARY },
});
s9.addText("Thanks", {
  x: 1, y: 2, w: 11, h: 1.2,
  fontSize: 48, color: WHITE, bold: true,
  align: "center", valign: "middle",
  fontFace: "Microsoft YaHei",
});
s9.addText("FocusWorkspace — 高效待办事项管理", {
  x: 1, y: 3.5, w: 11, h: 0.8,
  fontSize: 18, color: WHITE,
  align: "center", fontFace: "Microsoft YaHei",
});
s9.addText("React + Electron + TypeScript + Tailwind CSS", {
  x: 1, y: 4.3, w: 11, h: 0.6,
  fontSize: 14, color: WHITE,
  align: "center", fontFace: "Consolas",
});

const outPath = "E:/项目测试/todo-desktop/FocusWorkspace-介绍.pptx";
await pptx.writeFile({ fileName: outPath });
console.log("PPT generated:", outPath);
