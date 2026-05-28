import { apiFetch, setToken } from "./client";

export async function login(username: string, password: string) {
  const data = await apiFetch<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function register(username: string, password: string) {
  return apiFetch<{ message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function getRegistrations() {
  return apiFetch<{ id: string; username: string; status: string; createdAt: string }[]>("/auth/registrations");
}

export async function approveRegistration(id: string) {
  return apiFetch<{ ok: boolean }>(`/auth/registrations/${id}/approve`, { method: "POST" });
}

export async function rejectRegistration(id: string) {
  return apiFetch<{ ok: boolean }>(`/auth/registrations/${id}/reject`, { method: "POST" });
}

export function isLoggedIn() {
  return !!localStorage.getItem("fw_token");
}

export function logout() {
  setToken(null);
}
