import fs from "fs";
import path from "path";
import { getBookByCode, parseBibleReference } from "@/lib/bible";
import { getBookFileSlug, type LocalBibleBook } from "@/lib/local-bible";

type VerseOfTheDayEntry = {
  day: number;
  verse_reference: string;
  explanation: string;
};

export type VerseOfTheDay = {
  day: number;
  reference: string;
  verse: string;
  explanation: string;
  image: string;
};

const VERSE_OF_THE_DAY_PATH = path.join(
  process.cwd(),
  "public/verse-of-the-day.json",
);
const LOCAL_BIBLE_DIRECTORY = path.join(
  process.cwd(),
  "public/local-bible/books",
);
const SITE_TIME_ZONE = "Asia/Colombo";

function getTodayPartsInTimeZone(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "0"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "0"),
    day: Number(parts.find((part) => part.type === "day")?.value ?? "0"),
  };
}

function getDayOfYearInTimeZone(timeZone: string) {
  const { year, month, day } = getTodayPartsInTimeZone(timeZone);
  const current = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 1);

  return Math.floor((current - start) / 86_400_000) + 1;
}

function readVerseEntries() {
  const fileContents = fs.readFileSync(VERSE_OF_THE_DAY_PATH, "utf8");
  const entries = JSON.parse(fileContents) as VerseOfTheDayEntry[];

  return entries
    .filter(
      (entry) =>
        Number.isFinite(entry.day) &&
        typeof entry.verse_reference === "string" &&
        typeof entry.explanation === "string",
    )
    .sort((a, b) => a.day - b.day);
}

function getVerseText(reference: string) {
  const normalizedReference = reference.replace(/[()]/g, "").trim();
  const parsedReference = parseBibleReference(normalizedReference);
  if (!parsedReference) {
    return "";
  }

  const [bookCode, chapterNumber, verseRange] = parsedReference.passageId.split(".");
  if (!bookCode || !chapterNumber || !verseRange) {
    return "";
  }

  const book = getBookByCode(bookCode);
  if (!book) {
    return "";
  }

  const bookPath = path.join(
    LOCAL_BIBLE_DIRECTORY,
    `${getBookFileSlug(book.name)}.json`,
  );
  if (!fs.existsSync(bookPath)) {
    return "";
  }

  const bookContents = fs.readFileSync(bookPath, "utf8");
  const bookData = JSON.parse(bookContents) as LocalBibleBook;
  const chapter = bookData.chapters?.find(
    (entry) => entry.chapter === chapterNumber,
  );
  if (!chapter?.verses?.length) {
    return "";
  }

  const [startVerse, endVerse] = verseRange.split("-");
  const start = Number(startVerse);
  const end = Number(endVerse ?? startVerse);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return "";
  }

  const verses = chapter.verses.filter((entry) => {
    const verseNumber = Number(entry.verse);
    return (
      Number.isFinite(verseNumber) &&
      verseNumber >= start &&
      verseNumber <= end
    );
  });

  return verses.map((entry) => `${entry.verse}. ${entry.text}`).join(" ");
}

function getFullTamilReference(reference: string) {
  const normalizedReference = reference.replace(/[()]/g, "").trim();
  const parsedReference = parseBibleReference(normalizedReference);
  if (!parsedReference) {
    return reference;
  }

  const [bookCode, chapterNumber, verseRange] = parsedReference.passageId.split(".");
  if (!bookCode || !chapterNumber || !verseRange) {
    return reference;
  }

  const book = getBookByCode(bookCode);
  if (!book) {
    return reference;
  }

  const bookPath = path.join(
    LOCAL_BIBLE_DIRECTORY,
    `${getBookFileSlug(book.name)}.json`,
  );
  if (!fs.existsSync(bookPath)) {
    return reference;
  }

  const bookContents = fs.readFileSync(bookPath, "utf8");
  const bookData = JSON.parse(bookContents) as LocalBibleBook;
  const tamilBookName = bookData.book?.tamil?.trim();

  return `${tamilBookName || book.name} ${chapterNumber}:${verseRange}`;
}

export function getVerseOfTheDay(): VerseOfTheDay | null {
  const entries = readVerseEntries();
  if (!entries.length) {
    return null;
  }

  const dayOfYear = getDayOfYearInTimeZone(SITE_TIME_ZONE);
  const todayEntry =
    entries.find((entry) => entry.day === dayOfYear) ??
    entries[(dayOfYear - 1) % entries.length];

  if (!todayEntry) {
    return null;
  }

  return {
    day: todayEntry.day,
    reference: getFullTamilReference(todayEntry.verse_reference),
    verse: getVerseText(todayEntry.verse_reference),
    explanation: todayEntry.explanation,
    image: `https://picsum.photos/seed/verse-${todayEntry.day}/1600/1200.jpg`,
  };
}
