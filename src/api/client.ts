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
    const body = await res.text();
    if (res.status === 401) {
      setToken(null);
    }
    // Try to extract message from JSON body
    try {
      const json = JSON.parse(body);
      throw new Error(json.message || json.error || `HTTP ${res.status}`);
    } catch (e) {
      if (e instanceof Error && e.message !== body) throw e;
      throw new Error(body || `HTTP ${res.status}`);
    }
  }

  return res.json();
}
