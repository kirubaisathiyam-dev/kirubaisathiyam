"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import DailyVerseLikeButton from "@/components/DailyVerseLikeButton";
import ShareButton from "@/components/ShareButton";
import VerseOfTheDayShareButton from "@/components/VerseOfTheDayShareButton";
import logoDark from "@/app/logo-dark.svg";
import { getBookByCode, parseBibleReference } from "@/lib/bible";
import { getBookFileSlug, type LocalBibleBook } from "@/lib/local-bible";

type VerseOfTheDayEntry = {
  day: number;
  verse_reference: string;
  explanation: string;
};

type VerseOfTheDay = {
  day: number;
  reference: string;
  rawReference: string;
  verse: string;
  explanation: string;
  image: string;
  imagePhotographerName: string | null;
  imagePhotographerUrl: string | null;
  imageUnsplashUrl: string | null;
  readerHref: string;
};

type UnsplashImageResponse = {
  url: string;
  photographerName: string | null;
  photographerUrl: string | null;
  unsplashUrl: string | null;
};

const SITE_TIME_ZONE = "Asia/Colombo";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getDayOfYearInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  if (!year || !month || !day) {
    return 1;
  }

  const current = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 1);
  return Math.floor((current - start) / DAY_IN_MS) + 1;
}

function getDateKeyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  if (!year || !month || !day) {
    return "unknown-date";
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

async function buildVerseOfTheDay(
  entry: VerseOfTheDayEntry,
): Promise<VerseOfTheDay> {
  const rawReference = entry.verse_reference.replace(/[()]/g, "").trim();
  const parsedReference = parseBibleReference(rawReference);
  const image = await fetchJson<UnsplashImageResponse>(
    `/api/unsplash-photo?context=verse&id=${encodeURIComponent(String(entry.day))}`,
  );

  if (!parsedReference) {
    return {
      day: entry.day,
      reference: rawReference || entry.verse_reference,
      rawReference,
      verse: "",
      explanation: entry.explanation,
      image: image?.url || "",
      imagePhotographerName: image?.photographerName ?? null,
      imagePhotographerUrl: image?.photographerUrl ?? null,
      imageUnsplashUrl: image?.unsplashUrl ?? null,
      readerHref: "/bible/read",
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
    .map((item) => `${item.verse}. ${item.text}`)
    .join(" ");
  const readerHref =
    bookName && chapter && verseRange
      ? `/bible/read?book=${encodeURIComponent(
          bookName,
        )}&chapter=${encodeURIComponent(chapter)}&verses=${encodeURIComponent(
          verseRange,
        )}`
      : "/bible/read";

  return {
    day: entry.day,
    reference:
      tamilBookName && chapter && verseRange
        ? `${tamilBookName} ${chapter}:${verseRange}`
        : rawReference,
    rawReference,
    verse,
    explanation: entry.explanation,
    image: image?.url || "",
    imagePhotographerName: image?.photographerName ?? null,
    imagePhotographerUrl: image?.photographerUrl ?? null,
    imageUnsplashUrl: image?.unsplashUrl ?? null,
    readerHref,
  };
}

async function getClientVerseOfTheDay() {
  const entries = await fetchJson<VerseOfTheDayEntry[]>(
    "/verse-of-the-day.json",
  );

  if (!entries?.length) {
    return null;
  }

  const dayOfYear = getDayOfYearInTimeZone(new Date(), SITE_TIME_ZONE);
  const normalizedDay = ((dayOfYear - 1) % entries.length) + 1;
  const entry =
    entries.find((item) => item.day === normalizedDay) ??
    entries[normalizedDay - 1] ??
    entries[0];

  return buildVerseOfTheDay(entry);
}

function VerseOfTheDaySkeleton() {
  return (
    <section
      className="relative -mt-8 overflow-hidden sm:-mt-10"
      style={{ borderColor: "var(--border-color)" }}
      aria-hidden="true"
    >
      <div className="relative min-h-[24rem] bg-[#111111] sm:min-h-[30rem] lg:min-h-[36rem]" />
    </section>
  );
}

export default function VerseOfTheDayOverlay() {
  const [verseOfTheDay, setVerseOfTheDay] = useState<VerseOfTheDay | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadVerse() {
      const dailyVerse = await getClientVerseOfTheDay();
      if (isMounted) {
        setVerseOfTheDay(dailyVerse);
      }
    }

    void loadVerse();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!verseOfTheDay) {
    return <VerseOfTheDaySkeleton />;
  }

  const shareTitle = `Verse Of The Day - ${verseOfTheDay.reference}`;
  const shareTargetId = "verse-of-the-day-share-card";
  const dailyVerseId = getDateKeyInTimeZone(new Date(), SITE_TIME_ZONE);
  const shareUrl =
    typeof window === "undefined" ? "/" : `${window.location.origin}/`;
  const heroButtonStyle = {
    borderColor: "rgba(237, 237, 237, 0.16)",
    backgroundColor: "transparent",
    color: "#ffffff",
  };
  const shareText = [
    verseOfTheDay.reference,
    verseOfTheDay.verse,
    verseOfTheDay.explanation,
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <section
      className="relative -mt-8 overflow-hidden sm:-mt-10"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div className="relative">
        <div
          id={shareTargetId}
          className="relative min-h-[24rem] sm:min-h-[30rem] lg:min-h-[36rem]"
          style={{ backgroundColor: "#111111" }}
        >
          <Image
            src={verseOfTheDay.image}
            alt="Verse of the day landscape"
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 flex min-h-[24rem] items-center justify-center px-5 py-10 pb-24 text-left sm:min-h-[30rem] sm:px-8 sm:pb-28 lg:min-h-[36rem] lg:px-10">
            <div className="mx-auto flex max-w-4xl flex-col items-start justify-center gap-5">
              <div className="space-y-2">
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: "rgba(255, 255, 255, 0.78)" }}
                >
                  Verse Of The Day
                </p>
                <h1 className="text-2xl leading-tight text-white sm:text-3xl">
                  {verseOfTheDay.reference}
                </h1>
              </div>

              {verseOfTheDay.verse ? (
                <blockquote className="leading-[1.9] sm:text-xl">
                  <span
                    className="inline"
                    style={{
                      backgroundColor: "#ffe3a1",
                      color: "#171717",
                      padding: "0em 0.3em",
                      borderRadius: "0",
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                    }}
                  >
                    {verseOfTheDay.verse}
                  </span>
                </blockquote>
              ) : null}

              <p className="sm:leading-8 text-white sm:text-xl">
                {verseOfTheDay.explanation}
              </p>
              {verseOfTheDay.imagePhotographerName ? (
                <p
                  className="text-xs"
                  style={{ color: "rgba(255, 255, 255, 0.7)" }}
                  data-share-exclude="true"
                >
                  Photo by{" "}
                  {verseOfTheDay.imagePhotographerUrl ? (
                    <a
                      href={verseOfTheDay.imagePhotographerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      {verseOfTheDay.imagePhotographerName}
                    </a>
                  ) : (
                    verseOfTheDay.imagePhotographerName
                  )}{" "}
                  on{" "}
                  {verseOfTheDay.imageUnsplashUrl ? (
                    <a
                      href={verseOfTheDay.imageUnsplashUrl}
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
          </div>

          <div
            data-share-only="true"
            className="absolute inset-x-0 bottom-0 z-10 hidden justify-center px-5 py-6 sm:px-8 lg:px-10"
          >
            <div
              className="mx-auto flex w-full max-w-4xl items-center justify-start gap-3 text-lg font-semibold tracking-tight sm:text-xl"
              style={{ color: "#ededed" }}
            >
              <Image
                src={logoDark}
                alt="Kirubai Sathiyam logo"
                width={30}
                height={30}
              />
              <div>
                கிருபை <span style={{ color: "#e9c36a" }}>சத்தியம்</span>
              </div>
            </div>
          </div>
        </div>

        <div
          data-share-exclude="true"
          className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-5 py-6 sm:px-8 lg:px-10"
        >
          <div className="mx-auto flex w-full max-w-4xl items-center justify-start gap-3">
            <Link
              href={verseOfTheDay.readerHref}
              className="inline-flex cursor-pointer items-center justify-center rounded-full border p-3 text-sm font-semibold transition hover:opacity-80"
              style={heroButtonStyle}
              aria-label="Open in Bible reader"
            >
              <span
                aria-hidden="true"
                style={{
                  width: 20,
                  height: 20,
                  display: "inline-block",
                  backgroundColor: "currentColor",
                  maskImage: "url('/icons/line-md-book.svg')",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "contain",
                  WebkitMaskImage: "url('/icons/line-md-book.svg')",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  WebkitMaskSize: "contain",
                }}
              />
              <span className="sr-only">Open in Bible reader</span>
            </Link>
            <VerseOfTheDayShareButton
              title={shareTitle}
              text={shareText}
              url={shareUrl}
              targetId={shareTargetId}
              className="shadow-sm"
              buttonStyle={heroButtonStyle}
            />
            <ShareButton
              title={shareTitle}
              text={shareText}
              url={shareUrl}
              className="shadow-sm"
              buttonStyle={heroButtonStyle}
            />
            <DailyVerseLikeButton
              verseId={dailyVerseId}
              day={verseOfTheDay.day}
              reference={verseOfTheDay.reference}
              rawReference={verseOfTheDay.rawReference}
              buttonStyle={heroButtonStyle}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
