import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DevotionHero from "@/components/DevotionHero";
import DevotionShareCard from "@/components/DevotionShareCard";
import DevotionShareActions from "@/components/DevotionShareActions";
import {
  getBookByCode,
  parseBibleReference,
  replaceBibleRefsInHtml,
} from "@/lib/bible";
import {
  DEVOTION_ATTRIBUTION,
  formatDevotionLabel,
  getDevotionImageFileName,
  getDevotionPreviewText,
  getDevotionRoute,
  getDevotionSlug,
  parseDevotionSlug,
  type DailyDevotionRecord,
} from "@/lib/daily-devotion";
import { getBookFileSlug, type LocalBibleBook } from "@/lib/local-bible";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";
import dailyDevotionRecords from "@/public/daily-devotion.json";

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
  canonicalPath: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderDevotionHtml(content: string) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  return replaceBibleRefsInHtml(paragraphs);
}

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
      title: "தியானம் கிடைக்கவில்லை | Devotion Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${devotion.label} | தமிழ் தினசரி தியானம் | Charles Spurgeon Devotion`;
  const description = [
    "சார்ல்ஸ் ஸ்பர்ஜனின் தமிழ் தினசரி தியானம்.",
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
    keywords: [
      "Daily devotion",
      "Daily devotion in Tamil",
      "Tamil daily devotion",
      "Charles Spurgeon daily devotion",
      "Spurgeon morning and evening",
      devotion.label,
      devotion.verseReference,
      "Kirubai Sathiyam",
    ],
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
      images: [{ url: fallbackImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fallbackImage],
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
  const shareTargetId = "devotion-reader-share-card";
  const imageFileName = getDevotionImageFileName(devotion.date);
  const shareVerseTypography = getShareVerseTypography(devotion.verseText);
  const devotionHtml = renderDevotionHtml(devotion.devotion);
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
    image: [fallbackImage],
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

      <DevotionHero
        slug={devotion.slug}
        label={devotion.label}
        verseReference={devotion.verseReference}
        verseText={devotion.verseText}
        initialImage={{
          url: "",
          photographerName: null,
          photographerUrl: null,
          unsplashUrl: null,
          source: "picsum",
        }}
        targetId={shareTargetId}
        shareOnlyContent={
          <DevotionShareCard
            reference={devotion.verseReference}
            verseText={devotion.verseText}
            verseClassName={shareVerseTypography.blockquoteClassName}
          />
        }
      />

      {devotion.devotion ? (
        <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-8 px-4 sm:px-6 sm:mt-10">
          <div
            className="prose prose-neutral max-w-none text-base leading-8 sm:text-lg"
            style={{ color: "var(--foreground)" }}
            dangerouslySetInnerHTML={{ __html: devotionHtml }}
          />
          <p
            className="text-sm sm:text-base"
            style={{ color: "rgba(255, 255, 255, 0.5)" }}
          >
            {DEVOTION_ATTRIBUTION}
          </p>
          <div className="mb-8">
            <DevotionShareActions
              title={`Daily Devotion - ${devotion.verseReference}`}
              text={shareText}
              url={devotionUrl}
              targetId={shareTargetId}
              exportWidth={600}
              exportHeight={600}
              fileName={imageFileName}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
