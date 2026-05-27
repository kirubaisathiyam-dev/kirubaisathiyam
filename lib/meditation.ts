import themes from "@/content/meditation/themes.json";

export type MeditationTheme = {
  id: string;
  label: string;
  description: string;
  visualSrc: string;
  audioSrc: string;
  overlay: string;
  panelBackground: string;
  panelBorder: string;
  accent: string;
  mutedAccent: string;
};

export const MEDITATION_THEMES = themes as MeditationTheme[];

export function getMeditationTheme(themeId: string | null | undefined) {
  if (!themeId) {
    return MEDITATION_THEMES[0] ?? null;
  }

  return (
    MEDITATION_THEMES.find((theme) => theme.id === themeId) ??
    MEDITATION_THEMES[0] ??
    null
  );
}

export function getMeditationRoute(params: {
  book: string;
  chapter: string;
  verse: string;
  theme?: string | null;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("book", params.book);
  searchParams.set("chapter", params.chapter);
  searchParams.set("verse", params.verse);
  if (params.theme) {
    searchParams.set("theme", params.theme);
  }
  return `/meditate?${searchParams.toString()}`;
}
