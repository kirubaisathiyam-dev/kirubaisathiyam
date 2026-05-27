import type { Metadata } from "next";
import { Suspense } from "react";
import BibleReader from "@/components/BibleReader";
import { BibleReaderSkeleton } from "@/components/PageSkeletons";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl("/web-app-manifest-512x512.png");
const siteUrl = getSiteUrl().toString();

export const metadata: Metadata = {
  title: "Tamil Holy Bible Reader",
  description:
    "Read the Tamil Holy Bible online with study notes, illustrated Bible references, and old Tamil Bible versions.",
  keywords: [
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
    title: "Tamil Holy Bible Reader",
    description:
      "Read the Tamil Holy Bible online with study notes, illustrated Bible references, and old Tamil Bible versions.",
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
    title: "Tamil Holy Bible Reader",
    description:
      "Read the Tamil Holy Bible online with study notes, illustrated Bible references, and old Tamil Bible versions.",
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
