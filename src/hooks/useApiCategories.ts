import { useState, useEffect, useCallback } from "react";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "../api/categories";
import { StoredCategory } from "./useCategories";
import { isLoggedIn } from "../api/auth";

export function useApiCategories() {
  const [categories, setCategories] = useState<StoredCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isLoggedIn()) {
      setCategories([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchCategories();
      setCategories(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        color: c.color,
      })));
    } catch {
      // handled by caller
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (data: { name: string; color: string }) => {
    const created = await createCategory(data);
    setCategories((prev) => [...prev, { id: created.id, name: created.name, color: created.color }]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<StoredCategory>) => {
    await updateCategory(id, { name: patch.name, color: patch.color });
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, loading, add, update, remove, reload: load };
}
