import type { Metadata } from "next";
import { ArrowRightIcon } from "@/components/Icons";
import Link from "next/link";
import { toAbsoluteUrl } from "@/lib/seo";
import { getTheologySectionsWithTopics } from "@/lib/theology";

const shareImage = toAbsoluteUrl("/logo-light.svg");
const theologyDescription =
  "இறையியல் என்பது இறைவன், அவர் வெளிப்படுத்திய சத்தியம், மனிதன், பாவம், இரட்சிப்பு, சபை, மற்றும் விசுவாச வாழ்வு பற்றிய வேதாகம அடிப்படையிலான சிந்தனை. முறையியல் இறையியல் இவ்வுபதேசங்களை ஒழுங்குபடுத்துகிறது; சீர்திருத்த இறையியல் அவற்றை கிருபை, உடன்படிக்கை, மற்றும் இறையாட்சி என்ற கோணங்களில் வலியுறுத்துகிறது.";

export const metadata: Metadata = {
  title: "இறையியல்",
  description: theologyDescription,
  keywords: [
    "இறையியல்",
    "முறையியல் இறையியல்",
    "சீர்திருத்த இறையியல்",
    "தமிழ் கிறிஸ்தவ இறையியல்",
    "Kirubai Sathiyam",
  ],
  alternates: {
    canonical: "/theology",
  },
  openGraph: {
    type: "website",
    url: "/theology",
    title: "இறையியல்",
    description: theologyDescription,
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: "இறையியல்",
    description: theologyDescription,
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
          {theologyDescription}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            href={`/theology/${section.slug}`}
            key={section.slug}
            className="group flex h-full flex-col border"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--muted-background)",
            }}
          >
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold group-hover:underline">
                    {section.label}
                  </h2>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {section.description}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="mt-auto flex justify-end border-t p-5"
              style={{ borderColor: "var(--border-color)" }}
            >
              <span
                className="inline-flex items-center"
                aria-hidden="true"
              >
                <ArrowRightIcon style={{ width: 15, height: 15 }} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
