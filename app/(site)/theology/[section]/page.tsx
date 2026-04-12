import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toAbsoluteUrl } from "@/lib/seo";
import {
  getTheologySection,
  getTheologySubsectionsBySection,
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
      title: "பிரிவு கிடைக்கவில்லை",
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

  const subsections = getTheologySubsectionsBySection(entry.slug);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            {entry.label}
          </h1>
          <p style={{ color: "var(--muted-foreground)" }}>
            {entry.description}
          </p>
        </div>
      </header>

      {subsections.length === 0 ? (
        <div
          className="border px-5 py-6 text-sm"
          style={{ borderColor: "var(--border-color)" }}
        >
          இந்தப் பிரிவில் இன்னும் எந்த தலைப்பும் சேர்க்கப்படவில்லை.
        </div>
      ) : (
        <div className="space-y-10">
          {subsections.map((subsection, subsectionIndex) => (
            <section
              id={subsection.slug}
              key={subsection.slug}
              className="space-y-4 scroll-mt-24"
            >
              <h2 className="pl-8 text-xl font-semibold">
                {subsectionIndex + 1}. {subsection.label}
              </h2>
              <ol className="space-y-3 pl-10">
                {subsection.topics.map((topic, topicIndex) => (
                  <li key={topic.slug}>
                    <Link
                      href={`/theology/${entry.slug}/${subsection.slug}/${topic.slug}`}
                      className="group text-base leading-relaxed"
                    >
                      {subsectionIndex + 1}.{topicIndex + 1}.{" "}
                      <span className="underline-offset-4 group-hover:underline">
                        {topic.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
