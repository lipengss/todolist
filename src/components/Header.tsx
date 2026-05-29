import { CalendarDays, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { DueFilter, PriorityFilter } from "./types";
import { Input } from "./ui/Input";
import { SelectField } from "./ui/SelectField";

interface HeaderProps {
  title: string;
  date: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  priorityFilter: PriorityFilter;
  onPriorityFilterChange: (value: PriorityFilter) => void;
  dueFilter: DueFilter;
  onDueFilterChange: (value: DueFilter) => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  authenticated?: boolean;
  onLoginClick?: () => void;
}

export function Header({
  title,
  date,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  dueFilter,
  onDueFilterChange,
  sidebarCollapsed,
  onToggleSidebar,
  authenticated,
  onLoginClick,
}: HeaderProps) {
  return (
    <header className="border-b border-border px-8 py-6 flex items-center justify-between gap-6 bg-background/95">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label={sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
          >
            {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-medium leading-normal truncate">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{date}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="search-input"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索任务..."
            className="h-11 pl-11 w-64 rounded-xl"
          />
        </div>

        <SelectField
          value={priorityFilter}
          onChange={onPriorityFilterChange}
          ariaLabel="优先级筛选"
          options={[
            { value: "all", label: "所有优先级" },
            { value: "high", label: "高优先级" },
            { value: "medium", label: "中优先级" },
            { value: "low", label: "低优先级" },
          ]}
        />

        <div className="relative flex items-center">
          <CalendarDays className="absolute left-4 w-4 h-4 text-muted-foreground pointer-events-none" />
          <SelectField
            value={dueFilter}
            onChange={onDueFilterChange}
            className="pl-11"
            ariaLabel="截止日期筛选"
            options={[
              { value: "all", label: "所有日期" },
              { value: "today", label: "今天到期" },
              { value: "upcoming", label: "未来计划" },
              { value: "none", label: "无截止日期" },
            ]}
          />
        </div>

        {!authenticated && (
          <button
            onClick={onLoginClick}
            className="text-xs text-primary hover:underline flex-shrink-0"
          >
            登录
          </button>
        )}
      </div>
    </header>
  );
}
