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
  return getChurchHistorySubsections().map((subsection) => ({
    subsection: subsection.slug,
  }));
}

export async function generateMetadata({
  params,
}: ChurchHistorySubsectionPageProps): Promise<Metadata> {
  const { subsection } = await params;
  const subsectionEntry = getChurchHistorySubsection(subsection);

  if (!subsectionEntry) {
    return {
      title: "Subsection Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${subsectionEntry.label} | ${CHURCH_HISTORY_SECTION.label}`,
    description: `${subsectionEntry.label} topics inside ${CHURCH_HISTORY_SECTION.label}.`,
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
