# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Feature Development Rule

**Before writing any code for a feature request:**
1. First invoke the `brainstorming` skill to explore the requirements, design approach, and trade-offs
2. Present a clear plan with options to the user
3. Wait for the user to approve the plan before implementing
4. Do not write a single line of code until the plan is confirmed

## Common Commands

```bash
pnpm install                  # Install dependencies
pnpm dev                      # Start Vite dev server on :5173
pnpm build                    # TypeScript check + Vite production build → dist/
pnpm electron:dev             # Start Electron + Vite concurrently
pnpm electron:build           # Build Electron installer → release/
```

## Architecture

**Local-first desktop app.** All data stored in browser localStorage. No login, no backend required.

```
src/
  App.tsx                         # Single state orchestrator (useState + useMemo)
  components/
    ui/                           # Reusable UI primitives (Input, DatePicker, Modal, etc.)
    Sidebar.tsx                   # Navigation + category management
    Header.tsx                    # Search bar + filters
    CalendarView.tsx              # Month calendar with ECharts
    StatsView.tsx                 # ECharts analytics dashboard
    TodoDetailPanel.tsx           # Slide-out detail panel with subtasks + notes
    QuickAddBar.tsx               # Inline quick-add bar
    TodoItem.tsx                  # Single todo row
    StatsCards.tsx                # Summary stat cards (pending, high priority, etc.)
    types.ts                      # Todo, Category, FilterType, Priority types
  hooks/
    useTodos.ts                   # localStorage CRUD, recurrence auto-creation
    useCategories.ts              # localStorage CRUD, default categories on first load
    useSettings.ts                # localStorage settings (plain functions, not a hook)
    useNotificationScheduler.ts   # 30s interval, Browser Notification API
    useKeyboardShortcuts.ts       # Global shortcuts: Ctrl+N, Ctrl+F, arrows, Space, etc.
  api/                            # Legacy API client functions (for server deployment)
server/                           # NestJS backend (Docker deployment, not needed locally)
  src/
    todos/ categories/ settings/ auth/ prisma/
  prisma/schema.prisma
```

## Data Flow

```
Components ← App.tsx (useState/useMemo) ← useTodos / useCategories → localStorage
```

- **No state management library** — all shared state in `App.tsx`
- localStorage keys: `focusworkspace.todos.v1`, `focusworkspace.categories.v1`, `focusworkspace.settings.v1`
- Default categories (工作/学习/生活/健康) passed to `useCategories(DEFAULT_CATEGORIES)` as seed

## Key Patterns

### Recurrence auto-creation (useTodos.ts)

When a recurring todo is marked complete, `useTodos` automatically creates a "next instance" with the due date advanced by the recurrence interval (daily +1d, weekly +7d, monthly +1mo). The new instance has a fresh ID via `getNextDueDate()`.

### ID generation

Use the `generateId()` helper in `App.tsx`:
```typescript
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
```
Do NOT use `crypto.randomUUID()` — it may not be available in all environments.

### Soft delete

Todo deletion sets `deletedAt` timestamp rather than removing the row. `activeTodos` filters by `!deletedAt`, `trashedTodos` by `deletedAt`.

### Electron integration

- Dev: loads `http://localhost:5173` with DevTools open
- Production: loads `dist/index.html` from disk
- `nodeIntegration: false`, `contextIsolation: true` for security

### Data export/import

Exports JSON to `focusworkspace-backup-<date>.json`. Format: `{ version, exportedAt, todos, categories }`. Import reads the same format and uses `addTodo()` for each item, generating new IDs if missing.

## Docker Deployment (legacy)

The `server/` directory and Docker config exist for optional online deployment. Not needed for local development. See older commits or the server README for details if needed.
