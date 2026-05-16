export const READER_FONT_SIZE_STORAGE_KEY = "reader-font-size";
export const READER_TEMPERATURE_STORAGE_KEY = "reader-temperature";
export const READER_FOCUS_MODE_STORAGE_KEY = "reader-focus-mode";

export const READER_FONT_SIZE_OPTIONS = [
  {
    value: "small",
    label: "Small",
    description: "Compact reading size",
  },
  {
    value: "normal",
    label: "Normal",
    description: "Current default size",
  },
  {
    value: "big",
    label: "Big",
    description: "Larger reading size",
  },
] as const;

export type ReaderFontSize = (typeof READER_FONT_SIZE_OPTIONS)[number]["value"];

export const DEFAULT_READER_FONT_SIZE: ReaderFontSize = "normal";

export function getReaderFontScale(fontSize: ReaderFontSize) {
  switch (fontSize) {
    case "small":
      return 0.92;
    case "big":
      return 1.12;
    default:
      return 1;
  }
}

export const READER_TEMPERATURE_OPTIONS = [
  {
    value: "warm",
    label: "Warm",
  },
  {
    value: "neutral",
    label: "Neutral",
  },
  {
    value: "cool",
    label: "Cool",
  },
] as const;

export type ReaderTemperature =
  (typeof READER_TEMPERATURE_OPTIONS)[number]["value"];

export const DEFAULT_READER_TEMPERATURE: ReaderTemperature = "neutral";

type ReaderPalette = {
  background: string;
  mutedBackground: string;
  foreground: string;
  mutedForeground: string;
  borderColor: string;
  foregroundBible: string;
  highlightBible: string;
};

export function getReaderTemperaturePalette(
  temperature: ReaderTemperature,
  resolvedTheme: "light" | "dark",
): ReaderPalette | null {
  if (temperature === "neutral") {
    return null;
  }

  if (resolvedTheme === "dark") {
    if (temperature === "warm") {
      return {
        background: "#181109",
        mutedBackground: "#241910",
        foreground: "#f5e6d0",
        mutedForeground: "rgba(245, 230, 208, 0.72)",
        borderColor: "rgba(245, 230, 208, 0.16)",
        foregroundBible: "#f0bf67",
        highlightBible: "#744f18",
      };
    }

    return {
      background: "#09131b",
      mutedBackground: "#11202b",
      foreground: "#dcecf8",
      mutedForeground: "rgba(220, 236, 248, 0.72)",
      borderColor: "rgba(220, 236, 248, 0.16)",
      foregroundBible: "#74baff",
      highlightBible: "#18486f",
    };
  }

  if (temperature === "warm") {
    return {
      background: "#f2e6d4",
      mutedBackground: "#e6d5bc",
      foreground: "#32251a",
      mutedForeground: "rgba(50, 37, 26, 0.7)",
      borderColor: "rgba(50, 37, 26, 0.16)",
      foregroundBible: "#9a6400",
      highlightBible: "#e7c792",
    };
  }

  return {
    background: "#dfeef8",
    mutedBackground: "#cfe2f0",
    foreground: "#1c2a35",
    mutedForeground: "rgba(28, 42, 53, 0.7)",
    borderColor: "rgba(28, 42, 53, 0.16)",
    foregroundBible: "#0a6cb0",
    highlightBible: "#b8d7f2",
  };
}
