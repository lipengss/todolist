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
