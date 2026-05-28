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
  const data = await apiFetch<{ access_token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.access_token);
  return data;
}

export function isLoggedIn() {
  return !!localStorage.getItem("fw_token");
}

export function logout() {
  setToken(null);
}
