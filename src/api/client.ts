const API_BASE = "/api";

let authToken: string | null = localStorage.getItem("fw_token");

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("fw_token", token);
  else localStorage.removeItem("fw_token");
}

export function getToken() {
  return authToken;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      throw new Error("Unauthorized");
    }
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json();
}
