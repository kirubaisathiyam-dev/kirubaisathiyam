import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKS_SECTION, getAllBooks, getBookBySlug } from "@/lib/books";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

export const dynamicParams = false;

type BookPageProps = {
  params: Promise<{
    book: string;
  }>;
};

export function generateStaticParams() {
  const books = getAllBooks();

  return books.length > 0
    ? books.map((book) => ({ book: book.slug }))
    : [{ book: "__placeholder__" }];
}

const siteUrl = getSiteUrl();
const siteName = "Kirubai Sathiyam";
const fallbackImage = toAbsoluteUrl("/web-app-manifest-512x512.png");

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { book } = await params;
  const entry = getAllBooks().find((item) => item.slug === book);

  if (!entry) {
    return {
      title: "புத்தகம் கிடைக்கவில்லை",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${entry.title} | ${BOOKS_SECTION.label}`;
  const description =
    entry.summary ||
    `${BOOKS_SECTION.label} பகுதியில் ${entry.title} புத்தகத்தின் அறிமுகமும் பொருளடக்கமும் தமிழில்.`;
  const imageUrl = toAbsoluteUrl(
    entry.image || BOOKS_SECTION.image || fallbackImage,
  );
  const canonicalPath = `/books/${entry.slug}`;

  return {
    title,
    description,
    keywords: entry.keywords.length ? entry.keywords : undefined,
    authors: entry.author ? [{ name: entry.author }] : undefined,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "book",
      url: canonicalPath,
      title,
      description,
      siteName,
      locale: "ta-IN",
      authors: entry.author ? [entry.author] : undefined,
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

export default async function BookPage({ params }: BookPageProps) {
  const { book } = await params;
  const entry = await getBookBySlug(book);

  if (!entry) {
    notFound();
  }

  const bookUrl = toAbsoluteUrl(`/books/${entry.slug}`);
  const imageUrl = toAbsoluteUrl(entry.image || BOOKS_SECTION.image || fallbackImage);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: entry.title,
    description: entry.summary,
    author: entry.author
      ? {
          "@type": "Person",
          name: entry.author,
        }
      : undefined,
    datePublished: entry.date,
    image: [imageUrl],
    url: bookUrl,
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl.toString(),
    },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="space-y-3">
        <div className="grid gap-6 md:grid-cols-[minmax(0,240px)_1fr] md:items-start">
          {entry.image ? (
            <div
              className="relative h-auto w-full max-w-md overflow-hidden border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={entry.image}
                  alt={entry.title}
                  fill
                  priority
                  sizes="(min-width: 768px) 15rem, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {entry.title}
            </h1>
            <p style={{ color: "var(--muted-foreground)" }}>{entry.summary}</p>
            <p
              className="text-sm leading-7"
              style={{ color: "var(--foreground-bible)" }}
            >
              {entry.author}
            </p>
            {entry.creditsHtml ? (
              <div
                className="prose prose-sm prose-neutral max-w-3xl text-sm leading-7 book-credits"
                style={{ color: "var(--muted-foreground)" }}
                dangerouslySetInnerHTML={{ __html: entry.creditsHtml }}
              />
            ) : null}
          </div>
        </div>
      </header>

      {entry.directChapters.length === 0 && entry.sections.length === 0 ? (
        <div
          className="border px-5 py-6 text-sm"
          style={{ borderColor: "var(--border-color)" }}
        >
          இந்தப் புத்தகத்தில் இன்னும் எந்த அதிகாரமும் சேர்க்கப்படவில்லை.
        </div>
      ) : (
        <ol className="space-y-10">
          {entry.directChapters.length > 0 ? (
            <li className="list-none">
              <div className="space-y-4 pl-4">
                <ol className="space-y-3">
                  {entry.directChapters.map((chapter, chapterIndex) => (
                    <li key={chapter.slug} className="list-none">
                      <Link
                        href={`/books/${entry.slug}/${chapter.slug}`}
                        className="group flex items-baseline text-base leading-relaxed"
                      >
                        <span className="w-8 flex-none">{chapterIndex + 1}.</span>
                        <span className="flex-1 underline-offset-4 group-hover:underline">
                          {chapter.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </li>
          ) : null}

          {entry.sections.map((section, sectionIndex) => (
            <li
              key={section.slug}
              id={section.slug}
              className="list-none scroll-mt-24"
            >
              <div className="space-y-4 pl-4">
                <div className="flex items-baseline">
                  <span className="w-8 flex-none text-base font-semibold">
                    {entry.directChapters.length + sectionIndex + 1}.
                  </span>
                  <h2 className="flex-1 text-lg font-semibold">
                    {section.label}
                  </h2>
                </div>

                <div className="space-y-3 pl-6">
                  <ol className="space-y-3">
                    {section.chapters.map((chapter, chapterIndex) => (
                      <li key={chapter.slug} className="list-none">
                        <Link
                          href={`/books/${entry.slug}/${section.slug}/${chapter.slug}`}
                          className="group flex items-baseline text-base leading-relaxed"
                        >
                          <span className="w-12 flex-none">
                            {entry.directChapters.length + sectionIndex + 1}.
                            {chapterIndex + 1}.
                          </span>
                          <span className="flex-1 underline-offset-4 group-hover:underline">
                            {chapter.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
