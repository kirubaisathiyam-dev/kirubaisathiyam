import type { Metadata } from "next";
import { getAllArticles } from "@/lib/articles";
import { formatTamilDate } from "@/lib/date";
import { toAbsoluteUrl } from "@/lib/seo";
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
  const [featured, ...rest] = articles;

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
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {featured.type || "கட்டுரை"}
                </p>
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
          {rest.map((article) => (
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
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {article.type || "கட்டுரை"}
                </p>
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
    </div>
  );
}
