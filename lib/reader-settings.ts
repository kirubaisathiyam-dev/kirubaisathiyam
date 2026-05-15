export const READER_FONT_SIZE_STORAGE_KEY = "reader-font-size";

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
