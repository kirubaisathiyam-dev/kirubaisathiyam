export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type ThemeSnapshot = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
};

export const THEME_STORAGE_KEY = "ks_theme";
export const THEME_EVENT = "ks-theme-change";

const serverSnapshot: ThemeSnapshot = {
  preference: "system",
  resolved: "light",
};

let cachedSnapshot: ThemeSnapshot = serverSnapshot;

function normalizePreference(value: string | null): ThemePreference | null {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return null;
}

function getStoredPreference(): ThemePreference | null {
  if (typeof window === "undefined") {
    return null;
  }
  return normalizePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getThemeSnapshot(): ThemeSnapshot {
  if (typeof window === "undefined") {
    return serverSnapshot;
  }

  const preference = getStoredPreference() ?? "system";
  const resolved = preference === "system" ? getSystemTheme() : preference;

  if (
    cachedSnapshot.preference === preference &&
    cachedSnapshot.resolved === resolved
  ) {
    return cachedSnapshot;
  }

  cachedSnapshot = { preference, resolved };
  return cachedSnapshot;
}

export function getThemeServerSnapshot(): ThemeSnapshot {
  return serverSnapshot;
}

export function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => callback();

  window.addEventListener("storage", handler);
  window.addEventListener(THEME_EVENT, handler);
  media.addEventListener("change", handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(THEME_EVENT, handler);
    media.removeEventListener("change", handler);
  };
}

export function setThemePreference(next: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  window.dispatchEvent(new Event(THEME_EVENT));
}
