"use client";

import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HeartIcon,
  SettingsIcon,
  ShareIcon,
  VolumeIcon,
  VolumeOffIcon,
} from "@/components/Icons";
import {
  BOOK_CACHE_PREFIX,
  getBookFileSlug,
  type LocalBibleBook,
} from "@/lib/local-bible";
import { buildBiblePath } from "@/lib/bible-routes";
import {
  getMeditationVideoRoute,
  getMeditationVideoTheme,
  MEDITATION_VIDEO_THEMES,
  OFFLINE_MEDITATION_VIDEO_SRC,
} from "@/lib/meditation-video";
import { getOfflineData } from "@/lib/offline";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type LoadedVerse = {
  book: string;
  chapter: string;
  verse: string;
  text: string;
  reference: string;
  shareUrl: string;
};

type VerseNavigationTarget = {
  book: string;
  chapter: string;
  verse: string;
};

function getMeditationTextSize(text: string) {
  const length = text.trim().length;
  const vw = Math.max(0.8, 2.2 - length / 200);
  return `clamp(0.5rem, 0.7rem + ${vw}vw, 2rem)`;
}

async function copyToClipboard(text: string) {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function MeditationVideoExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [themeId, setThemeId] = useState(
    MEDITATION_VIDEO_THEMES[0]?.id ?? "",
  );
  const [loadedVerse, setLoadedVerse] = useState<LoadedVerse | null>(null);
  const [bookData, setBookData] = useState<LocalBibleBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const book = hasMounted ? searchParams?.get("book")?.trim() || "" : "";
  const chapter = hasMounted ? searchParams?.get("chapter")?.trim() || "" : "";
  const verse = hasMounted ? searchParams?.get("verse")?.trim() || "" : "";
  const themeParam = hasMounted ? searchParams?.get("theme")?.trim() || "" : "";

  const activeTheme = useMemo(
    () => getMeditationVideoTheme(themeId),
    [themeId],
  );
  const videoSource = isOnline
    ? activeTheme?.videoSrc ?? OFFLINE_MEDITATION_VIDEO_SRC
    : OFFLINE_MEDITATION_VIDEO_SRC;
  const verseFontSize = useMemo(
    () => getMeditationTextSize(loadedVerse?.text || ""),
    [loadedVerse?.text],
  );
  const backHref = useMemo(() => {
    if (!book || !chapter || !verse) {
      return "/bible";
    }
    return buildBiblePath({ book, chapter, verses: verse });
  }, [book, chapter, verse]);
  const verseNavigation = useMemo(() => {
    if (!bookData?.chapters?.length || !chapter || !verse) {
      return {
        previous: null as VerseNavigationTarget | null,
        next: null as VerseNavigationTarget | null,
      };
    }

    const chapterIndex = bookData.chapters.findIndex(
      (entry) => entry.chapter === chapter,
    );
    if (chapterIndex < 0) {
      return {
        previous: null as VerseNavigationTarget | null,
        next: null as VerseNavigationTarget | null,
      };
    }

    const chapterEntry = bookData.chapters[chapterIndex];
    const verses = chapterEntry.verses || [];
    const verseIndex = verses.findIndex((entry) => entry.verse === verse);
    if (verseIndex < 0) {
      return {
        previous: null as VerseNavigationTarget | null,
        next: null as VerseNavigationTarget | null,
      };
    }

    let previous: VerseNavigationTarget | null = null;
    let next: VerseNavigationTarget | null = null;

    if (verseIndex > 0) {
      previous = { book, chapter, verse: verses[verseIndex - 1]?.verse || "" };
    } else {
      for (let idx = chapterIndex - 1; idx >= 0; idx -= 1) {
        const previousChapter = bookData.chapters[idx];
        const previousVerses = previousChapter?.verses || [];
        const lastVerse = previousVerses[previousVerses.length - 1];
        if (lastVerse?.verse) {
          previous = {
            book,
            chapter: previousChapter.chapter,
            verse: lastVerse.verse,
          };
          break;
        }
      }
    }

    if (verseIndex < verses.length - 1) {
      next = { book, chapter, verse: verses[verseIndex + 1]?.verse || "" };
    } else {
      for (let idx = chapterIndex + 1; idx < bookData.chapters.length; idx += 1) {
        const nextChapter = bookData.chapters[idx];
        const nextVerses = nextChapter?.verses || [];
        const firstVerse = nextVerses[0];
        if (firstVerse?.verse) {
          next = {
            book,
            chapter: nextChapter.chapter,
            verse: firstVerse.verse,
          };
          break;
        }
      }
    }

    return { previous, next };
  }, [book, bookData, chapter, verse]);

  useEffect(() => {
    setHasMounted(true);
    setIsOnline(navigator.onLine);
  }, []);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    setThemeId(themeParam || MEDITATION_VIDEO_THEMES[0]?.id || "");
  }, [hasMounted, themeParam]);

  useEffect(() => {
    async function releaseWakeLock() {
      try {
        await wakeLockRef.current?.release();
      } catch {
        // Ignore wake lock release failures.
      }
      wakeLockRef.current = null;
    }

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        return;
      }

      videoRef.current?.pause();
      setIsPlaying(false);
      void releaseWakeLock();
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadVerse = async () => {
      if (!book || !chapter || !verse) {
        setError("Meditation needs a verse query.");
        setLoadedVerse(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const slug = getBookFileSlug(book);
        const cacheKey = `${BOOK_CACHE_PREFIX}${slug}`;
        let nextBookData: LocalBibleBook | null = null;

        try {
          const response = await fetch(
            `/local-bible/books/${encodeURIComponent(slug)}.json`,
            { cache: "no-cache" },
          );

          if (response.ok) {
            nextBookData = (await response.json()) as LocalBibleBook;
          }
        } catch {
          // Fall back to offline cache below.
        }

        if (!nextBookData) {
          nextBookData = await getOfflineData<LocalBibleBook>(cacheKey);
        }

        if (!nextBookData) {
          throw new Error(`Unable to load ${book}.`);
        }

        if (!active) {
          return;
        }

        setBookData(nextBookData);
        const currentChapter = nextBookData.chapters?.find(
          (entry) => entry.chapter === chapter,
        );
        const currentVerse = currentChapter?.verses?.find(
          (entry) => entry.verse === verse,
        );

        if (!currentVerse?.text?.trim()) {
          setLoadedVerse(null);
          setError("Unable to find that verse for meditation.");
          setLoading(false);
          return;
        }

        const bookLabel =
          nextBookData.book?.tamil?.trim() ||
          nextBookData.book?.short?.trim() ||
          nextBookData.book?.english?.trim() ||
          book;
        const reference = `${bookLabel} ${chapter}:${verse}`;
        const route = getMeditationVideoRoute({
          book,
          chapter,
          verse,
          theme: activeTheme?.id,
        });
        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : "";

        setLoadedVerse({
          book,
          chapter,
          verse,
          text: currentVerse.text.trim(),
          reference,
          shareUrl: baseUrl ? `${baseUrl}${route}` : route,
        });
        setLoading(false);
      } catch (err) {
        if (!active) {
          return;
        }

        setLoadedVerse(null);
        setError(err instanceof Error ? err.message : "Unable to load meditation.");
        setLoading(false);
      }
    };

    void loadVerse();

    return () => {
      active = false;
    };
  }, [activeTheme?.id, book, chapter, verse]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSource) {
      return;
    }

    video.muted = !isPlaying;
    video.defaultMuted = !isPlaying;
    video.playsInline = true;
    video.loop = true;
    video.preload = "metadata";
    video.load();

    void video.play().catch(() => {
      if (isPlaying) {
        setIsPlaying(false);
      }
    });
  }, [isPlaying, videoSource]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextUrl = getMeditationVideoRoute({
      book,
      chapter,
      verse,
      theme: activeTheme?.id,
    });
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }, [activeTheme?.id, book, chapter, verse]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [settingsOpen]);

  useEffect(() => {
    const videoElement = videoRef.current;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      videoElement?.pause();
      void wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  async function enterFullscreen() {
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) {
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore fullscreen request failures.
    }
  }

  async function exitFullscreen() {
    if (!document.fullscreenElement) {
      return;
    }

    try {
      await document.exitFullscreen();
    } catch {
      // Ignore fullscreen exit failures.
    }
  }

  async function requestWakeLock() {
    if (
      typeof navigator === "undefined" ||
      !("wakeLock" in navigator) ||
      wakeLockRef.current
    ) {
      return;
    }

    try {
      wakeLockRef.current = await (
        navigator as Navigator & {
          wakeLock?: {
            request: (
              type: "screen",
            ) => Promise<{ release: () => Promise<void> }>;
          };
        }
      ).wakeLock?.request("screen");
    } catch {
      // Ignore wake lock failures.
    }
  }

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!isOnline) {
      setFeedback("Video meditation needs an internet connection.");
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(""), 2200);
      return;
    }

    if (isPlaying) {
      await exitFullscreen();
      return;
    }

    await enterFullscreen();
    await requestWakeLock();

    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setFeedback("Tap again to allow video playback.");
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(""), 2200);
    }
  };

  const handleShare = async () => {
    if (!loadedVerse) {
      return;
    }

    const shareText = `${loadedVerse.text}\n\n${loadedVerse.reference}`;

    if (navigator?.share) {
      try {
        await navigator.share({
          title: loadedVerse.reference,
          text: shareText,
          url: loadedVerse.shareUrl,
        });
        return;
      } catch {
        // fall through to copy
      }
    }

    const copied = await copyToClipboard(`${shareText}\n${loadedVerse.shareUrl}`);
    setFeedback(copied ? "Meditation link copied." : "Unable to share right now.");
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(""), 2200);
  };

  const handleNavigateVerse = (target: VerseNavigationTarget | null) => {
    if (!target) {
      return;
    }

    router.push(
      getMeditationVideoRoute({
        book: target.book,
        chapter: target.chapter,
        verse: target.verse,
        theme: activeTheme?.id,
      }),
    );
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-black text-white">
      {hasMounted && videoSource ? (
        <>
          <video
            ref={videoRef}
            key={videoSource}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            autoPlay
            playsInline
            loop
            preload="metadata"
          >
            <source src={videoSource} type="video/mp4" />
          </video>
          <div
            className="absolute inset-0"
            style={{ background: activeTheme.overlay }}
          />
        </>
      ) : null}

      <div className="absolute inset-0 flex flex-col">
        <header className="flex items-center justify-between gap-3 p-4 sm:p-6">
          <button
            type="button"
            onClick={async () => {
              await exitFullscreen();
              router.push(backHref);
            }}
            className="inline-flex h-11 w-11 items-center justify-center"
            style={{ color: activeTheme?.accent }}
            aria-label="Go back"
          >
            <ArrowLeftIcon style={{ width: 16, height: 16 }} />
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center"
            style={{ color: activeTheme?.accent }}
            aria-label="Open meditation settings"
          >
            <SettingsIcon style={{ width: 19, height: 19 }} />
          </button>
        </header>

        <main className="flex min-h-0 flex-1 items-center justify-center px-5 py-8 sm:px-10">
          <div
            className="w-full max-w-6xl p-6 text-center sm:p-10"
            style={{ color: activeTheme?.accent }}
          >
            {loading ? (
              <div className="space-y-5">
                <div className="mx-auto h-4 w-28 bg-white/20" />
                <div className="mx-auto h-8 w-3/4 bg-white/16" />
                <div className="mx-auto h-8 w-2/3 bg-white/12" />
                <div className="mx-auto h-8 w-3/4 bg-white/16" />
                <div className="mx-auto h-8 w-2/3 bg-white/12" />
              </div>
            ) : error ? (
              <div className="space-y-5">
                <p
                  className="text-sm uppercase tracking-[0.18em]"
                  style={{ color: activeTheme?.mutedAccent }}
                >
                  Meditation Video
                </p>
                <p className="text-lg font-medium">{error}</p>
              </div>
            ) : loadedVerse ? (
              <div className="space-y-6 sm:space-y-8">
                <p
                  className="text-sm font-semibold uppercase tracking-[0.2em]"
                  style={{ color: activeTheme?.mutedAccent }}
                >
                  {loadedVerse.reference}
                </p>
                <blockquote
                  className="mx-auto max-w-5xl font-semibold"
                  style={{
                    fontSize: verseFontSize,
                    lineHeight: 1.8,
                    textShadow: "0 14px 36px rgba(0, 0, 0, 0.28)",
                  }}
                >
                  <span>&ldquo;{loadedVerse.text}&rdquo;</span>
                </blockquote>
              </div>
            ) : null}
          </div>
        </main>

        <footer className="p-4 sm:p-6">
          <div
            className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-3 px-3 py-3"
            style={{ color: activeTheme?.accent }}
          >
            <button
              type="button"
              onClick={() => handleNavigateVerse(verseNavigation.previous)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
              style={{ borderColor: activeTheme?.panelBorder }}
              aria-label="Previous verse"
              title="Previous verse"
              disabled={!verseNavigation.previous}
            >
              <ChevronLeftIcon style={{ width: 20, height: 20 }} />
            </button>
            <button
              type="button"
              onClick={() => void handlePlayPause()}
              className="flex h-11 w-11 items-center justify-center rounded-full border"
              style={{ borderColor: activeTheme?.panelBorder }}
              aria-label={isPlaying ? "Turn sound off" : "Start meditation video"}
              title={isPlaying ? "Sound on" : "Play meditation"}
            >
              {isPlaying ? (
                <VolumeIcon style={{ width: 20, height: 20 }} />
              ) : (
                <VolumeOffIcon style={{ width: 20, height: 20 }} />
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border"
              style={{ borderColor: activeTheme?.panelBorder }}
              aria-label="Share meditation verse"
              title="Share"
            >
              <ShareIcon style={{ width: 16, height: 16 }} />
            </button>
            <button
              type="button"
              onClick={() => handleNavigateVerse(verseNavigation.next)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
              style={{ borderColor: activeTheme?.panelBorder }}
              aria-label="Next verse"
              title="Next verse"
              disabled={!verseNavigation.next}
            >
              <ChevronRightIcon style={{ width: 20, height: 20 }} />
            </button>
            {feedback ? (
              <p
                className="w-full text-center text-xs"
                style={{ color: activeTheme?.mutedAccent }}
              >
                {feedback}
              </p>
            ) : null}
            {hasMounted && !isOnline ? (
              <p
                className="w-full text-center text-[11px]"
                style={{ color: activeTheme?.mutedAccent }}
              >
                You are offline. This cached video is available, but other themes need internet.
              </p>
            ) : null}
          </div>
        </footer>
      </div>

      {settingsOpen ? (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="flex max-h-[min(88vh,48rem)] w-full max-w-md flex-col border p-5 shadow-2xl backdrop-blur-xl"
            style={{
              background: activeTheme?.panelBackground,
              borderColor: activeTheme?.panelBorder,
              color: activeTheme?.accent,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Meditation Video Settings</h2>
                <p
                  className="text-sm"
                  style={{ color: activeTheme?.mutedAccent }}
                >
                  Choose the video atmosphere for your meditation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center justify-center"
                style={{ borderColor: activeTheme?.panelBorder }}
                aria-label="Close meditation video settings"
              >
                <CloseIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div className="mt-5 space-y-3 overflow-y-auto pr-1">
              {MEDITATION_VIDEO_THEMES.map((theme) => {
                const isActive = activeTheme?.id === theme.id;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeId(theme.id)}
                    className="flex w-full items-center justify-between gap-4 border px-4 py-4 text-left"
                    style={{
                      borderColor: isActive ? theme.accent : theme.panelBorder,
                      background: isActive
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                    }}
                    aria-pressed={isActive}
                  >
                    <div className="space-y-1">
                      <p className="text-base font-semibold">{theme.label}</p>
                      <p
                        className="text-sm"
                        style={{ color: theme.mutedAccent }}
                      >
                        {theme.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <VolumeIcon style={{ width: 18, height: 18 }} />
                      <HeartIcon style={{ width: 18, height: 18 }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
