# NestJS Backend Service — Design Spec

**Date**: 2026-05-27
**Status**: Approved
**Scope**: Add NestJS backend with PostgreSQL to replace localStorage persistence, Docker deployment

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Product scope | Single-user cloud sync | No multi-tenancy needed |
| Database | PostgreSQL 16 | Structured data, Prisma support, Docker-friendly |
| ORM | Prisma | Type-safe, migration tooling, NestJS integration |
| Auth | JWT (single user, credentials via env) | Minimal overhead for single-user |
| Frontend sync | Pure online (direct API calls) | Simpler than offline-first |
| Containerization | Docker Compose (NestJS + PG) | Single-command deploy |

## Architecture

```
Electron App ──HTTP/REST──► NestJS Server ──Prisma──► PostgreSQL
   (React)       :3000        (Docker)              (Docker)
```

## Project Structure

```
todo-desktop/
├── client/                    # Existing frontend (moved)
│   └── src/
├── server/                    # NEW NestJS backend
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── prisma.service.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── jwt.strategy.ts
│   │   ├── todos/
│   │   │   ├── todos.module.ts
│   │   │   ├── todos.controller.ts
│   │   │   ├── todos.service.ts
│   │   │   └── dto/
│   │   ├── categories/
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   └── categories.service.ts
│   │   └── settings/
│   │       ├── settings.module.ts
│   │       ├── settings.controller.ts
│   │       └── settings.service.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── docker-compose.yml
└── package.json              # Monorepo root (npm workspaces)
```

## Database Schema (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Todo {
  id          String     @id @default(uuid())
  text        String
  note        String?
  completed   Boolean    @default(false)
  starred     Boolean    @default(false)
  priority    String     @default("medium")
  dueDate     String?
  dueTime     String?
  recurrence  String?
  createdAt   String
  completedAt String?
  deletedAt   String?
  subtasks    Subtask[]
  category    Category?  @relation(fields: [categoryId], references: [id])
  categoryId  String?
}

model Subtask {
  id        String  @id @default(uuid())
  text      String
  completed Boolean @default(false)
  todo      Todo    @relation(fields: [todoId], references: [id], onDelete: Cascade)
  todoId    String
}

model Category {
  id    String  @id @default(uuid())
  name  String
  color String
  todos Todo[]
}

model Settings {
  id                    Int     @id @default(1)
  reminderMinutes       Int     @default(15)
  repeatEnabled         Boolean @default(false)
  repeatIntervalMinutes Int     @default(5)
}
```

## API Endpoints

All endpoints except `/api/auth/login` require `Authorization: Bearer <token>`.

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/auth/login` | `{ username, password }` | `{ access_token }` |
| `GET` | `/api/todos` | — | `Todo[]` |
| `POST` | `/api/todos` | CreateTodoDto | `Todo` |
| `PATCH` | `/api/todos/:id` | UpdateTodoDto | `Todo` |
| `DELETE` | `/api/todos/:id` | — | `Todo` (soft-deleted) |
| `GET` | `/api/categories` | — | `Category[]` |
| `POST` | `/api/categories` | CreateCategoryDto | `Category` |
| `PATCH` | `/api/categories/:id` | UpdateCategoryDto | `Category` |
| `DELETE` | `/api/categories/:id` | — | `{ ok: true }` |
| `GET` | `/api/settings` | — | `Settings` |
| `PUT` | `/api/settings` | UpdateSettingsDto | `Settings` |

## Auth Flow

1. Credentials stored in `.env`: `AUTH_USERNAME`, `AUTH_PASSWORD`, `JWT_SECRET`
2. POST `/api/auth/login` with username/password → returns JWT
3. Frontend stores JWT in memory (or localStorage), attaches to all requests
4. NestJS AuthGuard validates JWT on all protected routes

## Docker Deployment

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: focusworkspace
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: focusworkspace
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  server:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://focusworkspace:${DB_PASSWORD}@db:5432/focusworkspace
      JWT_SECRET: ${JWT_SECRET}
      AUTH_USERNAME: ${AUTH_USERNAME}
      AUTH_PASSWORD: ${AUTH_PASSWORD}
    depends_on:
      - db
    restart: unless-stopped

volumes:
  pgdata:
```

## Frontend Changes Required

1. Move existing frontend code to `client/` directory
2. Create API client layer (`client/src/api/`) with fetch wrappers for all endpoints
3. Replace `useTodos` and `useCategories` hooks' localStorage logic with API calls
4. Add login screen (first-run, stores token)
5. Remove localStorage persistence (keep token only)
6. Update Vite config to proxy `/api` to `http://localhost:3000` in dev mode

## Implementation Phases

1. **Scaffold**: NestJS project, Prisma schema, Docker Compose
2. **CRUD APIs**: Todos + Categories + Settings modules
3. **Auth**: JWT guard, login endpoint
4. **Frontend migration**: API client, hook refactor, login screen
5. **Docker polish**: Dockerfile, env management, documentation
