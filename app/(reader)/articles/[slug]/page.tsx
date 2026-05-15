import type { Metadata } from "next";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";
import ContentReader from "@/components/ContentReader";

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
  const audioUrl = article.audio ? toAbsoluteUrl(article.audio) : undefined;
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
    audio: audioUrl
      ? {
          "@type": "AudioObject",
          name: article.title ? `${article.title} (audio)` : undefined,
          url: audioUrl,
          contentUrl: audioUrl,
        }
      : undefined,
  };

  return (
    <ContentReader
      itemId={slug}
      title={article.title}
      author={article.author}
      date={article.date}
      eyebrow={article.type}
      image={article.image}
      audio={article.audio}
      contentHtml={article.contentHtml}
      shareTitle={article.title}
      shareText={shareText}
      shareUrl={articleUrl}
      jsonLd={jsonLd}
    />
  );
}
