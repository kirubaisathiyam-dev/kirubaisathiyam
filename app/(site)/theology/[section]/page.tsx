import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatTamilDate } from "@/lib/date";
import { toAbsoluteUrl } from "@/lib/seo";
import {
  getTheologySection,
  getTheologyTopicsBySection,
  THEOLOGY_SECTIONS,
} from "@/lib/theology";

export const dynamicParams = false;

type TheologySectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export function generateStaticParams() {
  return THEOLOGY_SECTIONS.map((section) => ({
    section: section.slug,
  }));
}

export async function generateMetadata({
  params,
}: TheologySectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const entry = getTheologySection(section);

  if (!entry) {
    return {
      title: "பகுதி கிடைக்கவில்லை",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const shareImage = toAbsoluteUrl("/logo-light.svg");

  return {
    title: `${entry.label} | இறையியல்`,
    description: entry.description,
    alternates: {
      canonical: `/theology/${entry.slug}`,
    },
    openGraph: {
      type: "website",
      url: `/theology/${entry.slug}`,
      title: `${entry.label} | இறையியல்`,
      description: entry.description,
      siteName: "Kirubai Sathiyam",
      images: [{ url: shareImage }],
    },
    twitter: {
      card: "summary",
      title: `${entry.label} | இறையியல்`,
      description: entry.description,
      images: [shareImage],
    },
  };
}

export default async function TheologySectionPage({
  params,
}: TheologySectionPageProps) {
  const { section } = await params;
  const entry = getTheologySection(section);

  if (!entry) {
    notFound();
  }

  const topics = getTheologyTopicsBySection(entry.slug);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-3">
        <Link
          href="/theology"
          className="text-sm font-semibold hover:underline"
          style={{ color: "var(--muted-foreground)" }}
        >
          ← இறையியலுக்கு திரும்ப
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            {entry.label}
          </h1>
          <p style={{ color: "var(--muted-foreground)" }}>
            {entry.description}
          </p>
        </div>
      </header>

      {topics.length === 0 ? (
        <div
          className="border px-5 py-6 text-sm"
          style={{ borderColor: "var(--border-color)" }}
        >
          இந்தப் பகுதிக்கான தலைப்புகள் இன்னும் சேர்க்கப்படவில்லை.
        </div>
      ) : (
        <div className="space-y-6">
          {topics.map((topic) => (
            <Link
              href={`/theology/${entry.slug}/${topic.slug}`}
              key={topic.slug}
              className="block border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start">
                {topic.image && (
                  <div
                    className="w-full self-start overflow-hidden border sm:w-72"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={topic.image}
                        alt={topic.title}
                        fill
                        sizes="(min-width: 640px) 18rem, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2 p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    {topic.audio && (
                      <span
                        className="text-[0.8rem] opacity-70"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <i className="fa-solid fa-volume-up"></i>
                      </span>
                    )}
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {entry.label}
                    </p>
                  </div>
                  <h2 className="text-lg font-semibold leading-snug">
                    {topic.title}
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {formatTamilDate(topic.date)} · {topic.author}
                  </p>
                  {topic.excerpt && (
                    <p className="text-sm leading-relaxed">{topic.excerpt}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
