# Guest Mode + Defaults + Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement guest browsing mode with modal login, default categories for new users, and storage usage display.

**Architecture:** Remove the hard auth gate in App.tsx, wrap write actions with a `requireAuth` utility that opens a login modal for unauthenticated users. Convert LoginScreen into a reusable LoginModal component. Backend adds default categories on user approval and a GET /me endpoint for storage stats.

**Tech Stack:** NestJS, Prisma, React 18, TypeScript, Tailwind CSS

---

### Task 1: Backend — Default categories + storageUsed field

**Files:**
- Modify: `server/prisma/schema.prisma`
- Modify: `server/src/auth/auth.service.ts`

- [ ] **Step 1: Add storageUsed to User model**

Read `server/prisma/schema.prisma`. Add to the `User` model:

```prisma
storageUsed Int @default(0)
```

Full User model becomes:
```prisma
model User {
  id          String   @id @default(uuid())
  username    String   @unique
  password    String
  createdAt   String   @default("")
  role        String   @default("user")
  storageUsed Int      @default(0)
}
```

- [ ] **Step 2: Update approveRegistration to create default categories**

Read `server/src/auth/auth.service.ts`. Find `approveRegistration()`. After the user creation line, add default categories:

```typescript
async approveRegistration(id: string) {
  const req = await this.prisma.registrationRequest.findUnique({ where: { id } });
  if (!req || req.status !== "pending") return false;
  await this.prisma.user.create({
    data: { username: req.username, password: req.password, createdAt: new Date().toISOString() },
  });
  await this.prisma.registrationRequest.update({ where: { id }, data: { status: "approved" } });

  // Create default categories for new user
  const defaultCategories = [
    { name: "工作", color: "bg-chart-1" },
    { name: "学习", color: "bg-chart-2" },
    { name: "生活", color: "bg-chart-3" },
    { name: "健康", color: "bg-chart-4" },
  ];
  for (const cat of defaultCategories) {
    await this.prisma.category.create({
      data: { name: cat.name, color: cat.color },
    });
  }

  return true;
}
```

- [ ] **Step 3: Push schema and build**

```bash
cd server && npx prisma db push --skip-generate && pnpm build
```

Expected: Schema pushes successfully, build passes.

- [ ] **Step 4: Commit**

```bash
git add server/prisma/schema.prisma server/src/auth/auth.service.ts
git commit -m "feat: add default categories on user approval + storageUsed field"
```

---

### Task 2: Backend — GET /me endpoint

**Files:**
- Modify: `server/src/auth/auth.service.ts`
- Modify: `server/src/auth/auth.controller.ts`

- [ ] **Step 1: Add getUserInfo to AuthService**

Add this method to `AuthService`:

```typescript
async getUserInfo(username: string) {
  const user = await this.prisma.user.findUnique({ where: { username } });
  if (!user) return null;
  return {
    username: user.username,
    role: user.role,
    storageUsed: user.storageUsed,
    storageLimit: 1073741824, // 1GB
  };
}
```

- [ ] **Step 2: Add GET /me endpoint to AuthController**

Add this method to `AuthController`:

```typescript
@Get("me")
@UseGuards(JwtAuthGuard)
async me(@Request() req: any) {
  const info = await this.authService.getUserInfo(req.user.username);
  if (!info) throw new UnauthorizedException("用户不存在");
  return info;
}
```

- [ ] **Step 3: Build**

```bash
cd server && pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add server/src/auth/auth.service.ts server/src/auth/auth.controller.ts
git commit -m "feat: add GET /me endpoint returning user info + storage"
```

---

### Task 3: Frontend — Add getMe API function

**Files:**
- Modify: `src/api/auth.ts`

- [ ] **Step 1: Add getMe function**

Add to `src/api/auth.ts`:

```typescript
export interface UserInfo {
  username: string;
  role: string;
  storageUsed: number;
  storageLimit: number;
}

export async function getMe() {
  return apiFetch<UserInfo>("/auth/me");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/auth.ts
git commit -m "feat: add getMe API function for user info + storage"
```

---

### Task 4: Frontend — Convert LoginScreen to LoginModal

**Files:**
- Modify: `src/components/LoginScreen.tsx`

- [ ] **Step 1: Rename and convert to Modal-based component**

Replace the entire `LoginScreen.tsx` with a `LoginModal` version. The component should:
- Accept `open`, `onClose`, `onLogin` props
- Render as a Modal when `open` is true
- Keep ALL existing functionality: login/register toggle, slider captcha, registration submission
- Backdrop click closes modal (only when not loading)
- The outer wrapper changes from full-screen to a Modal

```tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { login, register, fetchCaptcha } from "../api/auth";
import { CheckCircle, ArrowRight, X } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sliderToken, setSliderToken] = useState("");
  const [sliderDone, setSliderDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [thumbLeft, setThumbLeft] = useState(0);

  const loadCaptcha = async () => {
    try {
      const data = await fetchCaptcha();
      setSliderToken(data.token);
      setThumbLeft(0);
      setSliderDone(false);
    } catch {}
  };

  useEffect(() => { if (open) { loadCaptcha(); setError(""); setIsRegister(false); setSubmitted(false); } }, [open]);

  const maxTravel = () => {
    const track = trackRef.current;
    if (!track) return 200;
    return track.clientWidth - 44;
  };

  const onStart = useCallback((clientX: number) => {
    if (sliderDone) return;
    dragging.current = true;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left - 22;
    setThumbLeft(Math.max(0, Math.min(x, maxTravel())));
  }, [sliderDone]);

  const onMove = useCallback((clientX: number) => {
    if (!dragging.current || sliderDone) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left - 22;
    const pos = Math.max(0, Math.min(x, maxTravel()));
    setThumbLeft(pos);
    if (pos >= maxTravel() - 2) {
      dragging.current = false;
      setThumbLeft(maxTravel());
      setSliderDone(true);
    }
  }, [sliderDone]);

  const onEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!sliderDone) setThumbLeft(0);
  }, [sliderDone]);

  useEffect(() => {
    const mm = (e: MouseEvent) => onMove(e.clientX);
    const mu = () => onEnd();
    const tm = (e: TouchEvent) => onMove(e.touches[0].clientX);
    const te = () => onEnd();
    document.addEventListener("mousemove", mm);
    document.addEventListener("mouseup", mu);
    document.addEventListener("touchmove", tm);
    document.addEventListener("touchend", te);
    return () => {
      document.removeEventListener("mousemove", mm);
      document.removeEventListener("mouseup", mu);
      document.removeEventListener("touchmove", tm);
      document.removeEventListener("touchend", te);
    };
  }, [onMove, onEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password);
        setSubmitted(true);
      } else {
        await login(username, password, sliderToken);
        onLogin();
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("验证码")) {
        setError("验证码错误或已过期，请重新滑动");
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={() => { if (!loading) onClose(); }} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-8 mx-4 z-10">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 bg-chart-3 rounded-xl flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">申请已提交</h2>
            <p className="text-sm text-muted-foreground">等待管理员审批后即可登录。</p>
            <button onClick={() => { setSubmitted(false); setIsRegister(false); }} className="text-sm text-primary hover:underline">
              返回登录
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {isRegister ? "提交注册申请" : "登录"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isRegister ? "创建账号，等待管理员审批" : "登录后同步你的数据"}
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                placeholder="用户名"
                autoFocus
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                placeholder="密码（至少3个字符）"
              />

              {!isRegister && (
                <div>
                  <div ref={trackRef} className="relative h-10 rounded-lg border border-border bg-muted/30 select-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-lg transition-all duration-75"
                      style={{ width: Math.max(0, thumbLeft + 22) }} />
                    <div
                      onMouseDown={(e) => onStart(e.clientX)}
                      onTouchStart={(e) => onStart(e.touches[0].clientX)}
                      className={`absolute top-1/2 -translate-y-1/2 w-10 h-8 bg-white rounded shadow flex items-center justify-center cursor-grab ${
                        sliderDone ? "bg-chart-3 text-white cursor-default" : ""
                      }`}
                      style={{ left: thumbLeft }}
                    >
                      {sliderDone ? <CheckCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 text-primary" />}
                    </div>
                    {!sliderDone && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-muted-foreground">拖动滑块完成验证</span>
                      </div>
                    )}
                    {sliderDone && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-chart-3">验证通过</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button type="submit"
              disabled={loading || !username || !password || (!isRegister && !sliderDone)}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-opacity text-sm">
              {loading ? (isRegister ? "提交中..." : "登录中...") : (isRegister ? "提交申请" : "登录")}
            </button>

            <div className="text-center">
              <button type="button"
                onClick={() => { setIsRegister(!isRegister); setError(""); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {isRegister ? "已有账号？去登录" : "没有账号？提交申请"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
pnpm build
```

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/LoginScreen.tsx
git commit -m "refactor: convert LoginScreen to LoginModal component"
```

---

### Task 5: Frontend — Guest mode in App.tsx + Header login button

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Update imports in App.tsx**

Read `src/App.tsx`. Change:
```typescript
import { LoginScreen } from "./components/LoginScreen";
```
To:
```typescript
import { LoginModal } from "./components/LoginScreen";
```

- [ ] **Step 2: Add guest mode state in App.tsx**

After existing state declarations (around line 92), add:

```typescript
const [loginModalOpen, setLoginModalOpen] = useState(false);
const pendingActionRef = useRef<(() => void) | null>(null);
const [userStorage, setUserStorage] = useState({ used: 0, limit: 1073741824 });
```

- [ ] **Step 3: Add requireAuth helper**

After the state declarations, add:

```typescript
const requireAuth = (action: () => void) => {
  if (!authenticated) {
    pendingActionRef.current = action;
    setLoginModalOpen(true);
    return;
  }
  action();
};

const handleLoginSuccess = () => {
  setAuthenticated(true);
  setLoginModalOpen(false);
  // Reload data
  window.location.reload();
};
```

Note: Using `window.location.reload()` is the simplest way to ensure all hooks re-fetch with the new auth token. Alternative: call reload functions on useApiTodos/useApiCategories, but reload is simpler and guaranteed correct.

- [ ] **Step 4: Remove the auth gate**

Delete these lines (around 366-368):
```typescript
if (!authenticated) {
  return <LoginScreen onLogin={() => setAuthenticated(true)} />;
}
```

- [ ] **Step 5: Wrap write actions with requireAuth**

Find the `<Sidebar` component props. Update:
```tsx
onCreateTodo={() => requireAuth(() => setCreateOpen(true))}
onCreateCategory={() => requireAuth(() => setCategoryOpen(true))}
onEditCategory={(id, name, color) => requireAuth(() => { setEditingCategory({ id, name, color }); })}
onDeleteCategory={(id) => requireAuth(() => deleteCategory(id))}
```

Find the `<Header` component. Add a new prop `showLogin` and `onLogin`:
```tsx
<Header
  // ... existing props ...
  authenticated={authenticated}
  onLoginClick={() => setLoginModalOpen(true)}
/>
```

Find the `handleQuickAddTodo` function and wrap its logic:
```typescript
const handleQuickAddTodo = async (text: string) => {
  if (!authenticated) {
    pendingActionRef.current = () => handleQuickAddTodo(text);
    setLoginModalOpen(true);
    return;
  }
  // ... existing logic unchanged
};
```

Find `handleCreateTodo` and add auth check at the beginning:
```typescript
const handleCreateTodo = async (e: FormEvent) => {
  e.preventDefault();
  if (!authenticated) {
    pendingActionRef.current = () => handleCreateTodo(e);
    setLoginModalOpen(true);
    return;
  }
  // ... existing logic unchanged
};
```

Find the todo update handler. Wrap with requireAuth:
In the `updateTodoBase` calls (look for places where `updateTodoBase` is called), wrap inline with requireAuth.

- [ ] **Step 6: Add LoginModal to the render tree**

At the bottom of the component (before the final closing tag), add:

```tsx
<LoginModal
  open={loginModalOpen}
  onClose={() => setLoginModalOpen(false)}
  onLogin={handleLoginSuccess}
/>
```

- [ ] **Step 7: Make useApiTodos and useApiCategories handle guest mode**

Read `src/hooks/useApiTodos.ts`. At the top of the hook, check if logged in:

```typescript
export function useApiTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!isLoggedIn()) {
      setTodos([]);
      setLoading(false);
      return;
    }
    // ... existing fetch logic
  };
  // ...
```

Similarly for `src/hooks/useApiCategories.ts`:

```typescript
export function useApiCategories() {
  const [categories, setCategories] = useState<StoredCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!isLoggedIn()) {
      setCategories([]);
      setLoading(false);
      return;
    }
    // ... existing fetch logic
  };
  // ...
```

- [ ] **Step 8: Header — add login button**

Read `src/components/Header.tsx`. Find the interface and add props:

```typescript
interface HeaderProps {
  // ... existing props ...
  authenticated: boolean;
  onLoginClick: () => void;
}
```

In the JSX, after the title area, add:

```tsx
{!authenticated && (
  <button
    onClick={onLoginClick}
    className="text-xs text-primary hover:underline ml-4 flex-shrink-0"
  >
    登录
  </button>
)}
```

- [ ] **Step 9: Build**

```bash
pnpm build
```

Fix any TypeScript errors. Likely issues: `isLoggedIn` import, Header props mismatch.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx src/components/Header.tsx src/hooks/useApiTodos.ts src/hooks/useApiCategories.ts
git commit -m "feat: implement guest mode with login modal + header login button"
```

---

### Task 6: Frontend — Storage bar in sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Add storage bar to Sidebar**

Read `src/components/Sidebar.tsx`. Add to the interface:

```typescript
interface SidebarProps {
  // ... existing props ...
  authenticated: boolean;
  storageUsed: number;
  storageLimit: number;
}
```

Add to destructured props:
```typescript
  authenticated = false,
  storageUsed = 0,
  storageLimit = 1073741824,
```

Add this helper function at the top of the file (outside the component):

```typescript
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + "GB";
}
```

At the bottom of the sidebar (before the closing `</aside>`), add:

```tsx
{authenticated && (
  <div className="px-6 pb-4 flex-shrink-0">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-sidebar-foreground">存储空间</span>
      <span className="text-xs text-sidebar-foreground">
        {formatSize(storageUsed)} / {formatSize(storageLimit)}
      </span>
    </div>
    <div className="h-1 bg-sidebar-accent rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all"
        style={{ width: `${Math.min(100, (storageUsed / storageLimit) * 100)}%` }}
      />
    </div>
  </div>
)}
```

- [ ] **Step 2: Pass storage props from App.tsx**

In `App.tsx`, find the `<Sidebar` component and add:

```tsx
authenticated={authenticated}
storageUsed={userStorage.used}
storageLimit={userStorage.limit}
```

- [ ] **Step 3: Fetch storage data on login**

In `App.tsx`, add a `useEffect` to fetch user storage info when authenticated:

```typescript
useEffect(() => {
  if (authenticated) {
    getMe().then(info => {
      setUserStorage({ used: info.storageUsed, limit: info.storageLimit });
    }).catch(() => {});
  }
}, [authenticated]);
```

Make sure `getMe` is imported from `../api/auth`.

- [ ] **Step 4: Build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx src/App.tsx
git commit -m "feat: add storage usage bar to sidebar"
```

---

### Task 7: Deploy

- [ ] **Step 1: Push all commits**

```bash
git push
```

- [ ] **Step 2: Deploy to server**

SSH to server:
```bash
cd /opt/todolist && git pull && docker compose up -d --build
```

- [ ] **Step 3: Verify**

- Open `http://119.28.30.181/` — main UI shows without login
- Click "新建任务" — login modal appears with slider
- Log in — data loads, sidebar shows storage bar
- Register new user, approve, log in — default categories appear (工作/学习/生活/健康)
