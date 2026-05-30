import type { Metadata } from "next";
import BibleFrontPage from "@/components/BibleFrontPage";
import { toAbsoluteUrl } from "@/lib/seo";

const shareImage = toAbsoluteUrl("/web-app-manifest-512x512.png");

export const metadata: Metadata = {
  title: "தமிழ் வேதாகமம் | Tamil Holy Bible",
  description:
    "தமிழ் வேதாகமத்தில் புத்தகத்தையும் அதிகாரத்தையும் தேர்ந்து வாசிக்கவும்; தனி அதிகாரப் பக்கங்கள், வசனத் தேர்வு, மற்றும் ஆய்வு குறிப்புகளுடன்.",
  keywords: [
    "தமிழ் வேதாகமம்",
    "தமிழ் பைபிள்",
    "அதிகாரம் வாரியாக வேதாகமம்",
    "Tamil Holy Bible",
    "Tamil Bible",
    "Bible chapter in Tamil",
    "Tamil Bible verse by verse",
    "Matthew chapter in Tamil",
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
    title: "தமிழ் வேதாகமம் | Tamil Holy Bible",
    description:
      "தமிழ் வேதாகமத்தில் புத்தகத்தையும் அதிகாரத்தையும் தேர்ந்து வாசிக்கவும்; தனி அதிகாரப் பக்கங்கள், வசனத் தேர்வு, மற்றும் ஆய்வு குறிப்புகளுடன்.",
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
    title: "தமிழ் வேதாகமம் | Tamil Holy Bible",
    description:
      "தமிழ் வேதாகமத்தில் புத்தகத்தையும் அதிகாரத்தையும் தேர்ந்து வாசிக்கவும்; தனி அதிகாரப் பக்கங்கள், வசனத் தேர்வு, மற்றும் ஆய்வு குறிப்புகளுடன்.",
    images: [shareImage],
  },
};

export default function BiblePage() {
  return <BibleFrontPage />;
}
