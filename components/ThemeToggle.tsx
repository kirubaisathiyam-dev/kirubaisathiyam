"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from "@/lib/theme";

export default function ThemeToggle() {
  const { preference, resolved } = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

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
    setThemePreference(next);
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
