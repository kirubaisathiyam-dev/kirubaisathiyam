import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentReader from "@/components/ContentReader";
import {
  getAllTheologyTopics,
  getTheologySection,
  getTheologyTopic,
  isTheologySection,
} from "@/lib/theology";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTheologyTopics().map((topic) => ({
    section: topic.sectionSlug,
    slug: topic.slug,
  }));
}

const siteUrl = getSiteUrl();
const siteName = "Kirubai Sathiyam";

type TheologyTopicPageProps = {
  params: Promise<{
    section: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: TheologyTopicPageProps): Promise<Metadata> {
  const { section, slug } = await params;

  if (!isTheologySection(section)) {
    return {
      title: "தலைப்பு கிடைக்கவில்லை",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const topic = getAllTheologyTopics().find(
    (entry) => entry.sectionSlug === section && entry.slug === slug,
  );

  if (!topic) {
    return {
      title: "தலைப்பு கிடைக்கவில்லை",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = topic.title || "இறையியல் தலைப்பு";
  const description =
    topic.excerpt || `${topic.sectionLabel} பகுதியில் உள்ள ஒரு தலைப்பு.`;
  const keywords = [...(topic.tags || []), ...(topic.keywords || [])].filter(
    Boolean,
  );
  const imageUrl = topic.image ? toAbsoluteUrl(topic.image) : undefined;

  return {
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    authors: topic.author ? [{ name: topic.author }] : undefined,
    alternates: {
      canonical: `/theology/${topic.sectionSlug}/${topic.slug}`,
    },
    openGraph: {
      type: "article",
      url: `/theology/${topic.sectionSlug}/${topic.slug}`,
      title,
      description,
      siteName,
      locale: "ta-IN",
      publishedTime: topic.date,
      authors: topic.author ? [topic.author] : undefined,
      tags: topic.tags?.length ? topic.tags : undefined,
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

export default async function TheologyTopicPage({
  params,
}: TheologyTopicPageProps) {
  const { section, slug } = await params;

  if (!isTheologySection(section)) {
    notFound();
  }

  const sectionEntry = getTheologySection(section);
  const topic = await getTheologyTopic(section, slug);

  if (!sectionEntry || !topic) {
    notFound();
  }

  const topicUrl = toAbsoluteUrl(`/theology/${topic.sectionSlug}/${topic.slug}`);
  const imageUrl = topic.image ? toAbsoluteUrl(topic.image) : undefined;
  const shareText =
    topic.excerpt || `${topic.sectionLabel} பகுதியில் உள்ள ஒரு தலைப்பு.`;
  const audioUrl = topic.audio ? toAbsoluteUrl(topic.audio) : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.excerpt,
    articleSection: sectionEntry.label,
    author: topic.author
      ? {
          "@type": "Person",
          name: topic.author,
        }
      : undefined,
    datePublished: topic.date,
    dateModified: topic.date,
    image: imageUrl ? [imageUrl] : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": topicUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl.toString(),
    },
    audio: audioUrl
      ? {
          "@type": "AudioObject",
          name: topic.title ? `${topic.title} (ஒலி)` : undefined,
          url: audioUrl,
          contentUrl: audioUrl,
        }
      : undefined,
  };

  return (
    <ContentReader
      itemId={`theology:${topic.sectionSlug}:${topic.slug}`}
      title={topic.title}
      author={topic.author}
      date={topic.date}
      eyebrow={topic.sectionLabel}
      image={topic.image}
      audio={topic.audio}
      contentHtml={topic.contentHtml}
      shareTitle={topic.title}
      shareText={shareText}
      shareUrl={topicUrl}
      jsonLd={jsonLd}
    />
  );
}
