"use client";

import {
  ArrowLeftIcon,
  CloseIcon,
  FocusModeOffIcon,
  FocusModeOnIcon,
  HeartIcon,
  SettingsIcon,
  ShareIcon,
  VolumeIcon,
} from "@/components/Icons";
import {
  BOOK_CACHE_PREFIX,
  getBookFileSlug,
  type LocalBibleBook,
} from "@/lib/local-bible";
import {
  getMeditationRoute,
  getMeditationTheme,
  MEDITATION_THEMES,
} from "@/lib/meditation";
import { fetchWithOffline, getOfflineData } from "@/lib/offline";
import Image from "next/image";
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

const DEFAULT_AUDIO_VOLUME = 0.48;

function getMeditationTextSize(text: string) {
  const length = text.trim().length;

  if (length <= 60) {
    return "clamp(2rem, 1.1rem + 3.8vw, 4.6rem)";
  }

  if (length <= 110) {
    return "clamp(1.7rem, 1rem + 3vw, 3.8rem)";
  }

  if (length <= 170) {
    return "clamp(1.45rem, 0.95rem + 2.2vw, 3rem)";
  }

  return "clamp(1.2rem, 0.9rem + 1.6vw, 2.35rem)";
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

export default function MeditationExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  const book = searchParams?.get("book")?.trim() || "";
  const chapter = searchParams?.get("chapter")?.trim() || "";
  const verse = searchParams?.get("verse")?.trim() || "";
  const themeParam = searchParams?.get("theme")?.trim() || "";

  const [themeId, setThemeId] = useState(themeParam);
  const [loadedVerse, setLoadedVerse] = useState<LoadedVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const feedbackTimeoutRef = useRef<number | null>(null);

  const activeTheme = useMemo(() => getMeditationTheme(themeId), [themeId]);
  const verseFontSize = useMemo(
    () => getMeditationTextSize(loadedVerse?.text || ""),
    [loadedVerse?.text],
  );
  const backHref = useMemo(() => {
    if (!book || !chapter || !verse) {
      return "/bible/read";
    }

    const params = new URLSearchParams();
    params.set("book", book);
    params.set("chapter", chapter);
    params.set("verses", verse);
    return `/bible/read?${params.toString()}`;
  }, [book, chapter, verse]);

  useEffect(() => {
    setThemeId(themeParam);
  }, [themeParam]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
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
        const cachedBook = await getOfflineData<LocalBibleBook>(cacheKey);

        const resolveLoadedVerse = (bookData: LocalBibleBook | null) => {
          const currentChapter = bookData?.chapters?.find(
            (entry) => entry.chapter === chapter,
          );
          const currentVerse = currentChapter?.verses?.find(
            (entry) => entry.verse === verse,
          );

          if (!currentVerse?.text?.trim()) {
            return null;
          }

          const bookLabel =
            bookData?.book?.tamil?.trim() ||
            bookData?.book?.short?.trim() ||
            bookData?.book?.english?.trim() ||
            book;
          const reference = `${bookLabel} ${chapter}:${verse}`;
          const route = getMeditationRoute({
            book,
            chapter,
            verse,
            theme: activeTheme?.id,
          });
          const baseUrl =
            typeof window !== "undefined" ? window.location.origin : "";

          return {
            book,
            chapter,
            verse,
            text: currentVerse.text.trim(),
            reference,
            shareUrl: baseUrl ? `${baseUrl}${route}` : route,
          };
        };

        if (cachedBook && active) {
          const cachedVerse = resolveLoadedVerse(cachedBook);
          if (cachedVerse) {
            setLoadedVerse(cachedVerse);
            setLoading(false);
          }
        }

        const bookData = await fetchWithOffline<LocalBibleBook>(cacheKey, async () => {
          const response = await fetch(
            `/local-bible/books/${encodeURIComponent(slug)}.json`,
            { cache: "no-cache" },
          );

          if (!response.ok) {
            throw new Error(`Unable to load ${book}.`);
          }

          return (await response.json()) as LocalBibleBook;
        });

        if (!active) {
          return;
        }

        const resolvedVerse = resolveLoadedVerse(bookData);
        if (!resolvedVerse) {
          setLoadedVerse(null);
          setError("Unable to find that verse for meditation.");
          setLoading(false);
          return;
        }

        setLoadedVerse(resolvedVerse);
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
    const audio = audioRef.current;
    if (!audio || !activeTheme) {
      return;
    }

    audio.volume = DEFAULT_AUDIO_VOLUME;
    audio.src = activeTheme.audioSrc;
    audio.load();

    if (!isPlaying) {
      return;
    }

    void audio.play().catch(() => {
      setIsPlaying(false);
    });
  }, [activeTheme, isPlaying]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextUrl = getMeditationRoute({
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
    const audio = audioRef.current;

    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      if (audio) {
        audio.pause();
      }
      void wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  const enterFullscreen = async () => {
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) {
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore fullscreen request failures.
    }
  };

  const exitFullscreen = async () => {
    if (!document.fullscreenElement) {
      return;
    }

    try {
      await document.exitFullscreen();
    } catch {
      // Ignore fullscreen exit failures.
    }
  };

  const requestWakeLock = async () => {
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
  };

  const releaseWakeLock = async () => {
    try {
      await wakeLockRef.current?.release();
    } catch {
      // Ignore wake lock release failures.
    }
    wakeLockRef.current = null;
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      await releaseWakeLock();
      return;
    }

    await enterFullscreen();
    await requestWakeLock();

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      setFeedback("Tap again to allow background audio.");
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

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-black text-white">
      {activeTheme ? (
        <>
          <Image
            src={activeTheme.visualSrc}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="absolute inset-0 object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: activeTheme.overlay }}
          />
        </>
      ) : null}

      <audio ref={audioRef} preload="auto" loop />

      <div className="absolute inset-0 flex flex-col">
        <header className="flex items-center justify-between gap-3 p-4 sm:p-6">
          <button
            type="button"
            onClick={async () => {
              await exitFullscreen();
              router.push(backHref);
            }}
            className="inline-flex h-11 w-11 items-center justify-center border backdrop-blur-md"
            style={{
              background: activeTheme?.panelBackground,
              borderColor: activeTheme?.panelBorder,
              color: activeTheme?.accent,
            }}
            aria-label="Go back"
          >
            <ArrowLeftIcon style={{ width: 16, height: 16 }} />
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center border backdrop-blur-md"
            style={{
              background: activeTheme?.panelBackground,
              borderColor: activeTheme?.panelBorder,
              color: activeTheme?.accent,
            }}
            aria-label="Open meditation settings"
          >
            <SettingsIcon style={{ width: 19, height: 19 }} />
          </button>
        </header>

        <main className="flex min-h-0 flex-1 items-center justify-center px-5 py-8 sm:px-10">
          <div
            className="w-full max-w-4xl border p-6 text-center shadow-2xl backdrop-blur-xl sm:p-10"
            style={{
              background: activeTheme?.panelBackground,
              borderColor: activeTheme?.panelBorder,
              color: activeTheme?.accent,
            }}
          >
            {loading ? (
              <div className="space-y-5">
                <div className="mx-auto h-4 w-28 rounded-full bg-white/20" />
                <div className="mx-auto h-8 w-3/4 rounded-full bg-white/16" />
                <div className="mx-auto h-8 w-2/3 rounded-full bg-white/12" />
              </div>
            ) : error ? (
              <div className="space-y-5">
                <p className="text-sm uppercase tracking-[0.18em]" style={{ color: activeTheme?.mutedAccent }}>
                  Meditation
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
                  className="mx-auto max-w-3xl font-semibold"
                  style={{
                    fontSize: verseFontSize,
                    lineHeight: 1.22,
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
            className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-3 border px-3 py-3 backdrop-blur-xl"
            style={{
              background: activeTheme?.panelBackground,
              borderColor: activeTheme?.panelBorder,
              color: activeTheme?.accent,
            }}
          >
            <button
              type="button"
              onClick={() => void handlePlayPause()}
              className="border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: activeTheme?.panelBorder }}
            >
              {isPlaying ? "Pause audio" : "Play audio"}
            </button>
            <button
              type="button"
              onClick={() => void (isFullscreen ? exitFullscreen() : enterFullscreen())}
              className="inline-flex items-center gap-2 border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: activeTheme?.panelBorder }}
            >
              {isFullscreen ? (
                <FocusModeOnIcon style={{ width: 18, height: 18 }} />
              ) : (
                <FocusModeOffIcon style={{ width: 18, height: 18 }} />
              )}
              <span>{isFullscreen ? "Exit full screen" : "Full screen"}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex items-center gap-2 border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: activeTheme?.panelBorder }}
            >
              <ShareIcon style={{ width: 16, height: 16 }} />
              <span>Share</span>
            </button>
            {feedback ? (
              <p className="w-full text-center text-xs" style={{ color: activeTheme?.mutedAccent }}>
                {feedback}
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
            className="w-full max-w-md border p-5 shadow-2xl backdrop-blur-xl"
            style={{
              background: activeTheme?.panelBackground,
              borderColor: activeTheme?.panelBorder,
              color: activeTheme?.accent,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Meditation Settings</h2>
                <p className="text-sm" style={{ color: activeTheme?.mutedAccent }}>
                  Choose the atmosphere from the files in `public/meditation`.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="flex h-11 w-11 items-center justify-center border"
                style={{ borderColor: activeTheme?.panelBorder }}
                aria-label="Close meditation settings"
              >
                <CloseIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {MEDITATION_THEMES.map((theme) => {
                const isActive = activeTheme?.id === theme.id;

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeId(theme.id)}
                    className="flex w-full items-center justify-between gap-4 border px-4 py-4 text-left"
                    style={{
                      borderColor: isActive ? theme.accent : theme.panelBorder,
                      background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    }}
                    aria-pressed={isActive}
                  >
                    <div className="space-y-1">
                      <p className="text-base font-semibold">{theme.label}</p>
                      <p className="text-sm" style={{ color: theme.mutedAccent }}>
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
