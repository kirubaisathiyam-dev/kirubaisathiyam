import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import BibleReader from "@/components/BibleReader";
import { getEdgeBibleBookDataBySlug } from "@/lib/edge-bible";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

export const runtime = "edge";

const siteUrl = getSiteUrl().toString();
const siteName = "Kirubai Sathiyam";
const shareImage = toAbsoluteUrl("/images/bible.jpg");

type BibleChapterPageProps = {
  params: Promise<{
    book: string;
    chapter: string;
  }>;
  searchParams?: Promise<{
    verses?: string | string[];
  }>;
};

function buildBibleChapterPath(book: string, chapter: string) {
  return `/bible/${book}/${chapter}`;
}

function parseVerseNumbers(value: string) {
  const cleaned = value.replace(/\s+/g, "").replace(/_/g, ",");
  if (!cleaned) return [];

  const entries = cleaned.split(",");
  const numbers: number[] = [];

  for (const entry of entries) {
    if (!entry) continue;
    if (entry.includes("-")) {
      const [startRaw, endRaw] = entry.split("-");
      const start = Number.parseInt(startRaw, 10);
      const end = Number.parseInt(endRaw, 10);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const low = Math.min(start, end);
      const high = Math.max(start, end);
      for (let idx = low; idx <= high; idx += 1) {
        numbers.push(idx);
      }
    } else {
      const num = Number.parseInt(entry, 10);
      if (Number.isFinite(num)) {
        numbers.push(num);
      }
    }
  }

  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

function formatVerseNumbers(values: number[]) {
  if (!values.length) return "";
  const sorted = Array.from(new Set(values)).sort((a, b) => a - b);
  const ranges: string[] = [];

  let rangeStart = sorted[0];
  let previous = sorted[0];

  for (let idx = 1; idx < sorted.length; idx += 1) {
    const current = sorted[idx];
    if (current === previous + 1) {
      previous = current;
      continue;
    }
    ranges.push(
      rangeStart === previous ? `${rangeStart}` : `${rangeStart}-${previous}`,
    );
    rangeStart = current;
    previous = current;
  }

  ranges.push(
    rangeStart === previous ? `${rangeStart}` : `${rangeStart}-${previous}`,
  );

  return ranges.join(",");
}

function formatVerseNumbersForPath(values: number[]) {
  return formatVerseNumbers(values).replace(/,/g, "_");
}

export async function generateMetadata({
  params,
}: BibleChapterPageProps): Promise<Metadata> {
  const { book, chapter } = await params;
  const entry = await getEdgeBibleBookDataBySlug(book);
  const chapterData = entry?.data.chapters?.find((item) => item.chapter === chapter);

  if (!entry || !chapterData) {
    return {
      title: "அதிகாரம் கிடைக்கவில்லை | Bible Chapter Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const bookTamil =
    entry.data.book?.tamil?.trim() || entry.meta.tamil || entry.meta.english;
  const bookEnglish = entry.meta.english;
  const bookShort = entry.data.book?.short?.trim() || entry.meta.short || bookTamil;
  const title = `${bookTamil} ${chapter} | ${bookEnglish} Chapter ${chapter} Tamil Bible`;
  const description = `${bookTamil} ${chapter} ஆம் அதிகாரத்தை தமிழில் வசனம் வாரியாகவும் ஆய்வு வாசிப்பு வசதியுடனும் படிக்கவும்.`;
  const canonicalPath = buildBibleChapterPath(book, chapter);

  return {
    title,
    description,
    keywords: [
      `${bookTamil} ${chapter}`,
      `${bookEnglish} chapter ${chapter}`,
      `${bookShort} ${chapter}`,
      `${bookEnglish} ${chapter} tamil`,
      `${bookTamil} chapter ${chapter}`,
      "Tamil Holy Bible",
      "Tamil Bible verse by verse",
      "Bible chapter in Tamil",
      "Kirubai Sathiyam",
    ],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      url: canonicalPath,
      title,
      description,
      siteName,
      locale: "ta-IN",
      images: [{ url: shareImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}

export default async function BibleChapterPage({
  params,
  searchParams,
}: BibleChapterPageProps) {
  const { book, chapter } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const entry = await getEdgeBibleBookDataBySlug(book);
  const chapterData = entry?.data.chapters?.find((item) => item.chapter === chapter);

  if (!entry || !chapterData) {
    notFound();
  }

  const rawVerses = Array.isArray(resolvedSearchParams?.verses)
    ? resolvedSearchParams?.verses[0] || ""
    : resolvedSearchParams?.verses || "";
  const verseNumbers = parseVerseNumbers(rawVerses);

  if (verseNumbers.length) {
    redirect(
      `${buildBibleChapterPath(book, chapter)}/${formatVerseNumbersForPath(
        verseNumbers,
      )}`,
    );
  }

  return (
    <BibleReader
      siteUrl={siteUrl}
      initialBook={entry.meta.english}
      initialChapter={chapter}
      urlMode="path"
    />
  );
}
