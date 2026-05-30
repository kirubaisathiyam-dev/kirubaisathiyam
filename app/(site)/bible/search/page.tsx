import { Suspense } from "react";
import type { Metadata } from "next";
import BibleSearchPage from "@/components/BibleSearchPage";
import { BibleSearchPageSkeleton } from "@/components/PageSkeletons";
import { toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl("/web-app-manifest-512x512.png");

export const metadata: Metadata = {
  title: "வேதாகம தேடல் | Bible Search in Tamil",
  description:
    "தமிழ் வேதாகமத்தில் சொல், சொற்றொடர், புத்தகம், அதிகாரம், அல்லது வசனக் குறிப்பின்படி தேடுங்கள்.",
  alternates: {
    canonical: "/bible/search",
  },
  openGraph: {
    type: "website",
    url: "/bible/search",
    title: "வேதாகம தேடல் | Bible Search in Tamil",
    description:
      "தமிழ் வேதாகமத்தில் சொல், சொற்றொடர், புத்தகம், அதிகாரம், அல்லது வசனக் குறிப்பின்படி தேடுங்கள்.",
    images: [{ url: shareImage, width: 512, height: 512, type: "image/png" }],
  },
};

export default function BibleSearchRoute() {
  return (
    <Suspense
      fallback={
        <BibleSearchPageSkeleton />
      }
    >
      <BibleSearchPage />
    </Suspense>
  );
}
