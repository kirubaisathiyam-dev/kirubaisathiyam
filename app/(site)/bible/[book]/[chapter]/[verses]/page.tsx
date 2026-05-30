import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import BibleReader from "@/components/BibleReader";
import { getEdgeBibleBookDataBySlug } from "@/lib/edge-bible";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl().toString();
const siteName = "Kirubai Sathiyam";
const shareImage = toAbsoluteUrl("/images/bible.jpg");
export const runtime = "edge";

type BibleVersePageProps = {
  params: Promise<{
    book: string;
    chapter: string;
    verses: string;
  }>;
};

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

function buildBibleVersePath(book: string, chapter: string, verses: string) {
  return `/bible/${book}/${chapter}/${verses}`;
}

async function getVersePageData(book: string, chapter: string, verses: string) {
  const entry = await getEdgeBibleBookDataBySlug(book);
  const chapterData = entry?.data.chapters?.find((item) => item.chapter === chapter);

  if (!entry || !chapterData) {
    return null;
  }

  const requestedVerses = parseVerseNumbers(verses);
  const canonicalVerses = formatVerseNumbers(requestedVerses);
  if (!canonicalVerses) {
    return null;
  }

  const chapterVerseNumbers = new Set(
    (chapterData.verses ?? [])
      .map((verse) => Number.parseInt(verse.verse, 10))
      .filter(Number.isFinite),
  );
  const filteredVerses = requestedVerses.filter((verse) =>
    chapterVerseNumbers.has(verse),
  );
  const normalizedVerses = formatVerseNumbers(filteredVerses);
  const normalizedVersesPath = formatVerseNumbersForPath(filteredVerses);

  if (!normalizedVerses) {
    return null;
  }

  const verseTexts = (chapterData.verses ?? [])
    .filter((verse) => filteredVerses.includes(Number.parseInt(verse.verse, 10)))
    .map((verse) => verse.text.trim())
    .filter(Boolean);

  return {
    entry,
    chapterData,
    normalizedVerses,
    normalizedVersesPath,
    verseTexts,
  };
}

export async function generateMetadata({
  params,
}: BibleVersePageProps): Promise<Metadata> {
  const { book, chapter, verses } = await params;
  const data = await getVersePageData(book, chapter, verses);

  if (!data) {
    return {
      title: "வசனம் கிடைக்கவில்லை | Bible Verse Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const bookTamil =
    data.entry.data.book?.tamil?.trim() ||
    data.entry.meta.tamil ||
    data.entry.meta.english;
  const bookEnglish = data.entry.meta.english;
  const canonicalPath = buildBibleVersePath(
    book,
    chapter,
    data.normalizedVersesPath,
  );
  const title = `${bookTamil} ${chapter}:${data.normalizedVerses} | ${bookEnglish} ${chapter}:${data.normalizedVerses} Tamil Bible`;
  const snippet = data.verseTexts.join(" ").slice(0, 260);
  const description = snippet
    ? `${snippet}${snippet.length >= 260 ? "..." : ""} ${bookTamil} ${chapter}:${data.normalizedVerses} தமிழ் வேதாகமம்.`
    : `${bookTamil} ${chapter}:${data.normalizedVerses} வசனங்களை தமிழில் வாசிக்கவும்.`;

  return {
    title,
    description,
    keywords: [
      `${bookTamil} ${chapter}:${data.normalizedVerses}`,
      `${bookEnglish} ${chapter}:${data.normalizedVerses}`,
      `${bookEnglish} chapter ${chapter} verse ${data.normalizedVerses} tamil`,
      "Tamil Bible verse by verse",
      "Bible verse in Tamil",
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

export default async function BibleVersePage({ params }: BibleVersePageProps) {
  const { book, chapter, verses } = await params;
  const data = await getVersePageData(book, chapter, verses);

  if (!data) {
    notFound();
  }

  if (data.normalizedVersesPath !== verses) {
    redirect(buildBibleVersePath(book, chapter, data.normalizedVersesPath));
  }

  return (
    <BibleReader
      siteUrl={siteUrl}
      initialBook={data.entry.meta.english}
      initialChapter={chapter}
      initialVerses={data.normalizedVerses}
      urlMode="path"
    />
  );
}
