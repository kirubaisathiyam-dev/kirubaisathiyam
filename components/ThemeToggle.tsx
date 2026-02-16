"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

const storageKey = "ks_theme";
const themeEvent = "ks-theme-change";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

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
  return normalizePreference(window.localStorage.getItem(storageKey));
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

type ThemeSnapshot = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
};

function getSnapshot(): ThemeSnapshot {
  const preference = getStoredPreference() ?? "system";
  const resolved = preference === "system" ? getSystemTheme() : preference;
  return { preference, resolved };
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => callback();

  window.addEventListener("storage", handler);
  window.addEventListener(themeEvent, handler);
  media.addEventListener("change", handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(themeEvent, handler);
    media.removeEventListener("change", handler);
  };
}

export default function ThemeToggle() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => ({
    preference: "system",
    resolved: "light",
  }));
  const { preference, resolved } = snapshot;

  const labels = useMemo(() => {
    if (preference === "system") {
      return {
        label: `Using device theme (${resolved})`,
        icon: "fa-circle-half-stroke",
      };
    }
    return preference === "dark"
      ? {
          label: "Switch to light mode",
          icon: "fa-sun",
        }
      : {
          label: "Switch to dark mode",
          icon: "fa-moon",
        };
  }, [preference, resolved]);

  useEffect(() => {
    const root = document.documentElement;
    if (preference === "system") {
      root.removeAttribute("data-theme");
      root.style.colorScheme = "dark light";
      if (document.body) {
        document.body.removeAttribute("data-theme");
      }
    } else {
      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;
      if (document.body) {
        document.body.dataset.theme = resolved;
      }
    }

    const themeColor = resolved === "dark" ? "#000000" : "#ffffff";
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((meta) => meta.setAttribute("content", themeColor));
  }, [preference, resolved]);

  function toggleTheme() {
    const next: ThemePreference =
      preference === "system"
        ? "dark"
        : preference === "dark"
          ? "light"
          : "system";
    window.localStorage.setItem(storageKey, next);
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="cursor-pointer text-base hover:opacity-70"
      aria-label={labels.label}
      title={labels.label}
    >
      <i
        className={`fa-solid ${labels.icon}`}
        aria-hidden="true"
      ></i>
    </button>
  );
}
