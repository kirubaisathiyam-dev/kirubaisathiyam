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

function buildChurchHistoryHref(
  subsectionSlug: string,
  slug: string,
  groupSlug?: string | null,
) {
  return groupSlug
    ? `/church-history/${subsectionSlug}/${groupSlug}/${slug}`
    : `/church-history/${subsectionSlug}/${slug}`;
}

export function generateStaticParams() {
  const params = getAllChurchHistoryTopics().map((topic) => ({
    subsection: topic.subsectionSlug,
    segments: topic.groupSlug ? [topic.groupSlug, topic.slug] : [topic.slug],
  }));

  return params.length > 0
    ? params
    : [{ subsection: "__placeholder__", segments: ["__placeholder__"] }];
}

const siteUrl = getSiteUrl();
const siteName = "Kirubai Sathiyam";
const fallbackImage = toAbsoluteUrl("/web-app-manifest-512x512.png");

type ChurchHistoryTopicPageProps = {
  params: Promise<{
    subsection: string;
    segments: string[];
  }>;
};

function getSharePreview(contentHtml: string, fallback: string, maxWords = 20) {
  const text = contentHtml
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return fallback;
  }

  const words = text.split(" ").filter(Boolean);
  if (words.length <= maxWords) {
    return text;
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

export async function generateMetadata({
  params,
}: ChurchHistoryTopicPageProps): Promise<Metadata> {
  const { subsection, segments } = await params;
  const [firstSegment = "", secondSegment = ""] = segments;
  const groupSlug = secondSegment ? firstSegment : null;
  const slug = secondSegment || firstSegment;

  const topic = getAllChurchHistoryTopics().find(
    (entry) =>
      entry.subsectionSlug === subsection &&
      (entry.groupSlug || null) === groupSlug &&
      entry.slug === slug,
  );

  if (!topic) {
    return {
      title: "தலைப்பு கிடைக்கவில்லை | Church History Topic Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    topic.title || `${topic.subsectionLabel} | Church History Topic in Tamil`;
  const description =
    topic.excerpt ||
    `${CHURCH_HISTORY_SECTION.label} பகுதியில் ${topic.groupLabel || topic.subsectionLabel} குறித்த விளக்கம் தமிழில்.`;
  const shareImage = CHURCH_HISTORY_SECTION.image || topic.image;
  const imageUrl = shareImage ? toAbsoluteUrl(shareImage) : fallbackImage;
  const canonicalPath = buildChurchHistoryHref(
    topic.subsectionSlug,
    topic.slug,
    topic.groupSlug,
  );

  return {
    title,
    description,
    keywords: topic.keywords.length ? topic.keywords : undefined,
    authors: topic.author ? [{ name: topic.author }] : undefined,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      url: canonicalPath,
      title,
      description,
      siteName,
      locale: "ta-IN",
      publishedTime: topic.date,
      authors: topic.author ? [topic.author] : undefined,
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

export default async function ChurchHistoryTopicPage({
  params,
}: ChurchHistoryTopicPageProps) {
  const { subsection, segments } = await params;
  const [firstSegment = "", secondSegment = ""] = segments;

  if (!firstSegment || segments.length > 2) {
    notFound();
  }

  const groupSlug = secondSegment ? firstSegment : null;
  const slug = secondSegment || firstSegment;
  const topic = await getChurchHistoryTopic(subsection, slug, groupSlug);

  if (!topic || (topic.groupSlug || null) !== groupSlug) {
    notFound();
  }

  const topics = getAllChurchHistoryTopics();
  const topicIndex = topics.findIndex(
    (entry) =>
      entry.subsectionSlug === topic.subsectionSlug &&
      (entry.groupSlug || null) === (topic.groupSlug || null) &&
      entry.slug === topic.slug,
  );
  const previousTopic = topicIndex > 0 ? topics[topicIndex - 1] : undefined;
  const nextTopic =
    topicIndex >= 0 && topicIndex < topics.length - 1
      ? topics[topicIndex + 1]
      : undefined;

  const topicUrl = toAbsoluteUrl(
    buildChurchHistoryHref(topic.subsectionSlug, topic.slug, topic.groupSlug),
  );
  const shareImage = CHURCH_HISTORY_SECTION.image || topic.image;
  const imageUrl = shareImage ? toAbsoluteUrl(shareImage) : fallbackImage;
  const sharePreview = getSharePreview(
    topic.contentHtml,
    `${topic.groupLabel || topic.subsectionLabel} topic inside ${CHURCH_HISTORY_SECTION.label}.`,
  );
  const shareText = [
    topic.title,
    topic.groupLabel
      ? `${CHURCH_HISTORY_SECTION.label} · ${topic.subsectionLabel} · ${topic.groupLabel}`
      : `${CHURCH_HISTORY_SECTION.label} · ${topic.subsectionLabel}`,
    sharePreview,
    "Read more",
  ]
    .filter(Boolean)
    .join("\n\n");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.excerpt,
    articleSection: topic.groupLabel
      ? `${CHURCH_HISTORY_SECTION.label} / ${topic.subsectionLabel} / ${topic.groupLabel}`
      : `${CHURCH_HISTORY_SECTION.label} / ${topic.subsectionLabel}`,
    author: topic.author
      ? {
          "@type": "Person",
          name: topic.author,
        }
      : undefined,
    datePublished: topic.date,
    dateModified: topic.date,
    image: [imageUrl],
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
      itemId={
        topic.groupSlug
          ? `church-history:${topic.subsectionSlug}:${topic.groupSlug}:${topic.slug}`
          : `church-history:${topic.subsectionSlug}:${topic.slug}`
      }
      title={topic.title}
      author={topic.author}
      date={topic.date}
      eyebrow={
        topic.groupLabel
          ? `${CHURCH_HISTORY_SECTION.label} · ${topic.subsectionLabel} · ${topic.groupLabel}`
          : `${CHURCH_HISTORY_SECTION.label} · ${topic.subsectionLabel}`
      }
      image={topic.image}
      contentHtml={topic.contentHtml}
      shareTitle={topic.title}
      shareText={shareText}
      shareUrl={topicUrl}
      jsonLd={jsonLd}
      footerNote={
        <p>
          Source: <em>History of the Christian Church</em> by Philip Schaff. Read
          the original at{" "}
          <a
            href="https://www.ccel.org/s/schaff/history/About.htm"
            target="_blank"
            rel="noreferrer"
            style={{
              color: "var(--foreground-bible)",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
            }}
          >
            CCEL
          </a>
          . This Tamil version was translated using Gemini AI and reviewed by
          kirubaisathiyam.org.
        </p>
      }
      showDate={false}
      showEngagement={false}
      navigation={{
        previous: previousTopic
          ? {
              href: buildChurchHistoryHref(
                previousTopic.subsectionSlug,
                previousTopic.slug,
                previousTopic.groupSlug,
              ),
              label: previousTopic.groupLabel
                ? `${CHURCH_HISTORY_SECTION.label} · ${previousTopic.groupLabel}`
                : `${CHURCH_HISTORY_SECTION.label} · ${previousTopic.subsectionLabel}`,
              title: previousTopic.title,
            }
          : undefined,
        toc: {
          href: topic.groupSlug
            ? `/church-history#${topic.subsectionSlug}-${topic.groupSlug}`
            : `/church-history#${topic.subsectionSlug}`,
          label: "பொருளடக்கம்",
        },
        next: nextTopic
          ? {
              href: buildChurchHistoryHref(
                nextTopic.subsectionSlug,
                nextTopic.slug,
                nextTopic.groupSlug,
              ),
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
