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
    subsection: topic.subsectionSlug,
    slug: topic.slug,
  }));
}

const siteUrl = getSiteUrl();
const siteName = "Kirubai Sathiyam";

type TheologyTopicPageProps = {
  params: Promise<{
    section: string;
    subsection: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: TheologyTopicPageProps): Promise<Metadata> {
  const { section, subsection, slug } = await params;

  if (!isTheologySection(section)) {
    return {
      title: "Topic Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const topic = getAllTheologyTopics().find(
    (entry) =>
      entry.sectionSlug === section &&
      entry.subsectionSlug === subsection &&
      entry.slug === slug,
  );

  if (!topic) {
    return {
      title: "Topic Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = topic.title || "Theology Topic";
  const description =
    topic.excerpt || `${topic.subsectionLabel} topic inside ${topic.sectionLabel}.`;
  const imageUrl = topic.image ? toAbsoluteUrl(topic.image) : undefined;

  return {
    title,
    description,
    keywords: topic.keywords.length ? topic.keywords : undefined,
    authors: topic.author ? [{ name: topic.author }] : undefined,
    alternates: {
      canonical: `/theology/${topic.sectionSlug}/${topic.subsectionSlug}/${topic.slug}`,
    },
    openGraph: {
      type: "article",
      url: `/theology/${topic.sectionSlug}/${topic.subsectionSlug}/${topic.slug}`,
      title,
      description,
      siteName,
      locale: "ta-IN",
      publishedTime: topic.date,
      authors: topic.author ? [topic.author] : undefined,
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
  const { section, subsection, slug } = await params;

  if (!isTheologySection(section)) {
    notFound();
  }

  const sectionEntry = getTheologySection(section);
  const topic = await getTheologyTopic(section, subsection, slug);

  if (!sectionEntry || !topic) {
    notFound();
  }

  const topics = getAllTheologyTopics();
  const topicIndex = topics.findIndex(
    (entry) =>
      entry.sectionSlug === topic.sectionSlug &&
      entry.subsectionSlug === topic.subsectionSlug &&
      entry.slug === topic.slug,
  );
  const previousTopic = topicIndex > 0 ? topics[topicIndex - 1] : undefined;
  const nextTopic =
    topicIndex >= 0 && topicIndex < topics.length - 1
      ? topics[topicIndex + 1]
      : undefined;

  const topicUrl = toAbsoluteUrl(
    `/theology/${topic.sectionSlug}/${topic.subsectionSlug}/${topic.slug}`,
  );
  const imageUrl = topic.image ? toAbsoluteUrl(topic.image) : undefined;
  const shareText =
    topic.excerpt || `${topic.subsectionLabel} topic inside ${topic.sectionLabel}.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.excerpt,
    articleSection: `${sectionEntry.label} / ${topic.subsectionLabel}`,
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
  };

  return (
    <ContentReader
      itemId={`theology:${topic.sectionSlug}:${topic.subsectionSlug}:${topic.slug}`}
      title={topic.title}
      author={topic.author}
      date={topic.date}
      eyebrow={`${topic.sectionLabel} · ${topic.subsectionLabel}`}
      image={topic.image}
      contentHtml={topic.contentHtml}
      shareTitle={topic.title}
      shareText={shareText}
      shareUrl={topicUrl}
      jsonLd={jsonLd}
      showDate={false}
      showEngagement={false}
      navigation={{
        previous: previousTopic
          ? {
              href: `/theology/${previousTopic.sectionSlug}/${previousTopic.subsectionSlug}/${previousTopic.slug}`,
              label: `${previousTopic.sectionLabel} · ${previousTopic.subsectionLabel}`,
              title: previousTopic.title,
            }
          : undefined,
        toc: {
          href: `/theology/${topic.sectionSlug}#${topic.subsectionSlug}`,
          label: "பொருளடக்கம்",
        },
        next: nextTopic
          ? {
              href: `/theology/${nextTopic.sectionSlug}/${nextTopic.subsectionSlug}/${nextTopic.slug}`,
              label: `${nextTopic.sectionLabel} · ${nextTopic.subsectionLabel}`,
              title: nextTopic.title,
            }
          : undefined,
      }}
    />
  );
}
