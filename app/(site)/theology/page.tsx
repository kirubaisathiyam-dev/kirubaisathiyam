import type { Metadata } from "next";
import { ArrowRightIcon } from "@/components/Icons";
import Link from "next/link";
import { toAbsoluteUrl } from "@/lib/seo";
import { getTheologySectionsWithTopics } from "@/lib/theology";

const shareImage = toAbsoluteUrl("/logo-light.svg");

export const metadata: Metadata = {
  title: "இறையியல்",
  description:
    "முக்கிய பிரிவிலிருந்து உட்பிரிவுக்கு சென்று இறையியல் தலைப்புகளை வாசிக்கலாம். ஒவ்வொரு தலைப்பும் தனித்தனி markdown கோப்பாகச் சேமிக்கப்பட்டு கட்டுரை வாசிப்பு வடிவில் திறக்கும்.",
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
    description:
      "முக்கிய பிரிவிலிருந்து உட்பிரிவுக்கு சென்று இறையியல் தலைப்புகளை வாசிக்கலாம். ஒவ்வொரு தலைப்பும் தனித்தனி markdown கோப்பாகச் சேமிக்கப்பட்டு கட்டுரை வாசிப்பு வடிவில் திறக்கும்.",
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: "இறையியல்",
    description:
      "முக்கிய பிரிவிலிருந்து உட்பிரிவுக்கு சென்று இறையியல் தலைப்புகளை வாசிக்கலாம். ஒவ்வொரு தலைப்பும் தனித்தனி markdown கோப்பாகச் சேமிக்கப்பட்டு கட்டுரை வாசிப்பு வடிவில் திறக்கும்.",
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
          முக்கிய பிரிவிலிருந்து உட்பிரிவுக்கு சென்று இறையியல் தலைப்புகளை
          வாசிக்கலாம். ஒவ்வொரு தலைப்பும் தனித்தனி markdown கோப்பாகச்
          சேமிக்கப்பட்டு கட்டுரை வாசிப்பு வடிவில் திறக்கும்.
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
              </div>
            </div>

            <div
              className="mt-auto border-t p-5"
              style={{ borderColor: "var(--border-color)" }}
            >
              <Link
                href={`/theology/${section.slug}`}
                className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
              >
                பிரிவைத் திறக்க
                <ArrowRightIcon style={{ width: 15, height: 15 }} />
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
