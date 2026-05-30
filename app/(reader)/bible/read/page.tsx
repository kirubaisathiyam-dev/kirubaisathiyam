import type { Metadata } from "next";
import { Suspense } from "react";
import BibleReader from "@/components/BibleReader";
import { BibleReaderSkeleton } from "@/components/PageSkeletons";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl("/web-app-manifest-512x512.png");
const siteUrl = getSiteUrl().toString();

export const metadata: Metadata = {
  title: "தமிழ் வேதாகம வாசிப்பு | Tamil Bible Reader",
  description:
    "ஆய்வு குறிப்புகள், விளக்கங்கள், மற்றும் பழைய தமிழ் பதிப்புகளுடன் தமிழ் வேதாகமத்தை ஆன்லைனில் வாசிக்கவும்.",
  keywords: [
    "தமிழ் வேதாகம வாசிப்பு",
    "வேதாகம ஆய்வு",
    "Tamil Holy Bible",
    "Tamil Bible",
    "Study Bible Tamil",
    "Illustrated Bible",
    "Tamil Old Version",
    "Bible reader",
    "Kirubai Sathiyam",
  ],
  alternates: {
    canonical: "/bible/read",
  },
  openGraph: {
    type: "website",
    url: "/bible/read",
    title: "தமிழ் வேதாகம வாசிப்பு | Tamil Bible Reader",
    description:
      "ஆய்வு குறிப்புகள், விளக்கங்கள், மற்றும் பழைய தமிழ் பதிப்புகளுடன் தமிழ் வேதாகமத்தை ஆன்லைனில் வாசிக்கவும்.",
    siteName: "Kirubai Sathiyam",
    images: [
      {
        url: shareImage,
        width: 512,
        height: 512,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "தமிழ் வேதாகம வாசிப்பு | Tamil Bible Reader",
    description:
      "ஆய்வு குறிப்புகள், விளக்கங்கள், மற்றும் பழைய தமிழ் பதிப்புகளுடன் தமிழ் வேதாகமத்தை ஆன்லைனில் வாசிக்கவும்.",
    images: [shareImage],
  },
};

export default function BibleReadPage() {
  return (
    <Suspense fallback={<BibleReaderSkeleton />}>
      <BibleReader siteUrl={siteUrl} />
    </Suspense>
  );
}
