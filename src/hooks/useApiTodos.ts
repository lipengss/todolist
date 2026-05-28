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
    const updated = await updateTodo(id, patch as Record<string, unknown>);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const softDelete = useCallback(async (id: string) => {
    const deleted = await softDeleteTodo(id);
    setTodos((prev) => prev.map((t) => (t.id === id ? deleted : t)));
  }, []);

  const removeMany = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      await softDeleteTodo(id);
    }
    setTodos((prev) => prev.map((t) => (ids.includes(t.id) ? { ...t, deletedAt: new Date().toISOString() } : t)));
  }, []);

  return { todos, loading, add, update, softDelete, removeMany, reload: load };
}
