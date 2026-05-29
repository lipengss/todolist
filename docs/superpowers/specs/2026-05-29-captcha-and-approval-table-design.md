# Captcha & Approval Table Design

**Date:** 2026-05-29
**Status:** Approved

## Overview

Two features:
1. SVG captcha on login page to prevent brute-force attacks
2. Standalone approval table page (removed from settings modal)

---

## Feature 1: Login Captcha

### Backend

**New endpoint: `GET /api/auth/captcha`**
- Generates a random 4-character alphanumeric string (case-insensitive)
- Renders it to SVG using the `svg-captcha` npm package
- Stores `{ answer, expiresAt }` in an in-memory Map keyed by a UUID token
- Returns `{ svg: string, token: string }`
- Answers expire after 5 minutes; stale entries cleaned on access

**Modified endpoint: `POST /api/auth/login`**
- Accepts two new fields: `captchaToken` (string) and `captchaText` (string)
- Validates captcha BEFORE checking username/password
- On captcha mismatch: return 400 with message "验证码错误或已过期"
- On success: delete the captcha entry from memory to prevent reuse

Captcha storage lives in a new `CaptchaService` (or a private Map inside `AuthService`):
```typescript
// AuthService
private captchaStore = new Map<string, { answer: string; expiresAt: number }>();
```
Cleanup of expired entries happens on every `generateCaptcha()` call.

**No database changes.** Captcha state is purely ephemeral (memory-only).

### Frontend

**LoginScreen changes:**
- New state variables: `captchaSvg`, `captchaToken`, `captchaText`, `captchaLoading`
- On mount: call `GET /api/auth/captcha`, render the SVG
- New UI row below password: text input + captcha SVG image side by side
- Captcha image: white background, no text overlay, border highlight on hover (purple), cursor:pointer
- Below the row: small helper text "看不清？点击图片刷新"
- Click on captcha image: debounced (500ms) refetch from `/api/auth/captcha`
- On login failure due to captcha: auto-refresh captcha + clear input
- On login failure due to credentials: only clear captcha input (keep same image)

**SVG rendering:** Use `dangerouslySetInnerHTML` to inject the SVG string into a div.

### Dependencies

```bash
cd server && pnpm add svg-captcha
```

No frontend dependencies needed.

---

## Feature 2: Approval Table

### New Component: `ApprovalPage`

Independent page component, replacing the embedded `RegistrationManager` in settings modal.

**Layout:**
- Header: "用户审批" title + record count summary + refresh button
- Table with columns:

| 用户名 | 状态 | IP 地址 | 注册时间 | 操作 |

**State badges:**
- 待审批: yellow (`bg-chart-4/20 text-chart-4`)
- 已通过: green (`bg-chart-3/20 text-chart-3`)
- 已拒绝: red (`bg-destructive/20 text-destructive`)

**Action buttons (per row):**
- Pending: green check (approve) + red X (reject)
- Approved: gray trash (delete only)
- Rejected: gray trash (delete only)

**Sorting:** Pending first, then by `createdAt` descending.

**Data:** Self-contained — calls `getRegistrations()` on mount via the existing API.

### Sidebar Changes

**New entry "用户审批" (admin only):**
- Icon: `Users` from lucide-react
- Displayed ONLY when user role is `admin`
- Yellow badge showing count of pending registrations
- Clicking sets `filter = "approvals"` in App state

**Role detection:** Parse JWT token from localStorage to extract role. Add a helper `getUserRole()` to `src/api/auth.ts` that decodes the token payload.

### App.tsx Changes

- Import `ApprovalPage`
- Add rendering branch: when `filter === "approvals"`, render `<ApprovalPage />`
- Remove `<RegistrationManager />` from settings modal
- Pass `userRole` to Sidebar for conditional rendering

### Removal

- Delete `src/components/RegistrationManager.tsx`

### No Backend Changes

The existing registration API endpoints (`GET/POST/DELETE /api/auth/registrations/*`) are sufficient.

---

## Implementation Order

1. **Captcha backend** — `svg-captcha` install, `AuthService.generateCaptcha()`, `AuthController.getCaptcha()`, modify `login()` 
2. **Captcha frontend** — Update `LoginScreen` with captcha UI and logic
3. **Approval table** — Create `ApprovalPage`, add sidebar entry, wire up in `App.tsx`
4. **Cleanup** — Remove `RegistrationManager`, commit
