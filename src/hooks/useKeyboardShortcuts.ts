// src/hooks/useKeyboardShortcuts.ts
import { useEffect, useState, useCallback, type RefObject } from "react";

export interface ShortcutContext {
  filter: string;
  filteredTodoCount: number;
  isAnyModalOpen: boolean;
  onCreateTodo: () => void;
  onToggleFocused: (index: number) => void;
  onOpenFocused: (index: number) => void;
  onDeleteFocused: (index: number) => void;
  onCloseAll: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export function useKeyboardShortcuts(ctx: ShortcutContext) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(false);

  const resetFocus = useCallback(() => setFocusedIndex(-1), []);

  useEffect(() => {
    const isInputFocused =
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement;

    function handleKeyDown(e: KeyboardEvent) {
      // ? key — toggle help panel (global, but not in inputs)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !isInputFocused) {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
        return;
      }

      // Esc — close help panel or modal
      if (e.key === "Escape") {
        if (helpOpen) {
          setHelpOpen(false);
          return;
        }
        if (ctx.isAnyModalOpen) {
          ctx.onCloseAll();
          return;
        }
        return;
      }

      // Help panel open — only Esc works
      if (helpOpen) return;

      // Ctrl+N — create todo (global, except in inputs)
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        ctx.onCreateTodo();
        return;
      }

      // Ctrl+F — focus search (global, except in inputs)
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        ctx.searchInputRef.current?.focus();
        return;
      }

      // Modal open — only global shortcuts work
      if (ctx.isAnyModalOpen) return;

      // Calendar view — only global shortcuts
      if (ctx.filter === "calendar") return;

      // List view shortcuts
      if (ctx.filteredTodoCount === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % ctx.filteredTodoCount);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev <= 0 ? ctx.filteredTodoCount - 1 : prev - 1
        );
      } else if (e.key === " " && focusedIndex >= 0) {
        e.preventDefault();
        ctx.onToggleFocused(focusedIndex);
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        ctx.onOpenFocused(focusedIndex);
      } else if (e.key === "Delete" && focusedIndex >= 0) {
        e.preventDefault();
        ctx.onDeleteFocused(focusedIndex);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ctx, helpOpen, focusedIndex]);

  return { focusedIndex, setFocusedIndex, helpOpen, setHelpOpen, resetFocus };
}
