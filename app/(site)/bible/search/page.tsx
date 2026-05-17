import { Suspense } from "react";
import type { Metadata } from "next";
import BibleSearchPage from "@/components/BibleSearchPage";
import LoadingIndicator from "@/components/LoadingIndicator";
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
        <LoadingIndicator className="mx-auto max-w-5xl px-4 py-12 sm:px-6" />
      }
    >
      <BibleSearchPage />
    </Suspense>
  );
}
