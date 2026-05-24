import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShareButton from "@/components/ShareButton";
import dailyDevotionRecords from "@/public/daily-devotion.json";
import { ArrowLeftIcon } from "@/components/Icons";
import { getBookByCode, parseBibleReference } from "@/lib/bible";
import {
  buildDevotionImageUrl,
  DEVOTION_ATTRIBUTION,
  formatDevotionLabel,
  getDevotionPreviewText,
  getDevotionRoute,
  getDevotionSlug,
  parseDevotionSlug,
  type DailyDevotionRecord,
} from "@/lib/daily-devotion";
import { getBookFileSlug, type LocalBibleBook } from "@/lib/local-bible";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

export const dynamicParams = false;

const siteUrl = getSiteUrl();
const siteName = "Kirubai Sathiyam";
const fallbackImage = toAbsoluteUrl("/logo-light.svg");

type DevotionPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type DevotionPageData = {
  slug: string;
  date: string;
  slot: "am" | "pm";
  label: string;
  verseReference: string;
  verseText: string;
  devotion: string;
  imageUrl: string;
  canonicalPath: string;
};

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

  let bookData: LocalBibleBook | null = null;
  if (bookName) {
    const bookPath = path.join(
      process.cwd(),
      "public",
      "local-bible",
      "books",
      `${getBookFileSlug(bookName)}.json`,
    );

    try {
      const content = await fs.readFile(bookPath, "utf8");
      bookData = JSON.parse(content) as LocalBibleBook;
    } catch {
      bookData = null;
    }
  }

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

async function getDevotionPageData(
  slug: string,
): Promise<DevotionPageData | null> {
  const parsed = parseDevotionSlug(slug);
  if (!parsed) {
    return null;
  }

  const records = dailyDevotionRecords as DailyDevotionRecord[];
  const record = records.find(
    (item) =>
      item.date &&
      getDevotionSlug(item.date, parsed.slot) === slug &&
      item[parsed.slot]?.verse,
  );

  const slotEntry = record?.[parsed.slot];
  if (!record?.date || !slotEntry?.verse) {
    return null;
  }

  const verseDetails = await getVerseDetails(slotEntry.verse);
  const canonicalPath = getDevotionRoute(slug);

  return {
    slug,
    date: record.date,
    slot: parsed.slot,
    label: formatDevotionLabel(record.date, parsed.slot),
    verseReference: verseDetails.reference,
    verseText: verseDetails.verse,
    devotion: slotEntry.devotion ?? "",
    imageUrl: buildDevotionImageUrl(slug),
    canonicalPath,
  };
}

export function generateStaticParams() {
  const records = dailyDevotionRecords as DailyDevotionRecord[];

  return records.flatMap((record) => {
    if (!record.date) {
      return [];
    }

    return (["am", "pm"] as const)
      .filter((slot) => Boolean(record[slot]?.verse))
      .map((slot) => ({
        slug: getDevotionSlug(record.date!, slot),
      }));
  });
}

export async function generateMetadata({
  params,
}: DevotionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const devotion = await getDevotionPageData(slug);

  if (!devotion) {
    return {
      title: "Devotion Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${devotion.label} | ${devotion.verseReference}`;
  const description = [
    DEVOTION_ATTRIBUTION,
    devotion.verseText
      ? `${devotion.verseText} (${devotion.verseReference})`
      : devotion.verseReference,
    getDevotionPreviewText(devotion.devotion),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title,
    description,
    alternates: {
      canonical: devotion.canonicalPath,
    },
    openGraph: {
      type: "article",
      url: devotion.canonicalPath,
      title,
      description,
      siteName,
      locale: "ta-IN",
      images: [{ url: devotion.imageUrl }, { url: fallbackImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [devotion.imageUrl, fallbackImage],
    },
  };
}

export default async function DevotionPage({ params }: DevotionPageProps) {
  const { slug } = await params;
  const devotion = await getDevotionPageData(slug);

  if (!devotion) {
    notFound();
  }

  const devotionUrl = toAbsoluteUrl(devotion.canonicalPath);
  const shareText = [
    devotion.label,
    DEVOTION_ATTRIBUTION,
    devotion.verseText
      ? `${devotion.verseText}${
          devotion.verseReference ? ` (${devotion.verseReference})` : ""
        }`
      : devotion.verseReference,
    getDevotionPreviewText(devotion.devotion),
    "Read more",
  ]
    .filter(Boolean)
    .join("\n\n");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: devotion.verseReference,
    description: getDevotionPreviewText(devotion.devotion),
    articleSection: devotion.label,
    author: {
      "@type": "Person",
      name: "Charles Spurgeon",
    },
    image: [devotion.imageUrl],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": devotionUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl.toString(),
    },
  };

  return (
    <article className="pb-10">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="relative -mt-8 overflow-hidden sm:-mt-10">
        <div
          className="relative min-h-[24rem] sm:min-h-[30rem] lg:min-h-[36rem]"
          style={{ backgroundColor: "#111111" }}
        >
          <Image
            src={devotion.imageUrl}
            alt={`${devotion.label} devotion`}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 flex min-h-[24rem] items-center justify-center px-5 py-10 text-left sm:min-h-[30rem] sm:px-8 lg:min-h-[36rem] lg:px-10">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
              <Link
                href="/"
                className="transition hover:opacity-80"
                style={{
                  color: "#ffffff",
                }}
                aria-label="Back to home"
              >
                <ArrowLeftIcon style={{ width: 16, height: 16 }} />
              </Link>
              <div className="space-y-2">
                <p
                  className="text-xs uppercase tracking-[0.3em]"
                  style={{ color: "rgba(255, 255, 255, 0.78)" }}
                >
                  {devotion.label}
                </p>
                <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  {devotion.verseReference}
                </h1>
              </div>

              {devotion.verseText ? (
                <blockquote className="text-lg leading-[1.9] text-white sm:text-xl">
                  {devotion.verseText}
                </blockquote>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {devotion.devotion ? (
        <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-8 px-4 sm:px-6 sm:mt-10">
          <div
            className="space-y-5 text-base leading-8 sm:text-lg"
            style={{ color: "var(--foreground)" }}
          >
            {devotion.devotion
              .split(/\n\s*\n/)
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={`${devotion.slug}-${index}`}>{paragraph.trim()}</p>
              ))}
          </div>
          <p
            className="text-sm sm:text-base"
            style={{ color: "rgba(255, 255, 255, 0.5)" }}
          >
            {DEVOTION_ATTRIBUTION}
          </p>
          <div className="mb-8">
            <ShareButton
              title={`Daily Devotion - ${devotion.verseReference}`}
              text={shareText}
              url={devotionUrl}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
