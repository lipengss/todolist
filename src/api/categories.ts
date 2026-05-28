import { apiFetch } from "./client";

interface BackendCategory {
  id: string;
  name: string;
  color: string;
  todos?: { id: string }[];
}

export async function fetchCategories() {
  return apiFetch<BackendCategory[]>("/categories");
}

export async function createCategory(data: { name: string; color: string }) {
  return apiFetch<BackendCategory>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: { name?: string; color?: string }) {
  return apiFetch<BackendCategory>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string) {
  return apiFetch<unknown>(`/categories/${id}`, { method: "DELETE" });
}
