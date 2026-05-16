"use client";

import {
  CloseIcon,
  FocusModeOffIcon,
  FocusModeOnIcon,
  SettingsIcon,
} from "@/components/Icons";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DEFAULT_READER_TEMPERATURE,
  DEFAULT_READER_FONT_SIZE,
  READER_FOCUS_MODE_STORAGE_KEY,
  READER_FONT_SIZE_OPTIONS,
  READER_FONT_SIZE_STORAGE_KEY,
  getReaderFontScale,
  READER_TEMPERATURE_OPTIONS,
  READER_TEMPERATURE_STORAGE_KEY,
  type ReaderFontSize,
  type ReaderTemperature,
} from "@/lib/reader-settings";
import { getThemeSnapshot, subscribeTheme } from "@/lib/theme";
import {
  useCallback,
  useEffect,
  useSyncExternalStore,
  useState,
  type RefObject,
} from "react";
import type { ReactNode } from "react";

type ReaderSettingsButtonProps = {
  fontSize: ReaderFontSize;
  onFontSizeChange: (value: ReaderFontSize) => void;
  temperature: ReaderTemperature;
  onTemperatureChange: (value: ReaderTemperature) => void;
  extraContent?: ReactNode;
  className?: string;
};

const READER_SETTINGS_EVENT = "ks-reader-settings-change";

function subscribeReaderSettings(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(READER_SETTINGS_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(READER_SETTINGS_EVENT, handler);
  };
}

function getStoredReaderFontSize(): ReaderFontSize {
  if (typeof window === "undefined") {
    return DEFAULT_READER_FONT_SIZE;
  }

  try {
    const saved = window.localStorage.getItem(READER_FONT_SIZE_STORAGE_KEY);
    if (
      saved &&
      READER_FONT_SIZE_OPTIONS.some((option) => option.value === saved)
    ) {
      return saved as ReaderFontSize;
    }
  } catch {
    // Ignore storage failures and keep the default size.
  }

  return DEFAULT_READER_FONT_SIZE;
}

function getStoredReaderTemperature(): ReaderTemperature {
  if (typeof window === "undefined") {
    return DEFAULT_READER_TEMPERATURE;
  }

  try {
    const saved = window.localStorage.getItem(READER_TEMPERATURE_STORAGE_KEY);
    if (
      saved &&
      READER_TEMPERATURE_OPTIONS.some((option) => option.value === saved)
    ) {
      return saved as ReaderTemperature;
    }
  } catch {
    // Ignore storage failures and keep the default temperature.
  }

  return DEFAULT_READER_TEMPERATURE;
}

function getStoredReaderFocusMode() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(READER_FOCUS_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function useReaderFontSize() {
  const fontSize = useSyncExternalStore(
    subscribeReaderSettings,
    getStoredReaderFontSize,
    () => DEFAULT_READER_FONT_SIZE,
  );

  const updateFontSize = (value: ReaderFontSize) => {
    try {
      window.localStorage.setItem(READER_FONT_SIZE_STORAGE_KEY, value);
      window.dispatchEvent(new Event(READER_SETTINGS_EVENT));
    } catch {
      // Ignore storage failures.
    }
  };

  return { fontSize, setFontSize: updateFontSize };
}

export function useReaderTemperature() {
  const temperature = useSyncExternalStore(
    subscribeReaderSettings,
    getStoredReaderTemperature,
    () => DEFAULT_READER_TEMPERATURE,
  );

  const updateTemperature = (value: ReaderTemperature) => {
    try {
      window.localStorage.setItem(READER_TEMPERATURE_STORAGE_KEY, value);
      window.dispatchEvent(new Event(READER_SETTINGS_EVENT));
    } catch {
      // Ignore storage failures.
    }
  };

  return { temperature, setTemperature: updateTemperature };
}

export function useReaderFocusMode() {
  const focusMode = useSyncExternalStore(
    subscribeReaderSettings,
    getStoredReaderFocusMode,
    () => false,
  );

  const updateFocusMode = useCallback((value: boolean) => {
    try {
      window.localStorage.setItem(
        READER_FOCUS_MODE_STORAGE_KEY,
        value ? "true" : "false",
      );
      window.dispatchEvent(new Event(READER_SETTINGS_EVENT));
    } catch {
      // Ignore storage failures.
    }
  }, []);

  return { focusMode, setFocusMode: updateFocusMode };
}

export function useApplyReaderSettings(
  targetRef: RefObject<HTMLElement | null>,
) {
  const { fontSize } = useReaderFontSize();
  const { temperature } = useReaderTemperature();
  const themeSnapshot = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeSnapshot,
  );

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    target.style.setProperty(
      "--reader-font-scale",
      String(getReaderFontScale(fontSize)),
    );
    return () => {
      target.style.removeProperty("--reader-font-scale");
    };
  }, [fontSize, targetRef]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    target.dataset.readerTheme = themeSnapshot.resolved;
    target.dataset.readerSurface = "true";
    if (temperature === "neutral") {
      target.removeAttribute("data-reader-temperature");
    } else {
      target.dataset.readerTemperature = temperature;
    }

    return () => {
      target.removeAttribute("data-reader-surface");
      target.removeAttribute("data-reader-theme");
      if (temperature === "neutral") {
        target.removeAttribute("data-reader-temperature");
      }
    };
  }, [temperature, themeSnapshot.resolved, targetRef]);
}

export function useApplyReaderFocusMode() {
  const { focusMode, setFocusMode } = useReaderFocusMode();

  useEffect(() => {
    if (typeof document === "undefined") return;

    let wakeLock: { release: () => Promise<void> } | null = null;
    let cancelled = false;

    const releaseWakeLock = async () => {
      if (!wakeLock) return;
      try {
        await wakeLock.release();
      } catch {
        // Ignore wake lock release failures.
      }
      wakeLock = null;
    };

    const requestWakeLock = async () => {
      if (
        !focusMode ||
        typeof navigator === "undefined" ||
        !("wakeLock" in navigator)
      ) {
        return;
      }

      try {
        wakeLock = await (
          navigator as Navigator & {
            wakeLock?: {
              request: (
                type: "screen",
              ) => Promise<{ release: () => Promise<void> }>;
            };
          }
        ).wakeLock?.request("screen");

        if (cancelled) {
          await releaseWakeLock();
        }
      } catch {
        // Ignore wake lock request failures.
      }
    };

    const enableFocusMode = async () => {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {
          // Ignore fullscreen request failures.
        }
      }
      await requestWakeLock();
    };

    const disableFocusMode = async () => {
      await releaseWakeLock();
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // Ignore fullscreen exit failures.
        }
      }
    };

    if (focusMode) {
      void enableFocusMode();
    } else {
      void disableFocusMode();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && focusMode) {
        void requestWakeLock();
      }
    };

    const handleFullscreenChange = () => {
      if (focusMode && !document.fullscreenElement) {
        setFocusMode(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      void releaseWakeLock();
    };
  }, [focusMode, setFocusMode]);
}

export default function ReaderSettingsButton({
  fontSize,
  onFontSizeChange,
  temperature,
  onTemperatureChange,
  extraContent,
  className,
}: ReaderSettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { focusMode, setFocusMode } = useReaderFocusMode();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`cursor-pointer rounded-full border p-3 text-xs font-semibold shadow-sm transition hover:opacity-80 ${
          className ?? ""
        }`}
        style={{
          borderColor: "var(--border-color)",
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
        aria-label="Open reader settings"
      >
        <SettingsIcon style={{ width: 20, height: 20 }} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-settings-title"
        >
          <div
            className="w-full max-w-md border p-5 shadow-xl"
            style={{
              borderColor: "var(--theme-border-color)",
              background: "var(--theme-background)",
              color: "var(--theme-foreground)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 id="reader-settings-title" className="text-xl font-semibold">
                  Reader Settings
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--theme-muted-foreground)" }}
                >
                  Adjust how the reader looks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border transition hover:opacity-80"
                style={{
                  borderColor: "var(--theme-border-color)",
                  color: "var(--theme-foreground)",
                }}
                aria-label="Close settings"
              >
                <CloseIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <section className="mt-6 space-y-4">
              {extraContent ? <div>{extraContent}</div> : null}

              <div
                className="grid grid-cols-3 overflow-hidden border"
                style={{ borderColor: "var(--theme-border-color)" }}
              >
                {READER_FONT_SIZE_OPTIONS.map((option) => {
                  const isActive = option.value === fontSize;
                  const previewClass =
                    option.value === "small"
                      ? "text-lg"
                      : option.value === "big"
                        ? "text-4xl"
                        : "text-2xl";

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onFontSizeChange(option.value)}
                      className={`flex min-h-20 items-center justify-center px-4 py-5 transition hover:opacity-80 ${
                        option.value !== READER_FONT_SIZE_OPTIONS[0].value
                          ? "border-l"
                          : ""
                      }`}
                      style={{
                        borderColor: "var(--theme-border-color)",
                        background: isActive
                          ? "var(--theme-foreground)"
                          : "var(--theme-background)",
                        color: isActive
                          ? "var(--theme-background)"
                          : "var(--theme-foreground)",
                      }}
                      aria-pressed={isActive}
                    >
                      <span className={`font-semibold leading-none ${previewClass}`}>
                        aA
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-4 space-y-4">
              <div
                className="grid grid-cols-3 overflow-hidden border"
                style={{ borderColor: "var(--theme-border-color)" }}
              >
                {READER_TEMPERATURE_OPTIONS.map((option) => {
                  const isActive = option.value === temperature;
                  const previewBackground =
                    option.value === "warm"
                      ? "#c98a3d"
                      : option.value === "cool"
                        ? "#5b9bd5"
                        : "linear-gradient(135deg, #b9b9b9, #707070)";

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onTemperatureChange(option.value)}
                      className={`flex min-h-16 items-center justify-center px-4 py-4 transition hover:opacity-80 ${
                        option.value !== READER_TEMPERATURE_OPTIONS[0].value
                          ? "border-l"
                          : ""
                      }`}
                      style={{
                        borderColor: "var(--theme-border-color)",
                        background: isActive
                          ? "var(--theme-foreground)"
                          : "var(--theme-background)",
                      }}
                      aria-pressed={isActive}
                    >
                      <span
                        className="h-5 w-10 rounded-full"
                        style={{
                          background: previewBackground,
                          boxShadow: isActive
                            ? "0 0 0 1px var(--background) inset"
                            : "0 0 0 1px rgba(0,0,0,0.08) inset",
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setFocusMode(!focusMode)}
                className="flex w-full items-center justify-between rounded border px-4 py-3 text-sm font-semibold transition hover:opacity-80"
                style={{ borderColor: "var(--theme-border-color)" }}
                aria-pressed={focusMode}
              >
                <span>Focus mode</span>
                {focusMode ? (
                  <FocusModeOnIcon
                    className="shrink-0"
                    style={{ width: 24, height: 24 }}
                  />
                ) : (
                  <FocusModeOffIcon
                    className="shrink-0"
                    style={{ width: 24, height: 24 }}
                  />
                )}
              </button>

              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  const themeButton = document.getElementById("reader-theme-toggle");
                  themeButton?.click();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    const themeButton = document.getElementById("reader-theme-toggle");
                    themeButton?.click();
                  }
                }}
                className="flex w-full cursor-pointer items-center justify-between rounded border px-4 py-3 text-sm font-semibold transition hover:opacity-80"
                style={{ borderColor: "var(--theme-border-color)" }}
              >
                <span>Theme</span>
                <ThemeToggle />
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
