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
# Frontend (root directory)
pnpm install                  # Install dependencies
pnpm dev                      # Start Vite dev server on :5173
pnpm build                    # TypeScript check + Vite production build → dist/
pnpm electron:dev             # Start Electron + Vite concurrently

# Backend (server/ directory)
cd server
pnpm install                  # Install server dependencies
pnpm dev                      # Build TypeScript + start NestJS on :3000
pnpm build                    # TypeScript compilation only
npx prisma db push            # Sync Prisma schema to SQLite database
npx prisma generate           # Regenerate Prisma client after schema changes

# Docker deployment
docker compose up -d --build  # Build and start both containers
docker compose ps              # Check running containers
docker compose logs -f         # Follow logs
```

## Architecture

This is a **local-first desktop app** — all data stored in browser localStorage, no login required.

```
src/
  App.tsx                    # Single state orchestrator (useState + useMemo)
  components/                # Presentational components
  hooks/
    useTodos.ts              # localStorage-backed todo CRUD
    useCategories.ts         # localStorage-backed category CRUD
    useSettings.ts           # localStorage-backed settings
    useNotificationScheduler.ts  # Browser notification scheduler
    useKeyboardShortcuts.ts  # Global keyboard shortcuts
server/                      # NestJS backend (for Docker/online deployment only)
```

## Data Flow

```
Components ← App.tsx (useState/useMemo) ← hooks/useTodos.ts useCategories.ts → localStorage
```

- **No state management library** — all shared state in `App.tsx`
- Data persists in `localStorage` keys: `focusworkspace.todos.v1`, `focusworkspace.categories.v1`, `focusworkspace.settings.v1`
- Default categories (工作/学习/生活/健康) created on first load

## Key Patterns

- **Todo deletion** is soft delete (sets `deletedAt` timestamp)
- **Notification scheduler** runs `setInterval` every 30s, fires Browser Notification API
- **Settings** stored in localStorage, read/written via plain functions in `useSettings.ts`
