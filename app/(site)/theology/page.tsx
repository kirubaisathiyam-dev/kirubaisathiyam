import type { Metadata } from "next";
import Link from "next/link";
import { formatTamilDate } from "@/lib/date";
import { toAbsoluteUrl } from "@/lib/seo";
import { getTheologySectionsWithTopics } from "@/lib/theology";

const shareImage = toAbsoluteUrl("/logo-light.svg");

export const metadata: Metadata = {
  title: "இறையியல்",
  description:
    "முறையியல் இறையியல் மற்றும் சீர்திருத்த இறையியலின் தலைப்புகளை ஒழுங்காக வாசிக்கக்கூடிய பகுதி.",
  keywords: [
    "இறையியல்",
    "முறையியல் இறையியல்",
    "சீர்திருத்த இறையியல்",
    "தமிழ் இறையியல்",
    "Kirubai Sathiyam",
  ],
  alternates: {
    canonical: "/theology",
  },
  openGraph: {
    type: "website",
    url: "/theology",
    title: "இறையியல்",
    description:
      "முறையியல் இறையியல் மற்றும் சீர்திருத்த இறையியலின் தலைப்புகளை ஒழுங்காக வாசிக்கக்கூடிய பகுதி.",
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: "இறையியல்",
    description:
      "முறையியல் இறையியல் மற்றும் சீர்திருத்த இறையியலின் தலைப்புகளை ஒழுங்காக வாசிக்கக்கூடிய பகுதி.",
    images: [shareImage],
  },
};

export default function TheologyPage() {
  const sections = getTheologySectionsWithTopics();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          இறையியல்
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          தலைப்புகளின் அடிப்படையில் ஒழுங்குபடுத்தப்பட்ட இறையியல் குறிப்புகள்.
          இப்போது முறையியல் இறையியல் மற்றும் சீர்திருத்த இறையியல் பகுதிகள்
          சேர்க்கப்பட்டுள்ளன. பின்னர் மேலும் பகுதிகள் சேர்க்கலாம்.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.slug}
            className="flex h-full flex-col border"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">{section.label}</h2>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {section.description}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  {section.topics.length} தலைப்புகள்
                </span>
              </div>

              {section.topics.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  இன்னும் தலைப்புகள் சேர்க்கப்படவில்லை. Tina CMS-ல் முதல்
                  தலைப்பை உருவாக்கலாம்.
                </p>
              ) : (
                <ul className="space-y-3">
                  {section.topics.slice(0, 4).map((topic) => (
                    <li key={topic.slug}>
                      <Link
                        href={`/theology/${section.slug}/${topic.slug}`}
                        className="block rounded border px-4 py-3 transition hover:opacity-80"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <p className="font-medium leading-snug">{topic.title}</p>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {formatTamilDate(topic.date)} · {topic.author}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className="mt-auto border-t p-5"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Link
                href={`/theology/${section.slug}`}
                className="text-sm font-semibold hover:underline"
              >
                பகுதியைப் பார் →
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
