import { useEffect, useState } from "react";
import { Todo } from "../components/types";

const TODOS_STORAGE_KEY = "focusworkspace.todos.v1";

function readTodos(fallback: Todo[]): Todo[] {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(TODOS_STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as Todo[]) : fallback;
  } catch {
    return fallback;
  }
}

export function useTodos(initialTodos: Todo[]) {
  const [todos, setTodos] = useState<Todo[]>(() => readTodos(initialTodos));

  useEffect(() => {
    window.localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    let needsUpdate = false;
    const migrated = todos.map((todo) => {
      if (todo.completed && !todo.completedAt) {
        needsUpdate = true;
        return { ...todo, completedAt: todo.deletedAt ?? new Date().toISOString() };
      }
      return todo;
    });
    if (needsUpdate) setTodos(migrated);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getNextDueDate = (currentDueDate: string | undefined, recurrence: Todo["recurrence"]): string | undefined => {
    if (!currentDueDate || !recurrence || recurrence === "none") return currentDueDate;
    const base = new Date(currentDueDate);
    if (recurrence === "daily") base.setDate(base.getDate() + 1);
    else if (recurrence === "weekly") base.setDate(base.getDate() + 7);
    else if (recurrence === "monthly") base.setMonth(base.getMonth() + 1);
    return base.toISOString().split("T")[0];
  };

  const updateTodo = (id: string, patch: Partial<Todo>) => {
    setTodos((current) => {
      let nextInstance: Todo | null = null;
      const updated = current.map((todo) => {
        if (todo.id !== id) return todo;
        const updated = { ...todo, ...patch };
        if ("completed" in patch && patch.completed && !todo.completed && todo.recurrence && todo.recurrence !== "none") {
          updated.completedAt = new Date().toISOString();
          const nextDate = getNextDueDate(todo.dueDate, todo.recurrence);
          nextInstance = {
            ...todo,
            id: crypto.randomUUID(),
            completed: false,
            completedAt: undefined,
            dueDate: nextDate ?? todo.dueDate,
            createdAt: new Date().toISOString().split("T")[0],
          };
        } else if ("completed" in patch && patch.completed !== todo.completed) {
          updated.completedAt = patch.completed ? new Date().toISOString() : undefined;
        }
        return updated;
      });
      return nextInstance ? [...updated, nextInstance] : updated;
    });
  };

  const addTodo = (todo: Todo) => {
    setTodos((current) => [todo, ...current]);
  };

  const removeTodos = (ids: string[]) => {
    setTodos((current) => current.filter((t) => !ids.includes(t.id)));
  };

  return { todos, setTodos, updateTodo, addTodo, removeTodos };
}
