import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { toAbsoluteUrl } from "@/lib/seo";
import {
  CHURCH_HISTORY_SECTION,
  getChurchHistorySubsections,
} from "@/lib/church-history";

const shareImage = toAbsoluteUrl(
  CHURCH_HISTORY_SECTION.image || "/logo-light.svg",
);

export const metadata: Metadata = {
  title: CHURCH_HISTORY_SECTION.label,
  description: CHURCH_HISTORY_SECTION.description,
  keywords: [
    "திருச்சபை வரலாறு",
    "Church History",
    "Tamil Christian history",
    "சீர்திருத்த வரலாறு",
    "ஆரம்ப சபை",
    "Kirubai Sathiyam",
  ],
  alternates: {
    canonical: "/church-history",
  },
  openGraph: {
    type: "website",
    url: "/church-history",
    title: CHURCH_HISTORY_SECTION.label,
    description: CHURCH_HISTORY_SECTION.description,
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: CHURCH_HISTORY_SECTION.label,
    description: CHURCH_HISTORY_SECTION.description,
    images: [shareImage],
  },
};

export default function ChurchHistoryPage() {
  const subsections = getChurchHistorySubsections();

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-3">
        {CHURCH_HISTORY_SECTION.image ? (
          <div
            className="relative aspect-square w-full overflow-hidden border"
            style={{ borderColor: "var(--border-color)" }}
          >
            <Image
              src={CHURCH_HISTORY_SECTION.image}
              alt={CHURCH_HISTORY_SECTION.label}
              fill
              priority
              sizes="(min-width: 1024px) 56rem, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            {CHURCH_HISTORY_SECTION.label}
          </h1>
          <p style={{ color: "var(--muted-foreground)" }}>
            {CHURCH_HISTORY_SECTION.description}
          </p>
        </div>
      </header>

      {subsections.length === 0 ? (
        <div
          className="border px-5 py-6 text-sm"
          style={{ borderColor: "var(--border-color)" }}
        >
          இந்தப் பகுதியில் இன்னும் எந்த தலைப்பும் சேர்க்கப்படவில்லை.
        </div>
      ) : (
        <ol className="space-y-10">
          {subsections.map((subsection, subsectionIndex) => (
            <li
              id={subsection.slug}
              key={subsection.slug}
              className="list-none scroll-mt-24"
            >
              <div className="space-y-4 pl-4">
                <div className="flex items-baseline">
                  <span className="w-8 flex-none text-xl font-semibold">
                    {subsectionIndex + 1}.
                  </span>
                  <h2 className="flex-1 text-xl font-semibold">
                    {subsection.label}
                  </h2>
                </div>
                <div className="pl-4">
                  <ol className="space-y-3">
                    {subsection.topics.map((topic, topicIndex) => (
                      <li key={topic.slug} className="list-none">
                        <Link
                          href={`/church-history/${subsection.slug}/${topic.slug}`}
                          className="group flex items-baseline text-base leading-relaxed"
                        >
                          <span className="w-12 flex-none">
                            {subsectionIndex + 1}.{topicIndex + 1}.
                          </span>
                          <span className="flex-1 underline-offset-4 group-hover:underline">
                            {topic.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
