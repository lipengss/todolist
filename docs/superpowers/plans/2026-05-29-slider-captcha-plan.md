# Slider Captcha Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace SVG character captcha with a drag-slider captcha on the login page.

**Architecture:** Backend simplifies `captchaStore` to only track token creation timestamps (removes svg-captcha package). Frontend replaces the SVG+input row with a custom drag-slider component using mouse/touch events. Validation uses minimum interaction time (800ms) instead of text matching.

**Tech Stack:** NestJS, React 18, TypeScript, native DOM events (no extra packages)

---

### Task 1: Simplify AuthService captcha logic

**Files:**
- Modify: `server/src/auth/auth.service.ts`

- [ ] **Step 1: Rewrite captcha methods**

Read `server/src/auth/auth.service.ts`. Make these changes:

Remove line 6:
```typescript
import * as svgCaptcha from "svg-captcha";
```

Replace `captchaStore` (line 17) and both captcha methods (lines 19-51):

```typescript
private captchaStore = new Map<string, { createdAt: number }>();

generateCaptcha(): { token: string } {
  const now = Date.now();
  for (const [key, entry] of this.captchaStore) {
    if (now - entry.createdAt > 5 * 60 * 1000) this.captchaStore.delete(key);
  }
  const token = randomUUID();
  this.captchaStore.set(token, { createdAt: now });
  return { token };
}

validateCaptcha(token: string): boolean {
  const entry = this.captchaStore.get(token);
  if (!entry) return false;
  const elapsed = Date.now() - entry.createdAt;
  if (elapsed < 800 || elapsed > 5 * 60 * 1000) {
    this.captchaStore.delete(token);
    return false;
  }
  this.captchaStore.delete(token);
  return true;
}
```

- [ ] **Step 2: Build and verify**

```bash
cd server && pnpm build
```

Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/auth/auth.service.ts
git commit -m "refactor: simplify captcha to slider token (remove svg-captcha)"
```

---

### Task 2: Update AuthController

**Files:**
- Modify: `server/src/auth/auth.controller.ts`

- [ ] **Step 1: Update LoginDto and login method**

Read `server/src/auth/auth.controller.ts`. Make these changes:

Change LoginDto (line 10-11) to make captchaText optional:
```typescript
class LoginDto {
  @IsString() username: string;
  @IsString() password: string;
  @IsString() captchaToken: string;
  @IsString() captchaText?: string;
}
```

Note: `?` makes `captchaText` optional. Remove the `@IsString()` decorator from `captchaText` since optional + IsString conflicts. Use:
```typescript
class LoginDto {
  @IsString() username: string;
  @IsString() password: string;
  @IsString() captchaToken: string;
  captchaText?: string;
}
```

Update the login method's captcha validation to pass only token:
```typescript
@Post("login")
async login(@Body() dto: LoginDto) {
  const captchaValid = this.authService.validateCaptcha(dto.captchaToken);
  if (!captchaValid) {
    throw new BadRequestException("验证码错误或已过期");
  }
  // rest unchanged...
```

The `getCaptcha()` endpoint needs no change — it now returns `{ token }` from the service automatically.

- [ ] **Step 2: Build and verify**

```bash
cd server && pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add server/src/auth/auth.controller.ts
git commit -m "refactor: simplify login captcha validation for slider mode"
```

---

### Task 3: Remove svg-captcha package

**Files:**
- Modify: `server/package.json`, `server/pnpm-lock.yaml`

- [ ] **Step 1: Uninstall svg-captcha**

```bash
cd server && pnpm remove svg-captcha
```

- [ ] **Step 2: Build to verify**

```bash
cd server && pnpm build
```

Expected: Build succeeds with no imports of svg-captcha.

- [ ] **Step 3: Commit**

```bash
git add server/package.json server/pnpm-lock.yaml
git commit -m "chore: remove svg-captcha dependency"
```

---

### Task 4: Update frontend fetchCaptcha

**Files:**
- Modify: `src/api/auth.ts`

- [ ] **Step 1: Update fetchCaptcha return type**

Read `src/api/auth.ts`. Change line 44:

From:
```typescript
export async function fetchCaptcha() {
  return apiFetch<{ svg: string; token: string }>("/auth/captcha");
}
```

To:
```typescript
export async function fetchCaptcha() {
  return apiFetch<{ token: string }>("/auth/captcha");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/auth.ts
git commit -m "refactor: update fetchCaptcha for slider token only"
```

---

### Task 5: Replace captcha UI with slider in LoginScreen

**Files:**
- Modify: `src/components/LoginScreen.tsx`

- [ ] **Step 1: Rewrite LoginScreen with slider component**

Read `src/components/LoginScreen.tsx`. Replace the entire file with:

```tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { login, register, fetchCaptcha } from "../api/auth";
import { CheckCircle, ArrowRight } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
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
    } catch {
      // silent
    }
  };

  useEffect(() => { loadCaptcha(); }, []);

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
    if (!sliderDone) {
      setThumbLeft(0);
    }
  }, [sliderDone]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX);
    const handleMouseUp = () => onEnd();
    const handleTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientX);
    const handleTouchEnd = () => onEnd();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
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

          {!isRegister && (
            <div>
              <label className="text-sm text-muted-foreground block mb-1.5">安全验证</label>
              <div
                ref={trackRef}
                className="relative h-[42px] rounded-lg border border-border bg-muted/30 select-none overflow-hidden"
              >
                {/* Background fill */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-lg transition-all duration-75"
                  style={{ width: Math.max(0, thumbLeft + 22) }}
                />
                {/* Thumb */}
                <div
                  onMouseDown={(e) => onStart(e.clientX)}
                  onTouchStart={(e) => onStart(e.touches[0].clientX)}
                  className={`absolute top-1/2 -translate-y-1/2 w-11 h-[36px] bg-white rounded-md shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${
                    sliderDone ? "bg-chart-3 text-white cursor-default" : "hover:shadow-lg"
                  }`}
                  style={{ left: thumbLeft, transition: sliderDone ? "left 0.05s" : undefined }}
                >
                  {sliderDone ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-primary" />
                  )}
                </div>
                {/* Label */}
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

        <button
          type="submit"
          disabled={loading || !username || !password || (!isRegister && !sliderDone)}
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

- [ ] **Step 2: Build and verify**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/LoginScreen.tsx
git commit -m "feat: replace SVG captcha with drag-slider captcha"
```

---

### Task 6: End-to-end verification

- [ ] **Step 1: Start backend and test captcha endpoint**

```bash
cd server && pnpm dev
```

Run: `curl http://localhost:3000/api/auth/captcha`
Expected: `{"token":"<uuid>"}`

- [ ] **Step 2: Manual browser test**

Open `http://localhost:5173`, verify:
- Slider appears on login page (not in register mode)
- Dragging slider to the right fills purple background
- Reaching the end shows green checkmark + "验证通过"
- Releasing early snaps back to start
- Login with slider completed works
- Login without slider shows disabled button

- [ ] **Step 3: Test 800ms minimum time**

Try to login immediately after page load (before dragging slider). The token should be fresh enough to pass the 800ms check after a normal drag (dragging takes >800ms naturally). Rapid automated submissions would fail.

- [ ] **Step 4: Commit any fixes and push**

```bash
git add -A && git commit -m "chore: final slider captcha adjustments"
git push
```
