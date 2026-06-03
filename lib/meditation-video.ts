import themes from "@/content/meditation-video/themes.json";

export const OFFLINE_MEDITATION_VIDEO_SRC =
  "/meditation-videos/sunrise-dawn.mp4";

export type MeditationVideoTheme = {
  id: string;
  label: string;
  description: string;
  videoSrc: string;
  overlay: string;
  panelBackground: string;
  panelBorder: string;
  accent: string;
  mutedAccent: string;
};

export const MEDITATION_VIDEO_THEMES = themes as MeditationVideoTheme[];

export function getMeditationVideoTheme(themeId: string | null | undefined) {
  if (!themeId) {
    return MEDITATION_VIDEO_THEMES[0] ?? null;
  }

  return (
    MEDITATION_VIDEO_THEMES.find((theme) => theme.id === themeId) ??
    MEDITATION_VIDEO_THEMES[0] ??
    null
  );
}

export function getMeditationVideoRoute(params: {
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
