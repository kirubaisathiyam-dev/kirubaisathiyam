import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentReader from "@/components/ContentReader";
import {
  CHURCH_HISTORY_SECTION,
  getAllChurchHistoryTopics,
  getChurchHistoryTopic,
} from "@/lib/church-history";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  const params = getAllChurchHistoryTopics()
    .filter((topic) => Boolean(topic.groupSlug))
    .map((topic) => ({
      subsection: topic.subsectionSlug,
      group: topic.groupSlug!,
      slug: topic.slug,
    }));

  return params.length > 0
    ? params
    : [
        {
          subsection: "__placeholder__",
          group: "__placeholder__",
          slug: "__placeholder__",
        },
      ];
}

const siteUrl = getSiteUrl();
const siteName = "Kirubai Sathiyam";

type ChurchHistoryTopicPageProps = {
  params: Promise<{
    subsection: string;
    group: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ChurchHistoryTopicPageProps): Promise<Metadata> {
  const { subsection, group, slug } = await params;
  const topic = getAllChurchHistoryTopics().find(
    (entry) =>
      entry.subsectionSlug === subsection &&
      entry.groupSlug === group &&
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

  const title = topic.title || "Church History Topic";
  const description =
    topic.excerpt ||
    `${topic.groupLabel} topic inside ${CHURCH_HISTORY_SECTION.label}.`;
  const shareImage = topic.image || CHURCH_HISTORY_SECTION.image;
  const imageUrl = shareImage ? toAbsoluteUrl(shareImage) : undefined;

  return {
    title,
    description,
    keywords: topic.keywords.length ? topic.keywords : undefined,
    authors: topic.author ? [{ name: topic.author }] : undefined,
    alternates: {
      canonical: `/church-history/${topic.subsectionSlug}/${topic.groupSlug}/${topic.slug}`,
    },
    openGraph: {
      type: "article",
      url: `/church-history/${topic.subsectionSlug}/${topic.groupSlug}/${topic.slug}`,
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

export default async function ChurchHistoryTopicPage({
  params,
}: ChurchHistoryTopicPageProps) {
  const { subsection, group, slug } = await params;
  const topic = await getChurchHistoryTopic(subsection, group, slug);

  if (!topic) {
    notFound();
  }

  const topics = getAllChurchHistoryTopics();
  const topicIndex = topics.findIndex(
    (entry) =>
      entry.subsectionSlug === topic.subsectionSlug &&
      entry.groupSlug === topic.groupSlug &&
      entry.slug === topic.slug,
  );
  const previousTopic = topicIndex > 0 ? topics[topicIndex - 1] : undefined;
  const nextTopic =
    topicIndex >= 0 && topicIndex < topics.length - 1
      ? topics[topicIndex + 1]
      : undefined;

  const topicUrl = toAbsoluteUrl(
    `/church-history/${topic.subsectionSlug}/${topic.groupSlug}/${topic.slug}`,
  );
  const shareImage = topic.image || CHURCH_HISTORY_SECTION.image;
  const imageUrl = shareImage ? toAbsoluteUrl(shareImage) : undefined;
  const shareText =
    topic.excerpt ||
    `${topic.groupLabel} topic inside ${CHURCH_HISTORY_SECTION.label}.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.excerpt,
    articleSection: `${CHURCH_HISTORY_SECTION.label} / ${topic.subsectionLabel} / ${topic.groupLabel}`,
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
      itemId={`church-history:${topic.subsectionSlug}:${topic.groupSlug}:${topic.slug}`}
      title={topic.title}
      author={topic.author}
      date={topic.date}
      eyebrow={`${CHURCH_HISTORY_SECTION.label} · ${topic.subsectionLabel} · ${topic.groupLabel}`}
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
              href: previousTopic.groupSlug
                ? `/church-history/${previousTopic.subsectionSlug}/${previousTopic.groupSlug}/${previousTopic.slug}`
                : `/church-history/${previousTopic.subsectionSlug}/${previousTopic.slug}`,
              label: previousTopic.groupLabel
                ? `${CHURCH_HISTORY_SECTION.label} · ${previousTopic.groupLabel}`
                : `${CHURCH_HISTORY_SECTION.label} · ${previousTopic.subsectionLabel}`,
              title: previousTopic.title,
            }
          : undefined,
        toc: {
          href: `/church-history#${topic.subsectionSlug}-${topic.groupSlug}`,
          label: "பொருளடக்கம்",
        },
        next: nextTopic
          ? {
              href: nextTopic.groupSlug
                ? `/church-history/${nextTopic.subsectionSlug}/${nextTopic.groupSlug}/${nextTopic.slug}`
                : `/church-history/${nextTopic.subsectionSlug}/${nextTopic.slug}`,
              label: nextTopic.groupLabel
                ? `${CHURCH_HISTORY_SECTION.label} · ${nextTopic.groupLabel}`
                : `${CHURCH_HISTORY_SECTION.label} · ${nextTopic.subsectionLabel}`,
              title: nextTopic.title,
            }
          : undefined,
      }}
    />
  );
}
