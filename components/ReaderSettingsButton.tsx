"use client";

import { CloseIcon, SettingsIcon } from "@/components/Icons";
import {
  DEFAULT_READER_FONT_SIZE,
  READER_FONT_SIZE_OPTIONS,
  READER_FONT_SIZE_STORAGE_KEY,
  type ReaderFontSize,
} from "@/lib/reader-settings";
import { useEffect, useState } from "react";

type ReaderSettingsButtonProps = {
  fontSize: ReaderFontSize;
  onFontSizeChange: (value: ReaderFontSize) => void;
  className?: string;
};

export function useReaderFontSize() {
  const [fontSize, setFontSize] = useState<ReaderFontSize>(() => {
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
  });

  const updateFontSize = (value: ReaderFontSize) => {
    setFontSize(value);
    try {
      window.localStorage.setItem(READER_FONT_SIZE_STORAGE_KEY, value);
    } catch {
      // Ignore storage failures and keep the in-memory value.
    }
  };

  return { fontSize, setFontSize: updateFontSize };
}

export default function ReaderSettingsButton({
  fontSize,
  onFontSizeChange,
  className,
}: ReaderSettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

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
              borderColor: "var(--border-color)",
              background: "var(--background)",
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
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Adjust how the reader looks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border transition hover:opacity-80"
                style={{ borderColor: "var(--border-color)" }}
                aria-label="Close settings"
              >
                <CloseIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <section
              className="mt-6 space-y-4"
            >
              <div
                className="grid overflow-hidden border sm:grid-cols-3"
                style={{ borderColor: "var(--border-color)" }}
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
                        borderColor: "var(--border-color)",
                        background: isActive
                          ? "var(--foreground)"
                          : "var(--background)",
                        color: isActive
                          ? "var(--background)"
                          : "var(--foreground)",
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
          </div>
        </div>
      )}
    </>
  );
}
