import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentReader from "@/components/ContentReader";
import { getAllBookChapters, getAllBooks, getBookChapter } from "@/lib/books";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

export const dynamicParams = false;

type BookChapterPageProps = {
  params: Promise<{
    book: string;
    segments: string[];
  }>;
};

function buildBookChapterHref(
  bookSlug: string,
  slug: string,
  sectionSlug?: string | null,
) {
  return sectionSlug
    ? `/books/${bookSlug}/${sectionSlug}/${slug}`
    : `/books/${bookSlug}/${slug}`;
}

export function generateStaticParams() {
  const chapters = getAllBookChapters();

  return chapters.length > 0
    ? chapters.map((chapter) => ({
        book: chapter.bookSlug,
        segments: chapter.sectionSlug ? [chapter.sectionSlug, chapter.slug] : [chapter.slug],
      }))
    : [{ book: "__placeholder__", segments: ["__placeholder__"] }];
}

const siteUrl = getSiteUrl();
const siteName = "Kirubai Sathiyam";
const fallbackImage = toAbsoluteUrl("/web-app-manifest-512x512.png");

export async function generateMetadata({
  params,
}: BookChapterPageProps): Promise<Metadata> {
  const { book, segments } = await params;
  const [firstSegment = "", secondSegment = ""] = segments;
  const sectionSlug = secondSegment ? firstSegment : null;
  const slug = secondSegment || firstSegment;
  const chapter = getAllBookChapters().find(
    (entry) =>
      entry.bookSlug === book &&
      (entry.sectionSlug || null) === sectionSlug &&
      entry.slug === slug,
  );
  const bookMeta = getAllBooks().find((entry) => entry.slug === book);

  if (!chapter) {
    return {
      title: "அதிகாரம் கிடைக்கவில்லை",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const imageUrl = toAbsoluteUrl(chapter.image || bookMeta?.image || fallbackImage);
  const title = `${chapter.title} | ${chapter.bookTitle}`;
  const description = chapter.excerpt || `${chapter.bookTitle} புத்தகத்தின் தமிழ் அதிகாரம்.`;

  return {
    title,
    description,
    authors: chapter.author ? [{ name: chapter.author }] : undefined,
    alternates: {
      canonical: buildBookChapterHref(book, slug, sectionSlug),
    },
    openGraph: {
      type: "article",
      url: buildBookChapterHref(book, slug, sectionSlug),
      title,
      description,
      siteName,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function BookChapterPage({ params }: BookChapterPageProps) {
  const { book, segments } = await params;
  const [firstSegment = "", secondSegment = ""] = segments;

  if (!firstSegment || segments.length > 2) {
    notFound();
  }

  const sectionSlug = secondSegment ? firstSegment : null;
  const slug = secondSegment || firstSegment;
  const chapter = await getBookChapter(book, slug, sectionSlug);
  const bookMeta = getAllBooks().find((entry) => entry.slug === book);

  if (!chapter || (chapter.sectionSlug || null) !== sectionSlug) {
    notFound();
  }

  const chapters = getAllBookChapters().filter((entry) => entry.bookSlug === book);
  const chapterIndex = chapters.findIndex(
    (entry) =>
      (entry.sectionSlug || null) === (chapter.sectionSlug || null) &&
      entry.slug === chapter.slug,
  );
  const previousChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : undefined;
  const nextChapter =
    chapterIndex >= 0 && chapterIndex < chapters.length - 1
      ? chapters[chapterIndex + 1]
      : undefined;
  const chapterUrl = toAbsoluteUrl(buildBookChapterHref(book, slug, sectionSlug));
  const imageUrl = chapter.image
    ? toAbsoluteUrl(chapter.image)
    : bookMeta?.image
      ? toAbsoluteUrl(bookMeta.image)
      : fallbackImage;
  const shareText = chapter.excerpt || `${chapter.title} from ${chapter.bookTitle}.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Chapter",
    headline: chapter.title,
    description: chapter.excerpt,
    isPartOf: {
      "@type": "Book",
      name: chapter.bookTitle,
      url: toAbsoluteUrl(`/books/${book}`),
    },
    author: chapter.author
      ? {
          "@type": "Person",
          name: chapter.author,
        }
      : undefined,
    datePublished: chapter.date,
    dateModified: chapter.date,
    image: [imageUrl],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": chapterUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl.toString(),
    },
  };

  return (
    <ContentReader
      itemId={
        chapter.sectionSlug
          ? `book:${chapter.bookSlug}:${chapter.sectionSlug}:${chapter.slug}`
          : `book:${chapter.bookSlug}:${chapter.slug}`
      }
      title={chapter.title}
      author={chapter.author}
      date={chapter.date}
      eyebrow={
        chapter.sectionLabel
          ? `${chapter.bookTitle} · ${chapter.sectionLabel}`
          : chapter.bookTitle
      }
      image={chapter.image}
      contentHtml={chapter.contentHtml}
      shareTitle={chapter.title}
      shareText={shareText}
      shareUrl={chapterUrl}
      jsonLd={jsonLd}
      showDate={false}
      showEngagement={false}
      navigation={{
        previous: previousChapter
          ? {
              href: buildBookChapterHref(
                previousChapter.bookSlug,
                previousChapter.slug,
                previousChapter.sectionSlug,
              ),
              label: previousChapter.sectionLabel
                ? `${previousChapter.bookTitle} · ${previousChapter.sectionLabel}`
                : previousChapter.bookTitle,
              title: previousChapter.title,
            }
          : undefined,
        toc: {
          href: chapter.sectionSlug
            ? `/books/${chapter.bookSlug}#${chapter.sectionSlug}`
            : `/books/${chapter.bookSlug}`,
          label: "பொருளடக்கம்",
        },
        next: nextChapter
          ? {
              href: buildBookChapterHref(
                nextChapter.bookSlug,
                nextChapter.slug,
                nextChapter.sectionSlug,
              ),
              label: nextChapter.sectionLabel
                ? `${nextChapter.bookTitle} · ${nextChapter.sectionLabel}`
                : nextChapter.bookTitle,
              title: nextChapter.title,
            }
          : undefined,
      }}
    />
  );
}
