import { apiFetch } from "./client";

export interface AppSettings {
  id: number;
  reminderMinutes: number;
  repeatEnabled: boolean;
  repeatIntervalMinutes: number;
}

export async function fetchSettings() {
  return apiFetch<AppSettings>("/settings");
}

export async function updateSettings(data: Partial<AppSettings>) {
  return apiFetch<AppSettings>("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
