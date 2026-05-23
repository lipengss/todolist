const SETTINGS_KEY = "focusworkspace.settings.v1";

export interface Settings {
  reminderMinutes: number;
}

const DEFAULT_SETTINGS: Settings = {
  reminderMinutes: 15,
};

function readSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSettings(): Settings {
  return readSettings();
}

export function updateSettings(partial: Partial<Settings>): void {
  const current = readSettings();
  const updated = { ...current, ...partial };
  writeSettings(updated);
}
