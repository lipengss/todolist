# Captcha + Approval Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SVG captcha to login flow and extract registration approval into a standalone table page.

**Architecture:** Backend generates captcha via `svg-captcha` npm package, stores answers in an in-memory Map with 5-min expiry, validates before credentials check. Frontend adds a new `ApprovalPage` component as a first-class view (like Calendar/Stats), accessible via sidebar entry visible only to admin users.

**Tech Stack:** NestJS, svg-captcha, React 18, TypeScript, lucide-react

---

### Task 1: Install svg-captcha

**Files:**
- Modify: `server/package.json` (via install)

- [ ] **Step 1: Install svg-captcha**

```bash
cd server && pnpm add svg-captcha
```

- [ ] **Step 2: Commit**

```bash
git add server/package.json server/pnpm-lock.yaml
git commit -m "chore: add svg-captcha dependency"
```

---

### Task 2: Captcha backend — AuthService

**Files:**
- Modify: `server/src/auth/auth.service.ts`

- [ ] **Step 1: Add captcha storage and generation to AuthService**

Read `server/src/auth/auth.service.ts`. Add the following inside the `AuthService` class, before `onModuleInit`:

```typescript
import { randomUUID } from "crypto";
import * as svgCaptcha from "svg-captcha";

private captchaStore = new Map<string, { answer: string; expiresAt: number }>();

generateCaptcha(): { svg: string; token: string } {
  // Clean expired entries
  const now = Date.now();
  for (const [key, entry] of this.captchaStore) {
    if (entry.expiresAt < now) this.captchaStore.delete(key);
  }

  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: "0o1il",
    noise: 2,
    color: true,
    background: "#ffffff",
  });

  const token = randomUUID();
  this.captchaStore.set(token, {
    answer: captcha.text.toLowerCase(),
    expiresAt: now + 5 * 60 * 1000,
  });

  return { svg: captcha.data, token };
}

validateCaptcha(token: string, text: string): boolean {
  const entry = this.captchaStore.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    this.captchaStore.delete(token);
    return false;
  }
  this.captchaStore.delete(token);
  return entry.answer === text.toLowerCase().trim();
}
```

- [ ] **Step 2: Build and verify**

```bash
cd server && pnpm build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/auth/auth.service.ts
git commit -m "feat: add captcha generation and validation to AuthService"
```

---

### Task 3: Captcha backend — Controller endpoints

**Files:**
- Modify: `server/src/auth/auth.controller.ts`

- [ ] **Step 1: Add GET /captcha endpoint and modify POST /login**

Read `server/src/auth/auth.controller.ts`. Add these changes:

Add a new DTO class inside the file (near the other DTOs):

```typescript
class LoginWithCaptchaDto {
  @IsString() username: string;
  @IsString() password: string;
  @IsString() captchaToken: string;
  @IsString() captchaText: string;
}
```

Add the `Get` import at the top:

```typescript
import { Controller, Post, Get, Delete, Body, Param, UnauthorizedException, BadRequestException, UseGuards, Request, Req } from "@nestjs/common";
```

Add these two methods inside `AuthController`:

```typescript
@Get("captcha")
getCaptcha() {
  return this.authService.generateCaptcha();
}
```

Replace the existing `login` method:

```typescript
@Post("login")
async login(@Body() dto: LoginWithCaptchaDto) {
  // Validate captcha first
  const captchaValid = this.authService.validateCaptcha(dto.captchaToken, dto.captchaText);
  if (!captchaValid) {
    throw new BadRequestException("验证码错误或已过期");
  }

  const { valid, role } = await this.authService.validateUser(dto.username, dto.password);
  if (!valid) {
    throw new UnauthorizedException("用户名或密码错误");
  }
  const pendingReq = await this.authService.getRegistrations();
  const myReq = pendingReq.find(r => r.username === dto.username && r.status === "pending");
  if (myReq) {
    throw new UnauthorizedException("注册申请审批中，请等待管理员通过");
  }
  return this.authService.login(dto.username);
}
```

Delete the old `LoginDto` class (it's replaced by `LoginWithCaptchaDto`).

- [ ] **Step 2: Build and verify**

```bash
cd server && pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add server/src/auth/auth.controller.ts
git commit -m "feat: add captcha endpoint and validate captcha in login"
```

---

### Task 4: Captcha frontend — API client

**Files:**
- Modify: `src/api/auth.ts`

- [ ] **Step 1: Add fetchCaptcha function**

Read `src/api/auth.ts`. Add this function at the end of the file:

```typescript
export async function fetchCaptcha() {
  return apiFetch<{ svg: string; token: string }>("/auth/captcha");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/auth.ts
git commit -m "feat: add fetchCaptcha API function"
```

---

### Task 5: Captcha frontend — LoginScreen UI

**Files:**
- Modify: `src/components/LoginScreen.tsx`

- [ ] **Step 1: Rewrite LoginScreen with captcha**

Read `src/components/LoginScreen.tsx`. Replace the entire file content:

```tsx
import { useState, useEffect, useRef } from "react";
import { login, register, fetchCaptcha } from "../api/auth";
import { CheckCircle } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const lastClickRef = useRef(0);

  const loadCaptcha = async () => {
    try {
      const data = await fetchCaptcha();
      setCaptchaSvg(data.svg);
      setCaptchaToken(data.token);
      setCaptchaText("");
    } catch {
      // silent
    }
  };

  useEffect(() => { loadCaptcha(); }, []);

  const handleCaptchaClick = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 500) return;
    lastClickRef.current = now;
    loadCaptcha();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password);
        setSubmitted(true);
      } else {
        await login(username, password);
        onLogin();
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("验证码")) {
        setError("验证码错误或已过期");
        loadCaptcha();
      } else if (msg.includes("审批中")) {
        setError("你的申请正在审批中，请等待管理员通过");
      } else if (msg.includes("400")) {
        setError("你已提交过申请，请等待审批");
      } else if (msg.includes("401")) {
        setError("用户名或密码错误");
      } else {
        setError(isRegister ? "注册失败，请重试" : "登录失败，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-6 text-center">
          <div className="w-12 h-12 bg-chart-3 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">申请已提交</h1>
          <p className="text-sm text-muted-foreground">
            你的注册申请已提交，等待管理员审批后即可登录。
          </p>
          <button
            onClick={() => { setIsRegister(false); setSubmitted(false); setUsername(""); setPassword(""); }}
            className="text-sm text-primary hover:underline"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">FocusWorkspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRegister ? "创建账号，等待管理员审批" : "登录以同步你的数据"}
          </p>
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
              placeholder="输入用户名（至少2个字符）"
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
              placeholder={isRegister ? "输入密码（至少3个字符）" : "输入密码"}
            />
          </div>

          {!isRegister && captchaSvg && (
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">验证码</label>
              <div className="flex gap-3 items-center">
                <input
                  value={captchaText}
                  onChange={(e) => setCaptchaText(e.target.value)}
                  className="flex-1 h-11 rounded-lg border border-border bg-background px-4 text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="输入验证码"
                  maxLength={4}
                />
                <div
                  onClick={handleCaptchaClick}
                  className="flex-shrink-0 w-[82px] h-[42px] rounded-lg border border-border hover:border-primary cursor-pointer transition-colors overflow-hidden bg-white flex items-center justify-center"
                  title="看不清？点击图片刷新"
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">看不清？点击图片刷新</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !username || !password || (!isRegister && !captchaText)}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? (isRegister ? "提交中..." : "登录中...") : (isRegister ? "提交申请" : "登录")}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRegister ? "已有账号？去登录" : "没有账号？提交申请"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Build frontend to verify**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/LoginScreen.tsx
git commit -m "feat: add captcha UI to login screen"
```

---

### Task 6: Update login API to send captcha fields

**Files:**
- Modify: `src/api/auth.ts`

- [ ] **Step 1: Update login function signature**

Read `src/api/auth.ts`. Replace the `login` function:

```typescript
export async function login(username: string, password: string) {
```

With:

```typescript
export async function login(username: string, password: string, captchaToken?: string, captchaText?: string) {
```

And inside the function, replace the body with:

```typescript
body: JSON.stringify({ username, password, ...(captchaToken ? { captchaToken, captchaText } : {}) }),
```

- [ ] **Step 2: Commit**

```bash
git add src/api/auth.ts
git commit -m "feat: add captcha fields to login API function"
```

---

### Task 7: Update LoginScreen to pass captcha to login()

**Files:**
- Modify: `src/components/LoginScreen.tsx`

- [ ] **Step 1: Pass captcha data in login call**

In `handleSubmit`, change:

```typescript
await login(username, password);
```

To:

```typescript
await login(username, password, captchaToken, captchaText);
```

- [ ] **Step 2: Build and verify**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LoginScreen.tsx
git commit -m "fix: pass captcha token and text to login API call"
```

---

### Task 8: Add getUserRole helper

**Files:**
- Modify: `src/api/auth.ts`

- [ ] **Step 1: Add getUserRole function**

Add this function to `src/api/auth.ts`:

```typescript
export function getUserRole(): string | null {
  const token = localStorage.getItem("fw_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "user";
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/auth.ts
git commit -m "feat: add getUserRole helper to decode JWT role"
```

---

### Task 9: Add "approvals" to FilterType

**Files:**
- Modify: `src/components/types.ts`

- [ ] **Step 1: Extend FilterType**

Read `src/components/types.ts`. Change line 27 from:

```typescript
export type FilterType = "calendar" | "today" | "planned" | "inbox" | "all" | "completed" | "trash" | "stats";
```

To:

```typescript
export type FilterType = "calendar" | "today" | "planned" | "inbox" | "all" | "completed" | "trash" | "stats" | "approvals";
```

- [ ] **Step 2: Commit**

```bash
git add src/components/types.ts
git commit -m "feat: add approvals filter type"
```

---

### Task 10: Create ApprovalPage component

**Files:**
- Create: `src/components/ApprovalPage.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/ApprovalPage.tsx`:

```tsx
import { useState, useEffect } from "react";
import { getRegistrations, approveRegistration, rejectRegistration, deleteRegistration } from "../api/auth";
import { Users, CheckCircle, XCircle, Clock, Trash2, Globe } from "lucide-react";

interface Reg {
  id: string;
  username: string;
  status: string;
  ip: string;
  createdAt: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ApprovalPage() {
  const [registrations, setRegistrations] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await getRegistrations();
      // Sort: pending first, then by createdAt desc
      list.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
      setRegistrations(list);
    } catch {
      // not admin or error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingCount = registrations.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">用户审批</h2>
          <p className="text-sm text-muted-foreground mt-1">
            共 {registrations.length} 条记录
            {pendingCount > 0 && <span>，待审批 <span className="text-chart-4 font-medium">{pendingCount}</span> 人</span>}
          </p>
        </div>
        <button
          onClick={load}
          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-card transition-colors"
        >
          刷新
        </button>
      </div>

      {registrations.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">暂无注册申请</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">用户名</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">状态</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">IP 地址</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">注册时间</th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((req) => (
                <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{req.username}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      req.status === "approved" ? "bg-chart-3/20 text-chart-3" :
                      req.status === "rejected" ? "bg-destructive/20 text-destructive" :
                      "bg-chart-4/20 text-chart-4"
                    }`}>
                      {req.status === "approved" ? <CheckCircle className="w-3 h-3" /> :
                       req.status === "rejected" ? <XCircle className="w-3 h-3" /> :
                       <Clock className="w-3 h-3" />}
                      {req.status === "approved" ? "已通过" : req.status === "rejected" ? "已拒绝" : "待审批"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {req.ip || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTime(req.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={async () => { await approveRegistration(req.id); load(); }}
                            className="p-1.5 rounded hover:bg-chart-3/20 text-chart-3 transition-colors"
                            title="通过"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => { await rejectRegistration(req.id); load(); }}
                            className="p-1.5 rounded hover:bg-destructive/20 text-destructive transition-colors"
                            title="拒绝"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={async () => { await deleteRegistration(req.id); load(); }}
                          className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ApprovalPage.tsx
git commit -m "feat: create ApprovalPage with table layout"
```

---

### Task 11: Add approvals sidebar entry (admin only)

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Add approvals to Sidebar**

Read `src/components/Sidebar.tsx`. Make these changes:

Add `Users` to the lucide import (line 1):

```typescript
import { BarChart3, CalendarDays, CheckCircle, CirclePlus, Clock, FileText, Pencil, Plus, Settings, SquarePen, Star, Trash2, Plane, Users } from "lucide-react";
```

Add prop `pendingApprovalCount` and `userRole` to the interface (after `stats`):

```typescript
interface SidebarProps {
  // ... existing props ...
  stats: { ... };
  pendingApprovalCount?: number;
  userRole?: string | null;
}
```

Add `pendingApprovalCount` to the destructured props:

```typescript
}: SidebarProps) {
```

Update the destructuring to include the new props:

```typescript
export function Sidebar({
  activeFilter, onFilterChange, activeCategory, onCategoryChange,
  onCreateTodo, onCreateCategory, onEditCategory, onDeleteCategory,
  onOpenSettings, categories, stats,
  pendingApprovalCount = 0,
  userRole = null,
}: SidebarProps) {
```

In the bottom views section, add the approvals entry BEFORE the existing bottomViews. Insert this right after `</section>` for categories and before `<section className="space-y-1 pt-4 border-t border-border">`:

```tsx
          {userRole === "admin" && (
            <section className="space-y-1">
              <button
                type="button"
                onClick={() => onFilterChange("approvals")}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeFilter === "approvals" ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span>用户审批</span>
                </div>
                {pendingApprovalCount > 0 && (
                  <span className="bg-chart-4 text-chart-4-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {pendingApprovalCount}
                  </span>
                )}
              </button>
            </section>
          )}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add approvals sidebar entry (admin only)"
```

---

### Task 12: Wire everything in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports and state**

Read `src/App.tsx`. Replace the `RegistrationManager` import:

```typescript
// Remove: import { RegistrationManager } from "./components/RegistrationManager";
// Add:
import { ApprovalPage } from "./components/ApprovalPage";
```

Add `getUserRole` to the auth import (line 30):

```typescript
import { isLoggedIn, logout, getUserRole } from "./api/auth";
```

Delete the import for `RegistrationManager` and `Users` from lucide-react if only used there.

After the existing `useState` declarations (around line 92), add:

```typescript
const userRole = getUserRole();
```

Add pending approvals state:

```typescript
const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
```

- [ ] **Step 2: Add approvals view rendering**

In the view rendering area (around line 390), add an approvals branch AFTER the stats branch. Find:

```typescript
) : filter === "stats" ? (
```

Add BEFORE this line:

```typescript
) : filter === "approvals" ? (
  <div className="flex-1 min-w-0">
    <ApprovalPage />
  </div>
```

- [ ] **Step 3: Pass props to Sidebar**

Find where `<Sidebar` is rendered. Add the new props:

```tsx
<Sidebar
  // ... existing props ...
  pendingApprovalCount={pendingApprovalCount}
  userRole={userRole}
/>
```

- [ ] **Step 4: Remove RegistrationManager from settings modal**

Find the settings `Modal` (around line 691). Remove the line:

```tsx
<RegistrationManager />
```

- [ ] **Step 5: Handle empty filter case**

Add "approvals" to the filter checks. After the filter handling logic, ensure approvals view doesn't show stats cards or quick add bar:

In the conditional rendering after `filter === "stats"`, our new `filter === "approvals"` branch already returns early, so no StatsCards/QuickAddBar will render.

- [ ] **Step 6: Build and verify**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire ApprovalPage, sidebar approvals entry, remove old RegistrationManager from settings"
```

---

### Task 13: Delete RegistrationManager

**Files:**
- Delete: `src/components/RegistrationManager.tsx`

- [ ] **Step 1: Delete the file and commit**

```bash
git rm src/components/RegistrationManager.tsx
git commit -m "refactor: remove RegistrationManager (replaced by ApprovalPage)"
```

---

### Task 14: Add pending count fetching to ApprovalPage and sync to Sidebar

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Load pending count on mount for admin**

In `App.tsx`, add a `useEffect` to fetch pending approval count for the sidebar badge. After the existing state declarations, add:

```typescript
import { getRegistrations } from "./api/auth";
```

Then in the component body, after the login gate, add:

```typescript
useEffect(() => {
  if (userRole === "admin") {
    getRegistrations().then(list => {
      setPendingApprovalCount(list.filter(r => r.status === "pending").length);
    }).catch(() => {});
  }
}, [userRole, authenticated]);
```

- [ ] **Step 2: Build and verify**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: fetch pending approval count for sidebar badge"
```

---

### Task 15: End-to-end verification

- [ ] **Step 1: Start backend and test captcha endpoint**

```bash
cd server && pnpm dev
```

Run: `curl http://localhost:3000/api/auth/captcha`
Expected: JSON with `{ svg, token }` where svg contains `<svg` tag.

- [ ] **Step 2: Test login with captcha**

```bash
# First get a captcha
CAPTCHA=$(curl -s http://localhost:3000/api/auth/captcha)

# Extract token and try login (manual test — open in browser is better)
```

Manual test: Open `http://localhost:5173`, try to log in. Verify:
- Captcha image appears on login page
- Clicking captcha image refreshes it
- Login without captcha shows error
- Login with captcha works

- [ ] **Step 3: Test approval table**

Manual test: Log in as admin, verify:
- "用户审批" appears in sidebar with pending count badge
- Clicking it shows the table page
- Approve/reject/delete buttons work
- Settings modal no longer shows RegistrationManager

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final adjustments after e2e verification"
git push
```
