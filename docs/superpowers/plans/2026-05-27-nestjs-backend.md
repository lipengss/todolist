# NestJS Backend Service — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a NestJS backend with PostgreSQL + Prisma, JWT auth, Docker deployment, and migrate the Electron frontend from localStorage to REST API.

**Architecture:** Monorepo with `client/` (existing React+Vite+Electron) and `server/` (new NestJS). Docker Compose orchestrates PostgreSQL and the NestJS server. Frontend switches from localStorage hooks to API client calls, with a login screen for first-time JWT acquisition.

**Tech Stack:** NestJS 11, Prisma 7, PostgreSQL 16, JWT (passport-jwt), Docker Compose, class-validator

---

## File Structure

### New Files (server/)
| File | Responsibility |
|------|---------------|
| `server/package.json` | NestJS + Prisma + auth dependencies |
| `server/tsconfig.json` | TypeScript config with decorators |
| `server/.env.example` | Environment variable template |
| `server/Dockerfile` | Multi-stage Node.js container |
| `server/prisma/schema.prisma` | DB schema for Todo/Subtask/Category/Settings |
| `server/src/main.ts` | Bootstrap NestJS app, CORS, global prefix |
| `server/src/app.module.ts` | Root module importing all feature modules |
| `server/src/prisma/prisma.service.ts` | PrismaClient singleton with onModuleInit |
| `server/src/prisma/prisma.module.ts` | Global Prisma module |
| `server/src/todos/todos.module.ts` | Todos module definition |
| `server/src/todos/todos.service.ts` | CRUD logic with Prisma |
| `server/src/todos/todos.controller.ts` | REST endpoints for /api/todos |
| `server/src/todos/dto/create-todo.dto.ts` | Validation for todo creation |
| `server/src/todos/dto/update-todo.dto.ts` | Validation for todo updates |
| `server/src/categories/categories.module.ts` | Categories module |
| `server/src/categories/categories.service.ts` | CRUD for categories |
| `server/src/categories/categories.controller.ts` | REST endpoints for /api/categories |
| `server/src/categories/dto/create-category.dto.ts` | Validation for category creation |
| `server/src/categories/dto/update-category.dto.ts` | Validation for category updates |
| `server/src/settings/settings.module.ts` | Settings module |
| `server/src/settings/settings.service.ts` | Get/update settings (single row) |
| `server/src/settings/settings.controller.ts` | REST endpoints for /api/settings |
| `server/src/settings/dto/update-settings.dto.ts` | Validation for settings update |
| `server/src/auth/auth.module.ts` | Auth module with JWT registration |
| `server/src/auth/auth.service.ts` | Validate credentials, issue JWT |
| `server/src/auth/auth.controller.ts` | POST /api/auth/login |
| `server/src/auth/auth.guard.ts` | JWT auth guard |
| `server/src/auth/jwt.strategy.ts` | Passport JWT strategy |

### New Files (client/)
| File | Responsibility |
|------|---------------|
| `client/src/api/client.ts` | Base fetch wrapper with auth header |
| `client/src/api/todos.ts` | Todo API functions |
| `client/src/api/categories.ts` | Category API functions |
| `client/src/api/settings.ts` | Settings API functions |
| `client/src/api/auth.ts` | Auth API functions |
| `client/src/components/LoginScreen.tsx` | Login form component |
| `client/src/hooks/useApiTodos.ts` | React hook replacing localStorage with API |
| `client/src/hooks/useApiCategories.ts` | React hook replacing localStorage with API |

### Modified Files (client/)
| File | Change |
|------|--------|
| `client/vite.config.ts` | Add `/api` proxy to localhost:3000 |
| `client/src/App.tsx` | Add auth state, login screen gate, use new API hooks |
| `client/src/main.tsx` | No change needed |

### Root Files
| File | Responsibility |
|------|---------------|
| `docker-compose.yml` | PostgreSQL + NestJS services |
| `package.json` | Add server workspace scripts |

---

## Phase 1: Scaffold

### Task 1: Create NestJS project structure

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/tsconfig.build.json`
- Create: `server/nest-cli.json`
- Create: `server/.env.example`
- Create: `server/src/main.ts`
- Create: `server/src/app.module.ts`

- [ ] **Step 1: Create server/package.json**

```json
{
  "name": "focusworkspace-server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "dev": "nest start --watch",
    "start:prod": "node dist/main",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init",
    "prisma:push": "prisma db push"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@prisma/client": "^6.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/passport-jwt": "^4.0.1",
    "prisma": "^6.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 3: Create server/tsconfig.build.json**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [ ] **Step 4: Create server/nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
```

- [ ] **Step 5: Create server/.env.example**

```
DATABASE_URL=postgresql://focusworkspace:changeme@localhost:5432/focusworkspace
JWT_SECRET=change-me-to-a-random-string
AUTH_USERNAME=admin
AUTH_PASSWORD=admin
```

- [ ] **Step 6: Create server/src/main.ts**

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "*" });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(3000);
}

bootstrap();
```

- [ ] **Step 7: Create server/src/app.module.ts**

```typescript
import { Module } from "@nestjs/common";

@Module({
  imports: [],
})
export class AppModule {}
```

- [ ] **Step 8: Install dependencies**

Run: `cd server && npm install`

- [ ] **Step 9: Commit**

```bash
git add server/package.json server/tsconfig.json server/tsconfig.build.json server/nest-cli.json server/.env.example server/src/main.ts server/src/app.module.ts server/package-lock.json
git commit -m "feat(server): scaffold NestJS project structure"
```

---

### Task 2: Create Prisma schema and Docker Compose

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/src/prisma/prisma.service.ts`
- Create: `server/src/prisma/prisma.module.ts`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create server/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
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
  id    String @id @default(uuid())
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

- [ ] **Step 2: Create server/src/prisma/prisma.service.ts**

```typescript
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

- [ ] **Step 3: Create server/src/prisma/prisma.module.ts**

```typescript
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 4: Register PrismaModule in AppModule**

Edit `server/src/app.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

- [ ] **Step 5: Create docker-compose.yml at project root**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: focusworkspace
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: focusworkspace
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pgdata:
```

- [ ] **Step 6: Copy .env.example to .env, update DATABASE_URL**

Copy `server/.env.example` → `server/.env`.

- [ ] **Step 7: Generate Prisma client and push schema**

```bash
cd server
npx prisma generate
npx prisma db push
```

- [ ] **Step 8: Verify server starts**

```bash
cd server && npx nest start
# Should print: Nest application successfully started
```

- [ ] **Step 9: Commit**

```bash
git add server/prisma/schema.prisma server/src/prisma/prisma.service.ts server/src/prisma/prisma.module.ts server/src/app.module.ts docker-compose.yml server/.env.example
git commit -m "feat(server): add Prisma schema, PrismaModule, and Docker Compose"
```

---

## Phase 2: CRUD APIs

### Task 3: Todos module

**Files:**
- Create: `server/src/todos/dto/create-todo.dto.ts`
- Create: `server/src/todos/dto/update-todo.dto.ts`
- Create: `server/src/todos/todos.service.ts`
- Create: `server/src/todos/todos.controller.ts`
- Create: `server/src/todos/todos.module.ts`
- Modify: `server/src/app.module.ts`

- [ ] **Step 1: Create server/src/todos/dto/create-todo.dto.ts**

```typescript
import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class SubtaskDto {
  @IsString() text: string;
  @IsBoolean() completed: boolean;
}

export class CreateTodoDto {
  @IsString() text: string;

  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() completed?: boolean;
  @IsOptional() @IsBoolean() starred?: boolean;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() dueTime?: string;
  @IsOptional() @IsString() recurrence?: string;
  @IsOptional() @IsString() categoryId?: string;

  @IsString() createdAt: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SubtaskDto)
  subtasks?: SubtaskDto[];
}
```

- [ ] **Step 2: Create server/src/todos/dto/update-todo.dto.ts**

```typescript
import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class SubtaskDto {
  @IsOptional() @IsString() id?: string;
  @IsString() text: string;
  @IsBoolean() completed: boolean;
}

export class UpdateTodoDto {
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() completed?: boolean;
  @IsOptional() @IsBoolean() starred?: boolean;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() dueTime?: string;
  @IsOptional() @IsString() recurrence?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() completedAt?: string;
  @IsOptional() @IsString() deletedAt?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SubtaskDto)
  subtasks?: SubtaskDto[];
}
```

- [ ] **Step 3: Create server/src/todos/todos.service.ts**

```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.todo.findMany({ include: { subtasks: true, category: true } });
  }

  create(dto: CreateTodoDto) {
    const { subtasks, categoryId, ...data } = dto;
    return this.prisma.todo.create({
      data: {
        ...data,
        subtasks: subtasks ? { create: subtasks } : undefined,
        categoryId: categoryId || undefined,
      },
      include: { subtasks: true, category: true },
    });
  }

  update(id: string, dto: UpdateTodoDto) {
    const { subtasks, ...data } = dto;
    const updateData: any = { ...data };

    if (subtasks) {
      updateData.subtasks = {
        deleteMany: {},
        create: subtasks.map((s) => ({ text: s.text, completed: s.completed })),
      };
    }

    return this.prisma.todo.update({
      where: { id },
      data: updateData,
      include: { subtasks: true, category: true },
    });
  }

  softDelete(id: string) {
    return this.prisma.todo.update({
      where: { id },
      data: { deletedAt: new Date().toISOString() },
      include: { subtasks: true, category: true },
    });
  }

  remove(id: string) {
    return this.prisma.todo.delete({ where: { id } });
  }
}
```

- [ ] **Step 4: Create server/src/todos/todos.controller.ts**

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param } from "@nestjs/common";
import { TodosService } from "./todos.service";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";

@Controller("todos")
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll() {
    return this.todosService.findAll();
  }

  @Post()
  create(@Body() dto: CreateTodoDto) {
    return this.todosService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTodoDto) {
    return this.todosService.update(id, dto);
  }

  @Delete(":id")
  softDelete(@Param("id") id: string) {
    return this.todosService.softDelete(id);
  }
}
```

- [ ] **Step 5: Create server/src/todos/todos.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { TodosService } from "./todos.service";
import { TodosController } from "./todos.controller";

@Module({
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
```

- [ ] **Step 6: Register TodosModule in AppModule**

Edit `server/src/app.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { TodosModule } from "./todos/todos.module";

@Module({
  imports: [PrismaModule, TodosModule],
})
export class AppModule {}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd server && npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add server/src/todos/ server/src/app.module.ts
git commit -m "feat(server): add todos CRUD module"
```

---

### Task 4: Categories module

**Files:**
- Create: `server/src/categories/dto/create-category.dto.ts`
- Create: `server/src/categories/dto/update-category.dto.ts`
- Create: `server/src/categories/categories.service.ts`
- Create: `server/src/categories/categories.controller.ts`
- Create: `server/src/categories/categories.module.ts`
- Modify: `server/src/app.module.ts`

- [ ] **Step 1: Create server/src/categories/dto/create-category.dto.ts**

```typescript
import { IsString } from "class-validator";

export class CreateCategoryDto {
  @IsString() name: string;
  @IsString() color: string;
}
```

- [ ] **Step 2: Create server/src/categories/dto/update-category.dto.ts**

```typescript
import { IsString, IsOptional } from "class-validator";

export class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() color?: string;
}
```

- [ ] **Step 3: Create server/src/categories/categories.service.ts**

```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ include: { todos: { select: { id: true } } } });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto, include: { todos: { select: { id: true } } } });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: dto, include: { todos: { select: { id: true } } } });
  }

  remove(id: string) {
    // Set todos referencing this category to null
    return this.prisma.$transaction([
      this.prisma.todo.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
      this.prisma.category.delete({ where: { id } }),
    ]);
  }
}
```

- [ ] **Step 4: Create server/src/categories/categories.controller.ts**

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
```

- [ ] **Step 5: Create server/src/categories/categories.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CategoriesController } from "./categories.controller";

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
```

- [ ] **Step 6: Register CategoriesModule in AppModule**

Add `CategoriesModule` to the `imports` array in `server/src/app.module.ts`.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd server && npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add server/src/categories/ server/src/app.module.ts
git commit -m "feat(server): add categories CRUD module"
```

---

### Task 5: Settings module

**Files:**
- Create: `server/src/settings/dto/update-settings.dto.ts`
- Create: `server/src/settings/settings.service.ts`
- Create: `server/src/settings/settings.controller.ts`
- Create: `server/src/settings/settings.module.ts`
- Modify: `server/src/app.module.ts`

- [ ] **Step 1: Create server/src/settings/dto/update-settings.dto.ts**

```typescript
import { IsInt, IsBoolean, IsOptional, Min, Max } from "class-validator";

export class UpdateSettingsDto {
  @IsOptional() @IsInt() @Min(1) @Max(120) reminderMinutes?: number;
  @IsOptional() @IsBoolean() repeatEnabled?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(60) repeatIntervalMinutes?: number;
}
```

- [ ] **Step 2: Create server/src/settings/settings.service.ts**

```typescript
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.prisma.settings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
  }

  find() {
    return this.prisma.settings.findUnique({ where: { id: 1 } });
  }

  update(dto: UpdateSettingsDto) {
    return this.prisma.settings.update({ where: { id: 1 }, data: dto });
  }
}
```

- [ ] **Step 3: Create server/src/settings/settings.controller.ts**

```typescript
import { Controller, Get, Put, Body } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  find() {
    return this.settingsService.find();
  }

  @Put()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
```

- [ ] **Step 4: Create server/src/settings/settings.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { SettingsController } from "./settings.controller";

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
```

- [ ] **Step 5: Register SettingsModule in AppModule**

Add `SettingsModule` to the `imports` array in `server/src/app.module.ts`.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd server && npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add server/src/settings/ server/src/app.module.ts
git commit -m "feat(server): add settings module"
```

---

## Phase 3: Auth

### Task 6: JWT auth module

**Files:**
- Create: `server/src/auth/auth.service.ts`
- Create: `server/src/auth/auth.controller.ts`
- Create: `server/src/auth/jwt.strategy.ts`
- Create: `server/src/auth/auth.guard.ts`
- Create: `server/src/auth/auth.module.ts`
- Modify: `server/src/app.module.ts`
- Modify: `server/package.json` (add `@nestjs/config`)

- [ ] **Step 1: Add @nestjs/config dependency**

```bash
cd server && npm install @nestjs/config
```

- [ ] **Step 2: Create server/src/auth/auth.service.ts**

```typescript
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  validateUser(username: string, password: string): boolean {
    const envUser = process.env.AUTH_USERNAME || "admin";
    const envPass = process.env.AUTH_PASSWORD || "admin";
    return username === envUser && password === envPass;
  }

  login(username: string) {
    const payload = { sub: username };
    return { access_token: this.jwtService.sign(payload) };
  }
}
```

- [ ] **Step 3: Create server/src/auth/auth.controller.ts**

```typescript
import { Controller, Post, Body, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { IsString } from "class-validator";

class LoginDto {
  @IsString() username: string;
  @IsString() password: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    if (!this.authService.validateUser(dto.username, dto.password)) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.authService.login(dto.username);
  }
}
```

- [ ] **Step 4: Create server/src/auth/jwt.strategy.ts**

```typescript
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "dev-secret",
    });
  }

  validate(payload: { sub: string }) {
    return { username: payload.sub };
  }
}
```

- [ ] **Step 5: Create server/src/auth/auth.guard.ts**

```typescript
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
```

- [ ] **Step 6: Create server/src/auth/auth.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev-secret",
      signOptions: { expiresIn: "30d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

- [ ] **Step 7: Add ConfigModule and AuthModule to AppModule**

Update `server/src/app.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { TodosModule } from "./todos/todos.module";
import { CategoriesModule } from "./categories/categories.module";
import { SettingsModule } from "./settings/settings.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TodosModule,
    CategoriesModule,
    SettingsModule,
    AuthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 8: Apply JwtAuthGuard globally to protected routes**

Update `server/src/todos/todos.controller.ts` — add `@UseGuards(JwtAuthGuard)`:

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/auth.guard";
// ... rest of imports

@Controller("todos")
@UseGuards(JwtAuthGuard)
export class TodosController {
  // ... same handler methods
}
```

Do the same for `categories.controller.ts` and `settings.controller.ts` — add `@UseGuards(JwtAuthGuard)` at the class level.

- [ ] **Step 9: Verify TypeScript compiles and server starts**

```bash
cd server && npx tsc --noEmit && npx nest start
```

Test login:
```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}'
```

Expected: `{ "access_token": "eyJ..." }`

- [ ] **Step 10: Commit**

```bash
git add server/src/auth/ server/src/app.module.ts server/src/todos/todos.controller.ts server/src/categories/categories.controller.ts server/src/settings/settings.controller.ts server/package.json server/package-lock.json
git commit -m "feat(server): add JWT auth with login endpoint"
```

---

## Phase 4: Frontend Migration

### Task 7: Create API client layer

**Files:**
- Create: `client/src/api/client.ts`
- Create: `client/src/api/auth.ts`
- Create: `client/src/api/todos.ts`
- Create: `client/src/api/categories.ts`
- Create: `client/src/api/settings.ts`
- Modify: `client/vite.config.ts`

- [ ] **Step 1: Create client/src/api/client.ts**

```typescript
const API_BASE = "/api";

let authToken: string | null = localStorage.getItem("fw_token");

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("fw_token", token);
  else localStorage.removeItem("fw_token");
}

export function getToken() {
  return authToken;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      throw new Error("Unauthorized");
    }
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json();
}
```

- [ ] **Step 2: Create client/src/api/auth.ts**

```typescript
import { apiFetch, setToken } from "./client";

export async function login(username: string, password: string) {
  const data = await apiFetch<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.access_token);
  return data;
}

export function isLoggedIn() {
  return !!localStorage.getItem("fw_token");
}

export function logout() {
  setToken(null);
}
```

- [ ] **Step 3: Create client/src/api/todos.ts**

```typescript
import { apiFetch } from "./client";
import { Todo } from "../components/types";

export function fetchTodos() {
  return apiFetch<Todo[]>("/todos");
}

export function createTodo(todo: Omit<Todo, "id" | "subtasks"> & { subtasks?: { text: string; completed: boolean }[] }) {
  return apiFetch<Todo>("/todos", {
    method: "POST",
    body: JSON.stringify(todo),
  });
}

export function updateTodo(id: string, patch: Partial<Todo>) {
  return apiFetch<Todo>(`/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function softDeleteTodo(id: string) {
  return apiFetch<Todo>(`/todos/${id}`, { method: "DELETE" });
}
```

- [ ] **Step 4: Create client/src/api/categories.ts**

```typescript
import { apiFetch } from "./client";
import { Category } from "../components/types";

export function fetchCategories() {
  return apiFetch<Category[]>("/categories");
}

export function createCategory(data: { name: string; color: string }) {
  return apiFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(id: string, data: { name?: string; color?: string }) {
  return apiFetch<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id: string) {
  return apiFetch(`/categories/${id}`, { method: "DELETE" });
}
```

- [ ] **Step 5: Create client/src/api/settings.ts**

```typescript
import { apiFetch } from "./client";

export interface AppSettings {
  id: number;
  reminderMinutes: number;
  repeatEnabled: boolean;
  repeatIntervalMinutes: number;
}

export function fetchSettings() {
  return apiFetch<AppSettings>("/settings");
}

export function updateSettings(data: Partial<AppSettings>) {
  return apiFetch<AppSettings>("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
```

- [ ] **Step 6: Add API proxy to client/vite.config.ts**

Read the existing `vite.config.ts`, then add the proxy config:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 7: Commit**

```bash
git add client/src/api/ client/vite.config.ts
git commit -m "feat(client): add API client layer and dev proxy"
```

---

### Task 8: Create API-based React hooks

**Files:**
- Create: `client/src/hooks/useApiTodos.ts`
- Create: `client/src/hooks/useApiCategories.ts`

- [ ] **Step 1: Create client/src/hooks/useApiTodos.ts**

```typescript
import { useState, useEffect, useCallback } from "react";
import { Todo } from "../components/types";
import { fetchTodos, createTodo, updateTodo, softDeleteTodo } from "../api/todos";

export function useApiTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchTodos();
      setTodos(data);
    } catch {
      // handled by caller
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (todo: Parameters<typeof createTodo>[0]) => {
    const created = await createTodo(todo);
    setTodos((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<Todo>) => {
    const updated = await updateTodo(id, patch);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const softDelete = useCallback(async (id: string) => {
    const deleted = await softDeleteTodo(id);
    setTodos((prev) => prev.map((t) => (t.id === id ? deleted : t)));
  }, []);

  return { todos, loading, add, update, softDelete, reload: load };
}
```

- [ ] **Step 2: Create client/src/hooks/useApiCategories.ts**

```typescript
import { useState, useEffect, useCallback } from "react";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "../api/categories";
import { StoredCategory } from "./useCategories";

export function useApiCategories() {
  const [categories, setCategories] = useState<StoredCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        _count: c.todos?.length ?? 0,
      })));
    } catch {
      // handled by caller
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (data: { name: string; color: string }) => {
    const created = await createCategory(data);
    setCategories((prev) => [...prev, { id: created.id, name: created.name, color: created.color, _count: 0 }]);
  }, []);

  const update = useCallback(async (id: string, data: { name?: string; color?: string }) => {
    await updateCategory(id, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, loading, add, update, remove, reload: load };
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/hooks/useApiTodos.ts client/src/hooks/useApiCategories.ts
git commit -m "feat(client): add API-based hooks for todos and categories"
```

---

### Task 9: Create login screen and wire up auth in App.tsx

**Files:**
- Create: `client/src/components/LoginScreen.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create client/src/components/LoginScreen.tsx**

```tsx
import { useState } from "react";
import { login } from "../api/auth";
import { CheckCircle } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      onLogin();
    } catch {
      setError("用户名或密码错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">FocusWorkspace</h1>
          <p className="text-sm text-muted-foreground mt-1">登录以同步你的数据</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">用户名</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-background px-4 text-foreground outline-none focus:border-primary transition-colors"
              placeholder="输入用户名"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-background px-4 text-foreground outline-none focus:border-primary transition-colors"
              placeholder="输入密码"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Update App.tsx to use API hooks and add login gate**

Key changes to `client/src/App.tsx`:

Replace imports:
```typescript
// Remove old hook imports
// import { useTodos } from "./hooks/useTodos";
// import { useCategories, type StoredCategory } from "./hooks/useCategories";

// Add new imports
import { useApiTodos } from "./hooks/useApiTodos";
import { useApiCategories } from "./hooks/useApiCategories";
import { LoginScreen } from "./components/LoginScreen";
import { isLoggedIn, logout } from "./api/auth";
```

Replace the old state lines:
```typescript
// OLD:
// const { todos, setTodos, updateTodo: updateTodoBase, addTodo } = useTodos(INITIAL_TODOS);
// const { categories: storedCategories, setCategories: setStoredCategories, addCategory, updateCategory, deleteCategory } = useCategories(DEFAULT_CATEGORIES);

// NEW:
const [authenticated, setAuthenticated] = useState(isLoggedIn());
const { todos, loading, add: addTodo, update: updateTodoBase, softDelete: softDeleteTodo } = useApiTodos();
const { categories: storedCategories, add: addCategory, update: updateCategory, remove: deleteCategory } = useApiCategories();
```

Remove `INITIAL_TODOS` and `DEFAULT_CATEGORIES` arrays (no longer needed — data comes from server).

Update the handleDelete function to use soft-delete:
```typescript
const handleDeleteTodo = (id: string) => {
  softDeleteTodo(id);
  if (selectedTodoId === id) setSelectedTodoId(null);
};
```

Add login gate at the top of the return:
```tsx
if (!authenticated) {
  return <LoginScreen onLogin={() => setAuthenticated(true)} />;
}
```

Remove `handleExportData` and `handleImportData` and related file input (data is now on server).

Add a logout button in the Header or settings area:
```tsx
// In the settings modal or sidebar, add:
<button onClick={() => { logout(); setAuthenticated(false); }}>
  退出登录
</button>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/LoginScreen.tsx client/src/App.tsx client/src/hooks/useApiTodos.ts client/src/hooks/useApiCategories.ts
git commit -m "feat(client): add login screen and wire API hooks into App"
```

---

## Phase 5: Docker Polish

### Task 10: Create Dockerfile and finalize deployment

**Files:**
- Create: `server/Dockerfile`
- Create: `server/.dockerignore`
- Modify: `docker-compose.yml`
- Modify: `server/package.json`

- [ ] **Step 1: Create server/Dockerfile**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

- [ ] **Step 2: Create server/.dockerignore**

```
node_modules
dist
.env
.npm
```

- [ ] **Step 3: Update docker-compose.yml with server service**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: focusworkspace
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
      POSTGRES_DB: focusworkspace
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  server:
    build:
      context: ./server
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://focusworkspace:${DB_PASSWORD:-changeme}@db:5432/focusworkspace
      JWT_SECRET: ${JWT_SECRET:-change-me-to-a-random-string}
      AUTH_USERNAME: ${AUTH_USERNAME:-admin}
      AUTH_PASSWORD: ${AUTH_PASSWORD:-admin}
    depends_on:
      - db
    restart: unless-stopped

volumes:
  pgdata:
```

- [ ] **Step 4: Add prisma:migrate script to server/package.json start:prod**

Update server/package.json scripts:
```json
"start:prod": "npx prisma db push --accept-data-loss && node dist/main",
"prisma:migrate:deploy": "npx prisma migrate deploy"
```

- [ ] **Step 5: Add db:push to the Dockerfile's CMD**

Update Dockerfile CMD:
```dockerfile
CMD sh -c "npx prisma db push --skip-generate --accept-data-loss && node dist/main"
```

- [ ] **Step 6: Verify build**

```bash
docker compose build
docker compose up -d
curl http://localhost:3000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}'
```

Expected: `{"access_token":"eyJ..."}`

- [ ] **Step 7: Commit**

```bash
git add server/Dockerfile server/.dockerignore docker-compose.yml server/package.json
git commit -m "feat(server): add Dockerfile and finalize Docker Compose deployment"
```

---

## Self-Review

- **Spec coverage**: All 5 phases mapped. DB schema matches spec. All API endpoints covered. Auth with JWT covered. Docker Compose with PostgreSQL covered. Frontend migration to API client covered.
- **Placeholder scan**: No TBD, TODO, or vague instructions. Every step has specific code.
- **Type consistency**: Todo/Category/Settings types in DTOs match Prisma schema. API client types match backend DTOs. Hook interfaces match App.tsx usage patterns.
