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
      title: "தலைப்பு கிடைக்கவில்லை | Theology Topic Not Found",
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
      title: "தலைப்பு கிடைக்கவில்லை | Theology Topic Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    topic.title || `${topic.subsectionLabel} | Theology Topic in Tamil`;
  const description =
    topic.excerpt ||
    `${topic.sectionLabel} பகுதியில் ${topic.subsectionLabel} குறித்த இறையியல் விளக்கம் தமிழில்.`;
  const shareImage = topic.image || topic.sectionImage;
  const imageUrl = shareImage ? toAbsoluteUrl(shareImage) : undefined;

  return {
    title,
    description,
    keywords: [
      ...topic.keywords,
      topic.sectionLabel,
      topic.subsectionLabel,
      "Theology in Tamil",
      "Tamil theology",
      topic.sectionSlug === "systematic-theology"
        ? "Systematic theology in Tamil"
        : "Reformed theology in Tamil",
      "Kirubai Sathiyam",
    ],
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
  const shareImage = topic.image || topic.sectionImage;
  const imageUrl = shareImage ? toAbsoluteUrl(shareImage) : undefined;
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
  const systematicTheologyFooterNote =
    topic.sectionSlug === "systematic-theology" ? (
      <p>
        Source: <em>Everyone&apos;s a Theologian: An Introduction to Systematic Theology</em>,
        © 2014 by R.C. Sproul. Read more at{" "}
        <a
          href="https://store.ligonier.org/everyones-a-theologian-hardcover?utm_source=LMBlog&utm_medium=post&utm_campaign=everyonesatheologian"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--foreground-bible)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          Ligonier
        </a>
        . This Tamil version was translated using Gemini AI and reviewed by
        kirubaisathiyam.org.
      </p>
    ) : undefined;

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
      footerNote={systematicTheologyFooterNote}
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
