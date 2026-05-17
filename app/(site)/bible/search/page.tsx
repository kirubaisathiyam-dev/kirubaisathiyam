import { Suspense } from "react";
import type { Metadata } from "next";
import BibleSearchPage from "@/components/BibleSearchPage";
import { toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl("/web-app-manifest-512x512.png");

export const metadata: Metadata = {
  title: "Bible Search",
  description:
    "Search the Tamil Holy Bible offline by word, phrase, book, or verse reference.",
  alternates: {
    canonical: "/bible/search",
  },
  openGraph: {
    type: "website",
    url: "/bible/search",
    title: "Bible Search",
    description:
      "Search the Tamil Holy Bible offline by word, phrase, book, or verse reference.",
    images: [{ url: shareImage, width: 512, height: 512, type: "image/png" }],
  },
};

export default function BibleSearchRoute() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border px-5 py-8 text-sm sm:px-6" style={{ borderColor: "var(--border-color)" }}>
            தேடல் ஏற்றப்படுகிறது...
          </div>
        </div>
      }
    >
      <BibleSearchPage />
    </Suspense>
  );
}
