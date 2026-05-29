# Slider Captcha Design

**Date:** 2026-05-29
**Status:** Approved

## Overview

Replace the SVG character captcha with a simple drag-slider captcha. User drags a slider to the right to complete verification. Backend validates via time-based anti-automation checks.

## Motivation

SVG captcha text is hard to read. A slider is intuitive, mobile-friendly, and equally effective against brute-force scripts when combined with server-side timing checks.

## Backend Changes

### Replace `GET /api/auth/captcha`

**Before:** Returns `{ svg, token }` (SVG image + answer token)

**After:** Returns `{ token }` (just a UUID)

```typescript
generateCaptcha(): { token: string } {
  const token = randomUUID();
  this.captchaStore.set(token, { createdAt: Date.now() });
  return { token };
}
```

Cleanup of expired entries (>5 min) happens on each call.

### Update `validateCaptcha`

**Before:** Compares text string with stored answer

**After:** Checks token existence, expiration, and minimum interaction time:

```typescript
validateCaptcha(token: string): boolean {
  const entry = this.captchaStore.get(token);
  if (!entry) return false;
  const elapsed = Date.now() - entry.createdAt;
  // Must be between 800ms and 5 minutes
  if (elapsed < 800 || elapsed > 5 * 60 * 1000) {
    this.captchaStore.delete(token);
    return false;
  }
  this.captchaStore.delete(token);
  return true;
}
```

### Remove svg-captcha dependency

```bash
cd server && pnpm remove svg-captcha
```

Remove the `svgCaptcha` import and related code from `AuthService`.

### Storage

```typescript
private captchaStore = new Map<string, { createdAt: number }>();
```

No database changes. Memory-only, ephemeral.

---

## Frontend Changes

### LoginScreen — Replace captcha section

Replace the SVG + text input row with a slider component:

**Slider behavior:**
- Default state: thumb at left, background empty, text "拖动滑块完成验证"
- Dragging: thumb follows cursor/touch, purple gradient fills the track
- Reached end: thumb locks at right, green checkmark appears, text "验证通过"
- If released before end: thumb snaps back to left (animated)

**HTML structure:**
- Outer container: track with border, rounded, 40px height
- Slider thumb: white circle/rounded rect, draggable
- Background fill: purple gradient that grows with thumb position

**Event handling:**
- `mousedown` / `touchstart` on thumb → start drag
- `mousemove` / `touchmove` on document → update thumb position (clamped 0 to max)
- `mouseup` / `touchend` → if at end, lock; else snap back
- 500ms debounce NOT needed here (drag is continuous, not point-and-click)

**States:**

| State | UI |
|-------|-----|
| Idle | Thumb at left, "拖动滑块完成验证" |
| Dragging | Thumb follows cursor, purple fill grows |
| Released early | Thumb snaps back (animated 0.2s) |
| Completed | Thumb locked right, green checkmark, text "验证通过" |

### Login API call

The `login()` function signature stays the same (captchaToken, captchaText optional). For slider, only `captchaToken` is needed — `captchaText` can be omitted.

In `LoginScreen.handleSubmit`:
```typescript
await login(username, password, sliderToken, "");
```

Make `captchaText` optional in the `LoginDto` on the backend side (remove `@IsString()` or add `@IsOptional()`), so slider mode only sends `captchaToken`.

### Remove fetchCaptcha SVG handling

No more `dangerouslySetInnerHTML` for SVG. Replace `fetchCaptcha()` return type:
```typescript
export async function fetchCaptcha() {
  return apiFetch<{ token: string }>("/auth/captcha");
}
```

---

## Implementation Order

1. **Backend:** Simplify AuthService (remove svg-captcha, simplify captchaStore)
2. **Backend:** Update AuthController captcha endpoint return type
3. **Backend:** Remove svg-captcha package
4. **Frontend:** Update fetchCaptcha API return type
5. **Frontend:** Replace captcha UI in LoginScreen with slider component
6. **Test & deploy**
