import type { Metadata } from "next";
import BibleFrontPage from "@/components/BibleFrontPage";
import { toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl("/web-app-manifest-512x512.png");

export const metadata: Metadata = {
  title: "Tamil Holy Bible",
  description:
    "Choose a book and chapter from the Tamil Holy Bible and open the dedicated reader with study notes.",
  keywords: [
    "Tamil Holy Bible",
    "Tamil Bible",
    "Bible chapters",
    "Study Bible Tamil",
    "Kirubai Sathiyam",
  ],
  alternates: {
    canonical: "/bible",
  },
  openGraph: {
    type: "website",
    url: "/bible",
    title: "Tamil Holy Bible",
    description:
      "Choose a book and chapter from the Tamil Holy Bible and open the dedicated reader with study notes.",
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
    title: "Tamil Holy Bible",
    description:
      "Choose a book and chapter from the Tamil Holy Bible and open the dedicated reader with study notes.",
    images: [shareImage],
  },
};

export default function BiblePage() {
  return <BibleFrontPage />;
}
