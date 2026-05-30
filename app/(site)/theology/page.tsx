import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { toAbsoluteUrl } from "@/lib/seo";
import { getTheologySectionsWithTopics } from "@/lib/theology";

const shareImage = toAbsoluteUrl("/logo.png");
const theologyDescription =
  "இறையியல் என்பது தேவன், அவர் வெளிப்படுத்திய சத்தியம், மனிதன், பாவம், இரட்சிப்பு, சபை, மற்றும் விசுவாச வாழ்க்கை குறித்து வேதாகம அடிப்படையில் சிந்திக்கும் ஆய்வு. முறைமையியல் இறையியல் இந்த போதனைகளை ஒழுங்குபடுத்துகிறது; சீர்திருத்த இறையியல் அவற்றை கிருபை, உடன்படிக்கை, மற்றும் இறையாட்சியின் கோணத்தில் வலியுறுத்துகிறது.";

export const metadata: Metadata = {
  title: "இறையியல் | Theology in Tamil",
  description: theologyDescription,
  keywords: [
    "இறையியல்",
    "முறைமையியல் இறையியல்",
    "சீர்திருத்த இறையியல்",
    "தமிழ் கிறிஸ்தவ இறையியல்",
    "Theology",
    "Theology in Tamil",
    "Tamil theology",
    "Systematic theology in Tamil",
    "Reformed theology in Tamil",
    "Kirubai Sathiyam",
  ],
  alternates: {
    canonical: "/theology",
  },
  openGraph: {
    type: "website",
    url: "/theology",
    title: "இறையியல் | Theology in Tamil",
    description: theologyDescription,
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: "இறையியல் | Theology in Tamil",
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
            {section.image && (
              <div
                className="relative aspect-square w-full overflow-hidden border-b"
                style={{ borderColor: "var(--border-color)" }}
              >
                <Image
                  src={section.image}
                  alt={section.label}
                  fill
                  sizes="(min-width: 768px) 24rem, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </div>
            )}
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

          </Link>
        ))}
      </div>
    </div>
  );
}
