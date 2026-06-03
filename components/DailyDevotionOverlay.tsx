"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, PlayIcon } from "@/components/Icons";
import DailyVerseLikeButton from "@/components/DailyVerseLikeButton";
import DevotionShareCard from "@/components/DevotionShareCard";
import { HeroOverlaySkeleton } from "@/components/PageSkeletons";
import ShareButton from "@/components/ShareButton";
import {
  captureShareImage,
  default as VerseOfTheDayShareButton,
} from "@/components/VerseOfTheDayShareButton";
import { getBookByCode, parseBibleReference } from "@/lib/bible";
import {
  DEVOTION_ATTRIBUTION,
  formatDevotionLabel,
  getDevotionImageFileName,
  getCurrentDevotionSlot,
  getDevotionPreviewText,
  getDevotionRoute,
  getDevotionSlug,
  getTodayDevotionCandidates,
  SITE_TIME_ZONE,
  type DailyDevotionRecord,
} from "@/lib/daily-devotion";
import { getBookFileSlug, type LocalBibleBook } from "@/lib/local-bible";
import { getMeditationRoute } from "@/lib/meditation";

type DailyDevotion = {
  date: string;
  slot: "am" | "pm";
  rawReference: string;
  reference: string;
  verse: string;
  devotion: string;
  image: string;
  imagePhotographerName: string | null;
  imagePhotographerUrl: string | null;
  imageUnsplashUrl: string | null;
  slug: string;
  day: number;
};

type UnsplashImageResponse = {
  url: string;
  photographerName: string | null;
  photographerUrl: string | null;
  unsplashUrl: string | null;
  source: "unsplash" | "picsum";
};

function getShareVerseTypography(verse: string) {
  const characterCount = verse.replace(/\s+/g, " ").trim().length;
  const wordCount = verse.trim().split(/\s+/).filter(Boolean).length;

  if (characterCount > 300 || wordCount > 52) {
    return {
      blockquoteClassName: "leading-[1.7] text-base",
    };
  }

  if (characterCount > 220 || wordCount > 38) {
    return {
      blockquoteClassName: "leading-[1.78] text-md",
    };
  }

  return {
    blockquoteClassName: "leading-[1.85] text-lg",
  };
}

function getVerseRange(verseRange: string) {
  const [startValue, endValue] = verseRange.split("-");
  const start = Number(startValue);
  const end = Number(endValue ?? startValue);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return [];
  }

  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) =>
    String(start + index),
  );
}

function getDevotionImageStorageKey(slug: string) {
  return `hero-image:v3:devotion:${slug}`;
}

function readCachedDevotionImage(slug: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getDevotionImageStorageKey(slug));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as UnsplashImageResponse;
  } catch {
    return null;
  }
}

function writeCachedDevotionImage(slug: string, image: UnsplashImageResponse) {
  if (typeof window === "undefined" || !image.url) {
    return;
  }

  try {
    window.localStorage.setItem(
      getDevotionImageStorageKey(slug),
      JSON.stringify(image),
    );
  } catch {
    // Ignore storage failures.
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function getVerseDetails(reference: string) {
  const rawReference = reference.replace(/[()]/g, "").trim();
  const parsedReference = parseBibleReference(rawReference);

  if (!parsedReference) {
    return {
      rawReference,
      reference: rawReference || reference,
      verse: "",
    };
  }

  const [bookCode = "", chapter = "", verseRange = ""] =
    parsedReference.passageId.split(".");
  const book = getBookByCode(bookCode);
  const bookName = book?.name ?? "";
  const bookData = bookName
    ? await fetchJson<LocalBibleBook>(
        `/local-bible/books/${getBookFileSlug(bookName)}.json`,
      )
    : null;
  const tamilBookName = bookData?.book?.tamil?.trim() || bookName;
  const chapterData = bookData?.chapters?.find(
    (item) => item.chapter === chapter,
  );
  const verseNumbers = new Set(getVerseRange(verseRange));
  const verse = (chapterData?.verses ?? [])
    .filter((item) => verseNumbers.has(item.verse))
    .map((item) => item.text)
    .join(" ");

  return {
    rawReference,
    reference:
      tamilBookName && chapter && verseRange
        ? `${tamilBookName} ${chapter}:${verseRange}`
        : rawReference,
    verse,
  };
}

async function getClientDailyDevotion() {
  const entries = await fetchJson<DailyDevotionRecord[]>("/daily-devotion.json");

  if (!entries?.length) {
    return null;
  }

  const now = new Date();
  const slot = getCurrentDevotionSlot(now, SITE_TIME_ZONE);
  const entry = getTodayDevotionCandidates(now, SITE_TIME_ZONE)
    .map((candidate) =>
      entries.find((item) => item.date === candidate && item[slot]?.verse),
    )
    .find(Boolean);

  if (!entry?.date) {
    return null;
  }

  const slotEntry = entry[slot];
  if (!slotEntry?.verse) {
    return null;
  }

  const slug = getDevotionSlug(entry.date, slot);
  const verseDetails = await getVerseDetails(slotEntry.verse);

  return {
    date: entry.date,
    slot,
    rawReference: verseDetails.rawReference,
    reference: verseDetails.reference,
    verse: verseDetails.verse,
    devotion: slotEntry.devotion ?? "",
    image: "",
    imagePhotographerName: null,
    imagePhotographerUrl: null,
    imageUnsplashUrl: null,
    slug,
    day: Number(entry.date.split(" ")[0]) || 1,
  } satisfies DailyDevotion;
}

function DailyDevotionSkeleton() {
  return <HeroOverlaySkeleton />;
}

export default function DailyDevotionOverlay() {
  const [dailyDevotion, setDailyDevotion] = useState<DailyDevotion | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const loadRequestIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function loadDevotion() {
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      const devotion = await getClientDailyDevotion();
      if (!isMounted || loadRequestIdRef.current !== requestId) {
        return;
      }

      setDailyDevotion((current) => {
        if (
          current?.slug === devotion?.slug &&
          current?.reference === devotion?.reference &&
          current?.verse === devotion?.verse &&
          current?.devotion === devotion?.devotion
        ) {
          return current;
        }

        return devotion;
      });
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void loadDevotion();
    };

    const handleFocus = () => {
      void loadDevotion();
    };

    const handleOnline = () => {
      setIsOnline(true);
      setImageLoadFailed(false);
      void loadDevotion();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    void loadDevotion();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const devotionSlug: string | null = dailyDevotion?.slug ?? null;
    if (devotionSlug === null) {
      return;
    }
    const resolvedDevotionSlug = devotionSlug;

    let isMounted = true;

    async function loadImage() {
      const cachedImage = readCachedDevotionImage(resolvedDevotionSlug);
      const image =
        cachedImage?.url && cachedImage.source === "unsplash"
          ? cachedImage
          : await fetchJson<UnsplashImageResponse>(
              `/api/unsplash-photo?context=devotion&id=${encodeURIComponent(resolvedDevotionSlug)}`,
            );

      if (!isMounted || !image?.url) {
        return;
      }

      writeCachedDevotionImage(resolvedDevotionSlug, image);
      setImageLoadFailed(false);
      setDailyDevotion((current) => {
        if (!current || current.slug !== resolvedDevotionSlug) {
          return current;
        }

        return {
          ...current,
          image: image.url,
          imagePhotographerName: image.photographerName,
          imagePhotographerUrl: image.photographerUrl,
          imageUnsplashUrl: image.unsplashUrl,
        };
      });
    }

    void loadImage();

    return () => {
      isMounted = false;
    };
  }, [dailyDevotion?.slug]);

  if (!dailyDevotion) {
    return <DailyDevotionSkeleton />;
  }

  const shouldShowImage =
    Boolean(dailyDevotion.image) && isOnline && !imageLoadFailed;
  const shareTitle = `Daily Devotion - ${dailyDevotion.reference}`;
  const shareTargetId = "daily-devotion-share-card";
  const sharePath = getDevotionRoute(dailyDevotion.slug);
  const shareUrl =
    typeof window === "undefined"
      ? sharePath
      : `${window.location.origin}${sharePath}`;
  const heroButtonStyle = {
    borderColor: "rgba(237, 237, 237, 0.16)",
    backgroundColor: "transparent",
    color: "#ffffff",
  };
  const ctaButtonStyle = {
    borderColor: "#e9c36a",
    backgroundColor: "#e9c36a",
    color: "#171717",
  };
  const shareText = [
    formatDevotionLabel(dailyDevotion.date, dailyDevotion.slot),
    DEVOTION_ATTRIBUTION,
    dailyDevotion.verse
      ? `${dailyDevotion.verse}${
          dailyDevotion.reference ? ` (${dailyDevotion.reference})` : ""
        }`
      : dailyDevotion.reference,
    getDevotionPreviewText(dailyDevotion.devotion),
    "Read more",
  ]
    .filter(Boolean)
    .join("\n\n");
  const shareVerseTypography = getShareVerseTypography(dailyDevotion.verse);
  const imageFileName = getDevotionImageFileName(dailyDevotion.date);
  const meditateHref = (() => {
    const parsed = parseBibleReference(dailyDevotion.rawReference);
    if (!parsed) {
      return null;
    }

    const [bookCode = "", chapter = "", verse = ""] = parsed.passageId.split(".");
    const book = getBookByCode(bookCode);
    if (!book || !chapter || !verse) {
      return null;
    }

    return getMeditationRoute({
      book: book.name,
      chapter,
      verse: verse.split("-")[0] || verse,
    });
  })();

  return (
    <section
      className="relative -mt-8 overflow-hidden sm:-mt-10"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div className="relative">
        <div
          id={shareTargetId}
          className="relative"
          style={{ backgroundColor: "#111111" }}
        >
          {shouldShowImage ? (
            <Image
              src={dailyDevotion.image}
              alt="Daily devotion landscape"
              fill
              sizes="100vw"
              className="object-cover"
              unoptimized
              priority
              onError={() => setImageLoadFailed(true)}
            />
          ) : null}
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 flex items-center justify-center px-5 py-10 pb-24 text-left sm:px-8 sm:pb-28 md:pt-20 lg:px-10">
            <div className="mx-auto flex max-w-4xl w-full flex-col items-start justify-center gap-5">
              <div className="space-y-2">
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: "rgba(255, 255, 255, 0.78)" }}
                  data-share-exclude="true"
                >
                  {formatDevotionLabel(dailyDevotion.date, dailyDevotion.slot)}
                </p>
                <h1
                  className="text-2xl leading-tight text-white sm:text-3xl"
                  data-share-exclude="true"
                >
                  {dailyDevotion.reference}
                </h1>
              </div>

              {dailyDevotion.verse ? (
                <div className="space-y-3" data-share-exclude="true">
                  <blockquote className="leading-[1.9] sm:text-xl">
                    <span className="text-white">{dailyDevotion.verse}</span>
                  </blockquote>
                  <p
                    data-share-exclude="true"
                    className="mt-8 text-sm sm:text-base"
                    style={{ color: "rgba(255, 255, 255, 0.78)" }}
                  >
                    {DEVOTION_ATTRIBUTION}
                  </p>
                  {dailyDevotion.imagePhotographerName ? (
                    <p
                      data-share-exclude="true"
                      className="text-xs"
                      style={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      Photo by{" "}
                      {dailyDevotion.imagePhotographerUrl ? (
                        <a
                          href={dailyDevotion.imagePhotographerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-2"
                        >
                          {dailyDevotion.imagePhotographerName}
                        </a>
                      ) : (
                        dailyDevotion.imagePhotographerName
                      )}{" "}
                      on{" "}
                      {dailyDevotion.imageUnsplashUrl ? (
                        <a
                          href={dailyDevotion.imageUnsplashUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-2"
                        >
                          Unsplash
                        </a>
                      ) : (
                        "Unsplash"
                      )}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <Link
                href={sharePath}
                data-share-exclude="true"
                className="inline-flex items-center gap-2 border px-5 py-3 text-sm font-semibold transition hover:opacity-80 sm:text-base"
                style={ctaButtonStyle}
              >
                இப்போது வாசிக்க
                <ArrowRightIcon style={{ width: 16, height: 16 }} />
              </Link>
            </div>
          </div>

          <DevotionShareCard
            reference={dailyDevotion.reference}
            verseText={dailyDevotion.verse}
            verseClassName={shareVerseTypography.blockquoteClassName}
          />
        </div>

        <div
          data-share-exclude="true"
          className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-5 py-6 sm:px-8 lg:px-10"
        >
          <div className="mx-auto flex w-full max-w-4xl items-center justify-start gap-3">
            {meditateHref ? (
              <Link
                href={meditateHref}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition hover:opacity-80"
                style={heroButtonStyle}
                aria-label="Meditate on this verse"
                title="Meditate"
              >
                <PlayIcon style={{ width: 18, height: 18 }} />
              </Link>
            ) : null}
            <VerseOfTheDayShareButton
              title={shareTitle}
              text={shareText}
              url={shareUrl}
              targetId={shareTargetId}
              exportWidth={600}
              exportHeight={600}
              fileName={imageFileName}
              action="download"
              className="shadow-sm"
              buttonStyle={heroButtonStyle}
            />
            <ShareButton
              title={shareTitle}
              text={shareText}
              url={shareUrl}
              onShare={() =>
                captureShareImage({
                  title: shareTitle,
                  text: shareText,
                  url: shareUrl,
                  targetId: shareTargetId,
                  exportWidth: 600,
                  exportHeight: 600,
                  fileName: imageFileName,
                  action: "share",
                })
              }
              className="shadow-sm"
              buttonStyle={heroButtonStyle}
            />
            <DailyVerseLikeButton
              verseId={dailyDevotion.slug}
              day={dailyDevotion.day}
              reference={dailyDevotion.reference}
              rawReference={dailyDevotion.rawReference}
              buttonStyle={heroButtonStyle}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
