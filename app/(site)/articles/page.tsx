import type { Metadata } from "next";
import ArticlesBrowser from "@/components/ArticlesBrowser";
import { getAllArticles } from "@/lib/articles";
import { toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl("/logo-light.svg");

export const metadata: Metadata = {
  title: "கிறிஸ்தவ கட்டுரைகள் | Tamil Christian Articles",
  description:
    "வேதாகமம், விசுவாச வாழ்க்கை, மற்றும் கிறிஸ்தவ சிந்தனை குறித்து தமிழில் எழுதப்பட்ட கட்டுரைகளை வாசிக்கவும்.",
  keywords: [
    "கிறிஸ்தவ கட்டுரைகள்",
    "தமிழ் கட்டுரைகள்",
    "Tamil articles",
    "Tamil Christian articles",
    "Tamil Holy Bible",
    "Bible study notes",
    "Kirubai Sathiyam",
  ],
  alternates: {
    canonical: "/articles",
  },
  openGraph: {
    type: "website",
    url: "/articles",
    title: "கிறிஸ்தவ கட்டுரைகள் | Tamil Christian Articles",
    description:
      "வேதாகமம், விசுவாச வாழ்க்கை, மற்றும் கிறிஸ்தவ சிந்தனை குறித்து தமிழில் எழுதப்பட்ட கட்டுரைகளை வாசிக்கவும்.",
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: "கிறிஸ்தவ கட்டுரைகள் | Tamil Christian Articles",
    description:
      "வேதாகமம், விசுவாச வாழ்க்கை, மற்றும் கிறிஸ்தவ சிந்தனை குறித்து தமிழில் எழுதப்பட்ட கட்டுரைகளை வாசிக்கவும்.",
    images: [shareImage],
  },
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          கட்டுரைகள்
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          சமீபத்திய கட்டுரைகள் மற்றும் சிந்தனைகள்.
        </p>
      </header>

      <ArticlesBrowser articles={articles} />
    </div>
  );
}

