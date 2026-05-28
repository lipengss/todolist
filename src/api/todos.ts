import { apiFetch } from "./client";
import { Todo } from "../components/types";

interface BackendTodo {
  id: string;
  text: string;
  note?: string;
  completed: boolean;
  starred: boolean;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  recurrence?: string;
  createdAt: string;
  completedAt?: string;
  deletedAt?: string;
  subtasks?: { id: string; text: string; completed: boolean }[];
  category?: { id: string; name: string; color: string } | null;
  categoryId?: string | null;
}

function fromApi(t: BackendTodo): Todo {
  return {
    id: t.id,
    text: t.text,
    note: t.note,
    completed: t.completed,
    starred: t.starred,
    priority: t.priority as Todo["priority"],
    category: t.category?.id ?? t.categoryId ?? "",
    dueDate: t.dueDate,
    dueTime: t.dueTime,
    subtasks: t.subtasks,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
    deletedAt: t.deletedAt,
    recurrence: t.recurrence as Todo["recurrence"],
  };
}

export async function fetchTodos() {
  const data = await apiFetch<BackendTodo[]>("/todos");
  return data.map(fromApi);
}

export async function createTodo(todo: {
  text: string;
  note?: string;
  completed?: boolean;
  starred?: boolean;
  priority?: string;
  dueDate?: string;
  dueTime?: string;
  recurrence?: string;
  category?: string;
  createdAt: string;
  subtasks?: { text: string; completed: boolean }[];
}) {
  const data = await apiFetch<BackendTodo>("/todos", {
    method: "POST",
    body: JSON.stringify({
      text: todo.text,
      note: todo.note,
      completed: todo.completed,
      starred: todo.starred,
      priority: todo.priority,
      dueDate: todo.dueDate,
      dueTime: todo.dueTime,
      recurrence: todo.recurrence,
      categoryId: todo.category || undefined,
      createdAt: todo.createdAt,
      subtasks: todo.subtasks,
    }),
  });
  return fromApi(data);
}

export async function updateTodo(id: string, patch: Record<string, unknown>) {
  const body: Record<string, unknown> = { ...patch };
  delete body.category;
  if (patch.category) {
    body.categoryId = patch.category;
  }
  const data = await apiFetch<BackendTodo>(`/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return fromApi(data);
}

export async function softDeleteTodo(id: string) {
  const data = await apiFetch<BackendTodo>(`/todos/${id}`, { method: "DELETE" });
  return fromApi(data);
}
