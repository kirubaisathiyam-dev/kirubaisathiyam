import type { Metadata } from "next";
import { getAllArticles } from "@/lib/articles";
import { formatTamilDate } from "@/lib/date";
import { toAbsoluteUrl } from "@/lib/seo";
import { getTheologySectionsWithTopics } from "@/lib/theology";
import Image from "next/image";
import Link from "next/link";

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
  const [featured, ...rest] = articles;
  const recentArticles = rest.slice(0, 6);

  return (
    <div className="space-y-12">
      {featured && (
        <section className="space-y-4">
          <Link
            href={`/articles/${featured.slug}`}
            className="block border"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div
              className={`grid ${
                featured.image ? "md:grid-cols-[2fr,1fr]" : ""
              }`}
            >
              {featured.image && (
                <div
                  className="overflow-hidden border"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={featured.image}
                      alt={featured.title}
                      fill
                      sizes="(min-width: 1024px) 40rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-3 p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  {featured.audio && (
                    <span
                      className="text-[0.8rem] opacity-70"
                      style={{
                        color: "var(--muted-foreground)",
                      }}
                    >
                      <i className="fa-solid fa-volume-up"></i>
                    </span>
                  )}
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {featured.type || "கட்டுரை"}
                  </p>
                </div>
                <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
                  {featured.title}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {formatTamilDate(featured.date)} · {featured.author}
                </p>
                {featured.excerpt && (
                  <p className="leading-relaxed">{featured.excerpt}</p>
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">சமீபத்திய பதிவுகள்</h2>
          <Link
            href="/articles"
            className="text-sm font-semibold hover:underline"
          >
            மேலும் →
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
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {article.audio && (
                    <span
                      className="text-[0.8rem] opacity-70"
                      style={{
                        color: "var(--muted-foreground)",
                      }}
                    >
                      <i className="fa-solid fa-volume-up"></i>
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

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">இறையியல்</h2>
          <Link
            href="/theology"
            className="text-sm font-semibold hover:underline"
          >
            மேலும் →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {theologySections.map((section) => (
            <section
              key={section.slug}
              className="flex h-full flex-col border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{section.label}</h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {section.description}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    {section.topics.length} தலைப்புகள்
                  </span>
                </div>

                {section.topics.length === 0 ? (
                  <p
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    இன்னும் தலைப்புகள் சேர்க்கப்படவில்லை.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {section.topics.slice(0, 3).map((topic) => (
                      <li key={topic.slug}>
                        <Link
                          href={`/theology/${section.slug}/${topic.slug}`}
                          className="block rounded border px-4 py-3 transition hover:opacity-80"
                          style={{ borderColor: "var(--border-color)" }}
                        >
                          <p className="font-medium leading-snug">
                            {topic.title}
                          </p>
                          <p
                            className="mt-1 text-xs"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {formatTamilDate(topic.date)} · {topic.author}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div
                className="mt-auto border-t p-5"
                style={{ borderColor: "var(--border-color)" }}
              >
                <Link
                  href={`/theology/${section.slug}`}
                  className="text-sm font-semibold hover:underline"
                >
                  பகுதியைப் பார் →
                </Link>
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
