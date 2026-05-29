# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Architecture Overview

This is a **monorepo** with two independent applications:

```
root/                        # React 18 + Vite 6 + Tailwind CSS v4 + Electron 33
  src/
    api/                     # Backend API client functions (auth, todos, categories, settings)
    hooks/                   # Data hooks consumed by App.tsx
    components/              # Presentational components
server/                      # NestJS 11 + Prisma ORM + SQLite + JWT auth
  src/
    todos/ categories/ settings/ auth/ prisma/   # Feature modules (module + controller + service)
  prisma/
    schema.prisma            # 6 models: Todo, Subtask, Category, User, RegistrationRequest, Settings
```

**Key architectural point:** The app has two data-flow modes:
- **Dev mode:** Frontend Vite dev server proxies `/api` → `localhost:3000` (NestJS)
- **Production (Docker):** nginx serves static frontend files and proxies `/api` → backend container

## Data Flow

```
React Components ← App.tsx (useState/useMemo) ← hooks/useApi*.ts ← api/*.ts (fetch) → /api → NestJS
```

- **No state management library** — all shared state lives in `App.tsx` via `useState`/`useMemo`
- `App.tsx` invokes `useApiTodos()` and `useApiCategories()`, derives `filteredTodos`/`activeTodos`/`trashedTodos`, and passes everything down as props
- Two older localStorage-based hooks (`useTodos.ts`, `useCategories.ts`) exist but are **not used** — the app uses API-backed hooks exclusively

## API Layer (`src/api/client.ts`)

- Base URL is `/api` (relative — works with both Vite proxy and nginx proxy)
- JWT token stored in `localStorage` key `fw_token`
- `apiFetch<T>()` auto-attaches `Authorization: Bearer <token>` header
- On 401 response, token is cleared (triggers re-login)

## Frontend ↔ Backend Type Mapping

The frontend `Todo` type uses `category: string` (category ID), but the backend wire format uses `categoryId`. The mapping happens in `src/api/todos.ts` `fromApi()` / `toApi()`:
- Backend sends `{ categoryId, category: { id, name, color } }`
- Frontend transforms to `{ category: category.id }`
- On write, `category` is renamed back to `categoryId`

## Auth & Registration

- JWT tokens signed with `JWT_SECRET` env var, 30-day expiry
- First user created on startup is `admin` role (from `AUTH_USERNAME`/`AUTH_PASSWORD` env vars)
- New users submit registration requests → admin approves/rejects in the Settings modal (`RegistrationManager` component)
- `AuthGuard(JwtAuthGuard)` protects all endpoints except `login` and `register`
- Admin-only endpoints (`registrations/*`) check `req.user.role === "admin"` inline

## Database

- **SQLite** via Prisma ORM, file stored at `server/prisma/data.db`
- In Docker, the DB file is persisted via Docker volume `sqlite-data` mounted at `/app/prisma`
- Server startup runs `prisma db push --accept-data-loss` (auto-migrates schema, destructive changes possible)
- Todo deletion is **soft delete** (sets `deletedAt` timestamp), never hard-deletes rows

## Docker Deployment

```
Browser → nginx (:80) → /api/* → proxy_pass http://server:3000
                       → /*     → static files (Vite dist/)
```

- `server/Dockerfile`: Multi-stage, `npm install -g pnpm@9.15.0` (NOT corepack — avoids pnpm v10 lockfile compatibility issues)
- `Dockerfile.nginx`: Builds frontend with Vite, serves via nginx:alpine
- The bt-panel nginx on the server acts as a reverse proxy at port 80 → Docker nginx at port 8080

## Key Patterns & Gotchas

- **pnpm lockfile:** The Dockerfiles pin `pnpm@9.15.0` explicitly — corepack's latest pnpm (v10) is incompatible with the current lockfile and will fail with `ERR_PNPM_IGNORED_BUILDS`
- **Prisma in Docker:** The `prisma db push` runs on every container start, not at build time
- **Settings model:** Singleton row with `id: 1`, upserted on module init so it always exists
- **Category deletion:** Uses a Prisma `$transaction` to nullify `categoryId` on associated todos before deleting the category
- **Notification scheduler:** Runs `setInterval` every 30s in the browser, checks todo due times against current time, fires Browser Notification API
- **Server-side validation:** `ValidationPipe` with `whitelist: true` strips unknown properties; DTOs use `class-validator` decorators
