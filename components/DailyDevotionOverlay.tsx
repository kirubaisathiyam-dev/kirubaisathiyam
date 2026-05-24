"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRightIcon, CloseIcon } from "@/components/Icons";
import DailyVerseLikeButton from "@/components/DailyVerseLikeButton";
import ShareButton from "@/components/ShareButton";
import VerseOfTheDayShareButton from "@/components/VerseOfTheDayShareButton";
import logoDark from "@/app/logo-dark.svg";
import { getBookByCode, parseBibleReference } from "@/lib/bible";
import { getBookFileSlug, type LocalBibleBook } from "@/lib/local-bible";

type DailyDevotionSlot = {
  verse: string;
  devotion: string;
};

type DailyDevotionEntry = {
  date: string;
  am?: DailyDevotionSlot;
  pm?: DailyDevotionSlot;
};

type DailyDevotion = {
  date: string;
  slot: "am" | "pm";
  rawReference: string;
  reference: string;
  verse: string;
  devotion: string;
  image: string;
  dayOfYear: number;
};

const SITE_TIME_ZONE = "Asia/Colombo";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MONTH_INDEX_BY_SHORT_NAME: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

type DevotionQueryTarget =
  | { mode: "current" }
  | { mode: "specific"; date: string; slot: "am" | "pm" };

function getTimePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "0"),
    monthShort: parts.find((part) => part.type === "month")?.value ?? "Jan",
    day: Number(parts.find((part) => part.type === "day")?.value ?? "1"),
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? "0"),
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? "0"),
  };
}

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

function getDevotionSlot(date: Date, timeZone: string) {
  const { hour } = getTimePartsInTimeZone(date, timeZone);
  return hour < 12 ? "am" : "pm";
}

function formatDevotionLabel(date: string, slot: "am" | "pm") {
  const [day = "", month = ""] = date.split(" ");
  return `${month.toUpperCase()} ${day} ${slot === "am" ? "MORNING" : "EVENING"}`;
}

function normalizeDevotionDateLabel(date: string) {
  const [day = "", month = ""] = date.trim().split(/\s+/);
  const normalizedDay = String(Number(day) || day).padStart(2, "0");
  const normalizedMonth = month.slice(0, 3);
  return `${normalizedDay} ${normalizedMonth}`;
}

function getDevotionQueryValue(date: string, slot: "am" | "pm") {
  const [day = "", month = ""] = normalizeDevotionDateLabel(date).split(" ");
  return `${day}_${month.toLowerCase()}_${slot}`;
}

function parseDevotionQueryValue(value: string | null): DevotionQueryTarget | null {
  if (!value) {
    return null;
  }

  if (value === "true") {
    return { mode: "current" };
  }

  const match = value.match(/^(\d{1,2})[_-]([a-z]{3})[_-](am|pm)$/i);
  if (!match) {
    return null;
  }

  const [, day, month, slot] = match;
  return {
    mode: "specific",
    date: `${String(Number(day)).padStart(2, "0")} ${month[0].toUpperCase()}${month.slice(1).toLowerCase()}`,
    slot: slot.toLowerCase() as "am" | "pm",
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

function buildImageUrl(dayOfYear: number, slot: "am" | "pm") {
  return `https://picsum.photos/seed/daily-devotion-${dayOfYear}-${slot}/1600/1200.jpg`;
}

function getDayOfYearFromDevotionDate(date: string, timeZone: string) {
  const [day = "", month = ""] = normalizeDevotionDateLabel(date).split(" ");
  const monthIndex = MONTH_INDEX_BY_SHORT_NAME[month.toLowerCase()];
  const dayNumber = Number(day);

  if (monthIndex === undefined || !Number.isFinite(dayNumber)) {
    return 1;
  }

  const year = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "year")?.value ?? "0",
  );

  if (!year) {
    return 1;
  }

  const current = Date.UTC(year, monthIndex, dayNumber);
  const start = Date.UTC(year, 0, 1);
  return Math.floor((current - start) / DAY_IN_MS) + 1;
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

async function getClientDailyDevotion(target: DevotionQueryTarget | null = null) {
  const entries = await fetchJson<DailyDevotionEntry[]>("/daily-devotion.json");

  if (!entries?.length) {
    return null;
  }

  const now = new Date();
  const queryTarget = target ?? { mode: "current" as const };
  const slot =
    queryTarget.mode === "specific"
      ? queryTarget.slot
      : getDevotionSlot(now, SITE_TIME_ZONE);
  const entry =
    queryTarget.mode === "specific"
      ? entries.find(
          (item) =>
            normalizeDevotionDateLabel(item.date) ===
              normalizeDevotionDateLabel(queryTarget.date) && item[slot]?.verse,
        ) ?? null
      : [
          `${String(getTimePartsInTimeZone(now, SITE_TIME_ZONE).day).padStart(2, "0")} ${
            getTimePartsInTimeZone(now, SITE_TIME_ZONE).monthShort
          }`,
          `${String(getTimePartsInTimeZone(now, SITE_TIME_ZONE).day).padStart(2, "0")} Jan`,
        ]
          .map((candidate) =>
            entries.find((item) => item.date === candidate && item[slot]?.verse),
          )
          .find(Boolean) ?? null;

  if (!entry) {
    return null;
  }
  const slotEntry = entry[slot];
  if (!slotEntry?.verse) {
    return null;
  }

  const verseDetails = await getVerseDetails(slotEntry.verse);
  const dayOfYear =
    queryTarget.mode === "specific"
      ? getDayOfYearFromDevotionDate(entry.date, SITE_TIME_ZONE)
      : getDayOfYearInTimeZone(now, SITE_TIME_ZONE);

  return {
    date: entry.date,
    slot,
    rawReference: verseDetails.rawReference,
    reference: verseDetails.reference,
    verse: verseDetails.verse,
    devotion: slotEntry.devotion ?? "",
    image: buildImageUrl(dayOfYear, slot),
    dayOfYear,
  } satisfies DailyDevotion;
}

function DailyDevotionSkeleton() {
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

export default function DailyDevotionOverlay() {
  const [dailyDevotion, setDailyDevotion] = useState<DailyDevotion | null>(null);
  const [dialogDevotion, setDialogDevotion] = useState<DailyDevotion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [shouldShowImage, setShouldShowImage] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const closeTimeoutRef = useRef<number | null>(null);
  const openFrameRef = useRef<number | null>(null);
  const autoOpenHandledRef = useRef(false);

  const clearOpenDevotionQuery = () => {
    if (typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has("openDevotion")) {
      return;
    }

    searchParams.delete("openDevotion");
    const nextSearch = searchParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadDevotion() {
      const queryTarget =
        typeof window === "undefined"
          ? null
          : parseDevotionQueryValue(
              new URLSearchParams(window.location.search).get("openDevotion"),
            );
      const currentDevotionPromise = getClientDailyDevotion();
      const targetDevotionPromise = queryTarget
        ? getClientDailyDevotion(queryTarget)
        : Promise.resolve(null);
      const [currentDevotion, targetDevotion] = await Promise.all([
        currentDevotionPromise,
        targetDevotionPromise,
      ]);

      if (isMounted) {
        setDailyDevotion(currentDevotion);
        setDialogDevotion(targetDevotion ?? currentDevotion);
      }
    }

    void loadDevotion();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
      if (openFrameRef.current !== null) {
        window.cancelAnimationFrame(openFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShouldShowImage(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setShouldShowImage(isOnline);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [dailyDevotion?.image, isOnline]);

  useEffect(() => {
    if (!isDialogVisible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDialogVisible]);

  const openDialog = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (openFrameRef.current !== null) {
      window.cancelAnimationFrame(openFrameRef.current);
    }
    setIsDialogVisible(true);
    openFrameRef.current = window.requestAnimationFrame(() => {
      setIsDialogOpen(true);
      openFrameRef.current = null;
    });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setDialogDevotion(dailyDevotion);
    clearOpenDevotionQuery();
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsDialogVisible(false);
      closeTimeoutRef.current = null;
    }, 320);
  };

  useEffect(() => {
    if (
      !dailyDevotion ||
      !dialogDevotion ||
      autoOpenHandledRef.current ||
      typeof window === "undefined"
    ) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const queryValue = searchParams.get("openDevotion");
    if (!parseDevotionQueryValue(queryValue)) {
      return;
    }

    autoOpenHandledRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      openDialog();
    });

    if (queryValue === "true") {
      clearOpenDevotionQuery();
    }

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [dailyDevotion, dialogDevotion]);

  if (!dailyDevotion) {
    return <DailyDevotionSkeleton />;
  }

  const activeDialogDevotion = dialogDevotion ?? dailyDevotion;

  const shareTitle = `Daily Devotion - ${dailyDevotion.reference}`;
  const shareTargetId = "daily-devotion-share-card";
  const dailyVerseId = `${normalizeDevotionDateLabel(dailyDevotion.date).replace(/\s+/g, "-").toLowerCase()}-${dailyDevotion.slot}`;
  const shareUrl =
    typeof window === "undefined"
      ? "/"
      : `${window.location.origin}/?openDevotion=${encodeURIComponent(
          getDevotionQueryValue(dailyDevotion.date, dailyDevotion.slot),
        )}`;
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
    dailyDevotion.reference,
    dailyDevotion.verse,
    dailyDevotion.devotion,
  ]
    .filter(Boolean)
    .join("\n\n");
  const activeDialogShareText = [
    activeDialogDevotion.reference,
    activeDialogDevotion.verse,
    activeDialogDevotion.devotion,
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
              onError={() => setShouldShowImage(false)}
            />
          ) : null}
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 flex items-center justify-center px-5 py-10 pb-24 md:pt-20 text-left sm:px-8 sm:pb-28 lg:px-10">
            <div className="mx-auto flex max-w-4xl flex-col items-start justify-center gap-5">
              <div className="space-y-2">
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: "rgba(255, 255, 255, 0.78)" }}
                >
                  {formatDevotionLabel(dailyDevotion.date, dailyDevotion.slot)}
                </p>
                <h1 className="text-2xl leading-tight text-white sm:text-3xl">
                  {dailyDevotion.reference}
                </h1>
              </div>

              {dailyDevotion.verse ? (
                <div className="space-y-3">
                  <blockquote className="leading-[1.9] sm:text-xl">
                    <span className="text-white">{dailyDevotion.verse}</span>
                  </blockquote>
                  <p
                    data-share-exclude="true"
                    className="text-sm sm:text-base"
                    style={{ color: "rgba(255, 255, 255, 0.78)" }}
                  >
                    சார்ல்ஸ் ஸ்பர்ஜனின் காலை மற்றும் மாலை தியானங்கள்
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setDialogDevotion(dailyDevotion);
                  openDialog();
                }}
                data-share-exclude="true"
                className="inline-flex items-center gap-2 border px-5 py-3 text-sm font-semibold transition hover:opacity-80 sm:text-base"
                style={ctaButtonStyle}
              >
                இப்போது வாசிக்க
                <ArrowRightIcon style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          <div
            data-share-only="true"
            className="absolute inset-x-0 bottom-0 z-10 hidden justify-center px-5 pb-6 sm:px-8 lg:px-10"
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
              day={dailyDevotion.dayOfYear}
              reference={dailyDevotion.reference}
              rawReference={dailyDevotion.rawReference}
              buttonStyle={heroButtonStyle}
            />
          </div>
        </div>
      </div>

      {isDialogVisible ? (
        <div
          className={`fixed inset-0 z-[100] transition-all duration-300 ${
            isDialogOpen ? "bg-black/70 opacity-100" : "bg-black/0 opacity-0"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Daily devotion"
          onClick={closeDialog}
        >
          <div
            className={`absolute inset-0 transition-transform duration-300 ease-out ${
              isDialogOpen ? "translate-y-0" : "translate-y-full"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-full overflow-y-auto bg-[var(--background)]">
              <div className="sticky top-0 z-10 flex justify-end bg-[var(--background)]/90 px-4 py-4 backdrop-blur sm:px-6">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:opacity-80"
                  style={{
                    color: "var(--foreground)",
                  }}
                  aria-label="Close daily devotion"
                >
                  <CloseIcon style={{ width: 22, height: 22 }} />
                </button>
              </div>

              <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
                <div className="space-y-3">
                  <p
                    className="text-xs uppercase tracking-[0.3em]"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {formatDevotionLabel(
                      activeDialogDevotion.date,
                      activeDialogDevotion.slot,
                    )}
                  </p>
                  <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
                    {activeDialogDevotion.reference}
                  </h2>
                  <p
                    className="text-sm sm:text-base"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    சார்ல்ஸ் ஸ்பர்ஜனின் காலை மற்றும் மாலை தியானங்கள்
                  </p>
                </div>

                {activeDialogDevotion.verse ? (
                  <blockquote
                    className="text-lg leading-[1.9] sm:text-xl"
                    style={{ color: "var(--foreground-bible)" }}
                  >
                    {activeDialogDevotion.verse}
                  </blockquote>
                ) : null}

                {activeDialogDevotion.devotion ? (
                  <div
                    className="space-y-5 text-base leading-8 sm:text-lg"
                    style={{ color: "var(--foreground)" }}
                  >
                    {activeDialogDevotion.devotion
                      .split(/\n\s*\n/)
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p
                          key={`${activeDialogDevotion.date}-${activeDialogDevotion.slot}-${index}`}
                        >
                          {paragraph.trim()}
                        </p>
                      ))}
                  </div>
                ) : null}

                <div className="pt-2">
                  <ShareButton
                    title={`Daily Devotion - ${activeDialogDevotion.reference}`}
                    text={activeDialogShareText}
                    url={
                      typeof window === "undefined"
                        ? "/"
                        : `${window.location.origin}/?openDevotion=${encodeURIComponent(
                            getDevotionQueryValue(
                              activeDialogDevotion.date,
                              activeDialogDevotion.slot,
                            ),
                          )}`
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
