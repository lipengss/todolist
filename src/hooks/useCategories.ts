import { useEffect, useState } from "react";

const CATEGORIES_STORAGE_KEY = "focusworkspace.categories.v1";

export interface StoredCategory {
  id: string;
  name: string;
  color: string;
}

function readCategories(fallback: StoredCategory[]): StoredCategory[] {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as StoredCategory[]) : fallback;
  } catch {
    return fallback;
  }
}

export function useCategories(initialCategories: StoredCategory[]) {
  const [categories, setCategories] = useState<StoredCategory[]>(() => readCategories(initialCategories));

  useEffect(() => {
    window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  const addCategory = (category: StoredCategory) => {
    setCategories((current) => [...current, category]);
  };

  const updateCategory = (id: string, patch: Partial<StoredCategory>) => {
    setCategories((current) => current.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((current) => current.filter((c) => c.id !== id));
  };

  return { categories, setCategories, addCategory, updateCategory, deleteCategory };
}
