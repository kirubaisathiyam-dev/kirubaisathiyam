import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { toAbsoluteUrl } from "@/lib/seo";
import {
  CHURCH_HISTORY_SECTION,
  getChurchHistorySubsection,
  getChurchHistorySubsections,
} from "@/lib/church-history";

export const dynamicParams = false;

const siteName = "Kirubai Sathiyam";
const shareImage = toAbsoluteUrl(CHURCH_HISTORY_SECTION.image || "/logo.png");

type ChurchHistorySubsectionPageProps = {
  params: Promise<{
    subsection: string;
  }>;
};

export function generateStaticParams() {
  const params = getChurchHistorySubsections().map((subsection) => ({
    subsection: subsection.slug,
  }));

  return params.length > 0 ? params : [{ subsection: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: ChurchHistorySubsectionPageProps): Promise<Metadata> {
  const { subsection } = await params;
  const subsectionEntry = getChurchHistorySubsection(subsection);

  if (!subsectionEntry) {
    return {
      title: "உட்பிரிவு கிடைக்கவில்லை | Church History Subsection Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${subsectionEntry.label} | Church History in Tamil`;
  const description = `${CHURCH_HISTORY_SECTION.label} பகுதியில் ${subsectionEntry.label} தொடர்பான தலைப்புகளை தமிழில் வாசிக்கவும்.`;
  const canonical = `/church-history#${subsectionEntry.slug}`;

  return {
    title,
    description,
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

export default async function ChurchHistorySubsectionPage({
  params,
}: ChurchHistorySubsectionPageProps) {
  const { subsection } = await params;
  const subsectionEntry = getChurchHistorySubsection(subsection);

  if (!subsectionEntry) {
    notFound();
  }

  redirect(`/church-history#${subsectionEntry.slug}`);
}
