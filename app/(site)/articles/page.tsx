import type { Metadata } from "next";
import ArticlesBrowser from "@/components/ArticlesBrowser";
import { getAllArticles } from "@/lib/articles";
import { toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl("/logo-light.svg");

export const metadata: Metadata = {
  title: "Tamil Christian Articles & Bible",
  description:
    "Browse Tamil Christian articles and access the Tamil Holy Bible with study notes.",
  keywords: [
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
    title: "Tamil Christian Articles & Bible",
    description:
      "Browse Tamil Christian articles and access the Tamil Holy Bible with study notes.",
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: "Tamil Christian Articles & Bible",
    description:
      "Browse Tamil Christian articles and access the Tamil Holy Bible with study notes.",
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


