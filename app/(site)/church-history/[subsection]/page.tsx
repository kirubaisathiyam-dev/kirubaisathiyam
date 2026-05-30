import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  CHURCH_HISTORY_SECTION,
  getChurchHistorySubsection,
  getChurchHistorySubsections,
} from "@/lib/church-history";

export const dynamicParams = false;

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

  return {
    title: `${subsectionEntry.label} | Church History in Tamil`,
    description: `${CHURCH_HISTORY_SECTION.label} பகுதியில் ${subsectionEntry.label} தொடர்பான தலைப்புகளை தமிழில் வாசிக்கவும்.`,
    alternates: {
      canonical: `/church-history#${subsectionEntry.slug}`,
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
