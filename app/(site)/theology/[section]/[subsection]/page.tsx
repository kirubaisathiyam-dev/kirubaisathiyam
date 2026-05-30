import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { toAbsoluteUrl } from "@/lib/seo";
import {
  getTheologySection,
  getTheologySubsection,
  getTheologySubsectionsBySection,
  THEOLOGY_SECTIONS,
} from "@/lib/theology";

export const dynamicParams = false;

const siteName = "Kirubai Sathiyam";
const fallbackShareImage = toAbsoluteUrl("/logo.png");

type TheologySubsectionPageProps = {
  params: Promise<{
    section: string;
    subsection: string;
  }>;
};

export function generateStaticParams() {
  return THEOLOGY_SECTIONS.flatMap((section) =>
    getTheologySubsectionsBySection(section.slug).map((subsection) => ({
      section: section.slug,
      subsection: subsection.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: TheologySubsectionPageProps): Promise<Metadata> {
  const { section, subsection } = await params;
  const sectionEntry = getTheologySection(section);

  if (!sectionEntry) {
    return {
      title: "பிரிவு கிடைக்கவில்லை | Theology Section Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const subsectionEntry = getTheologySubsection(sectionEntry.slug, subsection);

  if (!subsectionEntry) {
    return {
      title: "உட்பிரிவு கிடைக்கவில்லை | Theology Subsection Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${subsectionEntry.label} | ${sectionEntry.label} Theology`;
  const description = `${sectionEntry.label} பகுதியில் ${subsectionEntry.label} தொடர்பான தலைப்புகளை தமிழில் வாசிக்கவும்.`;
  const canonical = `/theology/${sectionEntry.slug}#${subsectionEntry.slug}`;
  const shareImage = toAbsoluteUrl(sectionEntry.image || fallbackShareImage);

  return {
    title,
    description,
    keywords: [
      subsectionEntry.label,
      `${subsectionEntry.label} in Tamil`,
      `${sectionEntry.label} ${subsectionEntry.label}`,
      "Theology in Tamil",
      "Tamil theology",
      "Kirubai Sathiyam",
    ],
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName,
      images: [{ url: shareImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}

export default async function TheologySubsectionPage({
  params,
}: TheologySubsectionPageProps) {
  const { section, subsection } = await params;
  const sectionEntry = getTheologySection(section);

  if (!sectionEntry) {
    notFound();
  }

  const subsectionEntry = getTheologySubsection(sectionEntry.slug, subsection);

  if (!subsectionEntry) {
    notFound();
  }

  redirect(`/theology/${sectionEntry.slug}#${subsectionEntry.slug}`);
}
