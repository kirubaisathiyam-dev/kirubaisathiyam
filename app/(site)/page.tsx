import type { Metadata } from "next";
import { ArrowRightIcon, VolumeIcon } from "@/components/Icons";
import VerseOfTheDayOverlay from "@/components/VerseOfTheDayOverlay";
import Image from "next/image";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { formatTamilDate } from "@/lib/date";
import { toAbsoluteUrl } from "@/lib/seo";
import { getTheologySectionsWithTopics } from "@/lib/theology";

const shareImage = toAbsoluteUrl("/logo-light.svg");

export const metadata: Metadata = {
  title: "Tamil Christian Articles & Bible",
  description:
    "Read Tamil Christian articles and the Tamil Holy Bible with study notes at Kirubai Sathiyam.",
  keywords: [
    "Tamil Christian articles",
    "Tamil Holy Bible",
    "Tamil Bible",
    "Study Bible Tamil",
    "Illustrated Bible",
    "Tamil Old Version",
    "Bible study notes",
    "Kirubai Sathiyam",
    "தமிழ் பரிசுத்த வேதாகமம்",
    "தமிழ் ஆய்வு வேதாகமம்",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Tamil Christian Articles & Bible",
    description:
      "Read Tamil Christian articles and the Tamil Holy Bible with study notes at Kirubai Sathiyam.",
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: "Tamil Christian Articles & Bible",
    description:
      "Read Tamil Christian articles and the Tamil Holy Bible with study notes at Kirubai Sathiyam.",
    images: [shareImage],
  },
};

export default function Home() {
  const articles = getAllArticles();
  const theologySections = getTheologySectionsWithTopics();
  const recentArticles = articles.slice(0, 6);

  return (
    <div className="space-y-16">
      <VerseOfTheDayOverlay />

      <section className="mx-auto w-full max-w-5xl space-y-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">கட்டுரைகள்</h2>
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            மேலும்
            <ArrowRightIcon style={{ width: 15, height: 15 }} />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recentArticles.map((article) => (
            <Link
              href={`/articles/${article.slug}`}
              key={article.slug}
              className="flex h-full flex-col border"
              style={{ borderColor: "var(--border-color)" }}
            >
              {article.image && (
                <div
                  className="overflow-hidden border"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      sizes="(min-width: 1024px) 18rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-1">
                  {article.audio && (
                    <span
                      className="text-[0.8rem] opacity-70"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <VolumeIcon style={{ width: 15, height: 15 }} />
                    </span>
                  )}
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {article.type || "கட்டுரை"}
                  </p>
                </div>
                <div className="text-lg font-semibold leading-snug hover:underline">
                  {article.title}
                </div>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {formatTamilDate(article.date)} · {article.author}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-4">
        <hr style={{ borderColor: "var(--border-color)" }} />
      </div>

      <section className="mx-auto w-full max-w-5xl space-y-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">இறையியல்</h2>
          <Link
            href="/theology"
            className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            மேலும்
            <ArrowRightIcon style={{ width: 15, height: 15 }} />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {theologySections.map((section) => (
            <Link
              href={`/theology/${section.slug}`}
              key={section.slug}
              className="group flex h-full flex-col border"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--muted-background)",
              }}
            >
              {section.image ? (
                <div
                  className="relative aspect-square w-full overflow-hidden border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <Image
                    src={section.image}
                    alt={section.label}
                    fill
                    sizes="(min-width: 768px) 24rem, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              ) : null}
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold group-hover:underline">
                      {section.label}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="mt-auto flex justify-end border-t p-5"
                style={{ borderColor: "var(--border-color)" }}
              >
                <span className="inline-flex items-center" aria-hidden="true">
                  <ArrowRightIcon style={{ width: 15, height: 15 }} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
