# Guest Mode + Default Categories + Storage Display Design

**Date:** 2026-05-29
**Status:** Approved

## Overview

Three optimizations:
1. Guest mode: show main UI without login, prompt login modal on write actions
2. Default categories: auto-create 工作/学习/生活/健康 for new users
3. Storage display: show storage usage bar in sidebar

---

## Feature 1: Guest Mode

### Current behavior

App.tsx checks `authenticated` state. If false, renders `<LoginScreen />` full-screen. User cannot see anything behind it.

### New behavior

- App ALWAYS renders the main layout
- Guest sees empty state (no todos, no categories)
- When guest triggers a write action (create/update/delete/complete), a **login Modal** appears
- Login Modal contains the full LoginScreen functionality: login/register toggle + slider captcha
- After login success: reload todos + categories from API, close modal
- User can also click a "登录" button in header to manually trigger the modal
- Sidebar shows "未登录" indicator when guest

### Login Modal (new component: `LoginModal`)

Convert `LoginScreen` into a Modal-based component:
- Modal overlay with backdrop click to close
- Contains: title, username/password fields, slider captcha (login mode), login/register toggle
- Register mode: submit registration, show "等待审批" success state inside modal
- On successful login: call `onLogin` callback, parent re-fetches data
- Props: `open`, `onClose`, `onLogin`

### Write actions that trigger login

| Action | Location |
|--------|----------|
| Click "新建任务" in sidebar | `Sidebar` `onCreateTodo` |
| Press Enter in QuickAddBar | `QuickAddBar` |
| Click complete/star on todo | `TodoItem` |
| Click edit/delete on todo | `TodoDetailPanel` |
| Double-click date in calendar | `CalendarView` |
| Add/edit/delete category | `Sidebar` category section |
| Open settings | `Sidebar` settings button |
| Click "登录" in header | `Header` (new button) |

### App.tsx changes

- Remove the `if (!authenticated) return <LoginScreen/>` gate
- Add `const [loginModalOpen, setLoginModalOpen] = useState(false)`
- Add `const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)`
- Wrap write operations: if not authenticated, set pendingAction + open login modal; on login, execute pendingAction
- Pass `onRequireAuth: (action: () => void) => void` down to components
- `useApiTodos` and `useApiCategories` should work in "guest mode" (return empty arrays, no API calls)

### Header changes

Add a "登录" button (visible only when not authenticated) next to the title area.

---

## Feature 2: Default Categories

### Backend: `approveRegistration()` in AuthService

After creating the User, insert 4 default categories:

```typescript
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
```

These categories belong to the system, shared by all users (no user_id FK needed — categories are global in current schema).

---

## Feature 3: Storage Display

### Backend

**User model:** Add `storageUsed` field (Int, default 0, bytes).

**Update on CRUD:** Recalculate storage after each todo/subtask/category mutation. Simple formula: count rows and multiply by estimated size (~2KB per row), or use actual JSON size of user's data.

**New endpoint:** `GET /api/auth/me` (authenticated) returns:
```json
{
  "username": "admin",
  "role": "admin",
  "storageUsed": 12582,
  "storageLimit": 1073741824
}
```

### Frontend

**Sidebar bottom section** (below trash/stats, above nothing — always visible):

```tsx
{authenticated && (
  <div className="px-3 pb-4">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-muted-foreground">存储空间</span>
      <span className="text-xs text-muted-foreground">{formatSize(storageUsed)} / 1GB</span>
    </div>
    <div className="h-1 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
    </div>
  </div>
)}
```

**formatSize helper:** Converts bytes to human-readable (KB/MB/GB).

---

## Implementation Order

1. Backend: default categories on user approval
2. Backend: User storageUsed field + GET /me endpoint
3. Frontend: LoginModal component (convert LoginScreen)
4. Frontend: Guest mode (remove auth gate, add pending action pattern)
5. Frontend: Storage bar in sidebar
6. Deploy
