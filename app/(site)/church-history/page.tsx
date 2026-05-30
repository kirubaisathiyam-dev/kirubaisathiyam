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
    "Church History in Tamil",
    "Tamil Christian history",
    "Tamil church history",
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
            className="relative h-[min(100vw,500px)] w-full overflow-hidden border sm:h-[480px]"
            style={{ borderColor: "var(--border-color)" }}
          >
            <Image
              src={CHURCH_HISTORY_SECTION.image}
              alt={CHURCH_HISTORY_SECTION.label}
              fill
              priority
              sizes="100vw"
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
          <p
            className="max-w-3xl text-sm leading-7"
            style={{ color: "var(--muted-foreground)" }}
          >
            Source: <em>History of the Christian Church</em> by Philip Schaff.
            Read the original at{" "}
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

                <div className="space-y-4 pl-4">
                  {subsection.directTopics.length > 0 ? (
                    <ol className="space-y-3">
                      {subsection.directTopics.map((topic, topicIndex) => (
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
                  ) : null}

                  {subsection.groups.map((group, groupIndex) => {
                    const groupNumber =
                      subsection.directTopics.length + groupIndex + 1;

                    return (
                      <section
                        id={`${subsection.slug}-${group.slug}`}
                        key={group.slug}
                        className="space-y-3 scroll-mt-24"
                      >
                        <div className="flex items-baseline">
                          <span className="w-16 flex-none text-base font-semibold">
                            {subsectionIndex + 1}.{groupNumber}.
                          </span>
                          <h3 className="flex-1 text-lg font-semibold">
                            {group.label}
                          </h3>
                        </div>

                        <ol className="space-y-3 pl-6">
                          {group.topics.map((topic, topicIndex) => (
                            <li key={topic.slug} className="list-none">
                              <Link
                                href={`/church-history/${subsection.slug}/${group.slug}/${topic.slug}`}
                                className="group flex items-baseline text-base leading-relaxed"
                              >
                                <span className="w-20 flex-none">
                                  {subsectionIndex + 1}.{groupNumber}.
                                  {topicIndex + 1}.
                                </span>
                                <span className="flex-1 underline-offset-4 group-hover:underline">
                                  {topic.title}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ol>
                      </section>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
