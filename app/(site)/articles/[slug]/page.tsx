import type { Metadata } from "next";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { formatTamilDate } from "@/lib/date";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";
import Image from "next/image";
import ShareButton from "@/components/ShareButton";
import ScrollToTopButton from "@/components/ScrollToTopButton";

export const dynamicParams = false;

export function generateStaticParams() {
  const articles = getAllArticles();

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

const siteUrl = getSiteUrl();
const siteName = "Kirubai Sathiyam";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const articles = getAllArticles();
  const article = articles.find((entry) => entry.slug === slug);

  if (!article) {
    return {
      title: "Article Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = article.title || "Tamil Article";
  const description =
    article.excerpt || "Tamil Christian article from Kirubai Sathiyam.";
  const keywords = [
    ...(article.tags || []),
    ...(article.keywords || []),
    article.type,
  ].filter(Boolean);
  const imageUrl = article.image ? toAbsoluteUrl(article.image) : undefined;

  return {
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    authors: article.author ? [{ name: article.author }] : undefined,
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
    openGraph: {
      type: "article",
      url: `/articles/${article.slug}`,
      title,
      description,
      siteName,
      locale: "ta-IN",
      publishedTime: article.date,
      authors: article.author ? [article.author] : undefined,
      tags: article.tags?.length ? article.tags : undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const articleUrl = toAbsoluteUrl(`/articles/${article.slug}`);
  const imageUrl = article.image ? toAbsoluteUrl(article.image) : undefined;
  const shareText =
    article.excerpt || "Tamil Christian article from Kirubai Sathiyam.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    articleSection: article.type,
    author: article.author
      ? {
          "@type": "Person",
          name: article.author,
        }
      : undefined,
    datePublished: article.date,
    dateModified: article.date,
    image: imageUrl ? [imageUrl] : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl.toString(),
    },
  };

  return (
    <article className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="space-y-3 text-center">
        {article.type && (
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--muted-foreground)" }}
          >
            {article.type}
          </p>
        )}
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          {article.title}
        </h1>
        <p style={{ color: "var(--muted-foreground)" }} className="text-sm">
          {article.author}
        </p>
        <p style={{ color: "var(--muted-foreground)" }} className="text-sm">
          {formatTamilDate(article.date)}
        </p>
      </header>

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
              sizes="(min-width: 1024px) 48rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div
        className="prose prose-neutral max-w-3xl mx-auto"
        dangerouslySetInnerHTML={{ __html: article.contentHtml }}
      />

      <div className="sticky bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <div className="flex flex-col gap-3">
          <ShareButton
            title={article.title}
            text={shareText}
            url={articleUrl}
            className="shadow-sm"
          />
          <ScrollToTopButton />
        </div>
      </div>
    </article>
  );
}
