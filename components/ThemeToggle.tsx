"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  MoonIcon,
  SunIcon,
  SystemThemeIcon,
  type LocalIcon,
} from "@/components/Icons";
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
        icon: SystemThemeIcon,
      };
    }
    return preference === "dark"
      ? {
          label: "Switch to light mode",
          icon: SunIcon,
        }
      : {
          label: "Switch to dark mode",
          icon: MoonIcon,
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

  const Icon = labels.icon as LocalIcon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="cursor-pointer text-base hover:opacity-70"
      aria-label={labels.label}
      title={labels.label}
    >
      <Icon style={{ width: 25, height: 25 }} />
    </button>
  );
}
