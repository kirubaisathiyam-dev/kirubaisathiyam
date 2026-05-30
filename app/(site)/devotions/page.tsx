import type { Metadata } from "next";
import DevotionsArchive from "@/components/DevotionsArchive";
import { type DailyDevotionRecord } from "@/lib/daily-devotion";
import { toAbsoluteUrl } from "@/lib/seo";
import dailyDevotionRecords from "@/public/daily-devotion.json";

const shareImage = toAbsoluteUrl("/logo-light.svg");

export const metadata: Metadata = {
  title: "Daily Devotions in Tamil",
  description:
    "Read daily morning and evening devotions in Tamil from Charles Spurgeon at Kirubai Sathiyam.",
  keywords: [
    "Daily devotion",
    "Daily devotion in Tamil",
    "Tamil daily devotion",
    "Charles Spurgeon daily devotion",
    "Spurgeon morning and evening",
    "Morning and evening devotion",
    "Spurgeon day by day devotion",
    "Kirubai Sathiyam",
  ],
  alternates: {
    canonical: "/devotions",
  },
  openGraph: {
    type: "website",
    url: "/devotions",
    title: "Daily Devotions in Tamil",
    description:
      "Read daily morning and evening devotions in Tamil from Charles Spurgeon at Kirubai Sathiyam.",
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary",
    title: "Daily Devotions in Tamil",
    description:
      "Read daily morning and evening devotions in Tamil from Charles Spurgeon at Kirubai Sathiyam.",
    images: [shareImage],
  },
};

export default function DevotionsPage() {
  const records = dailyDevotionRecords as DailyDevotionRecord[];

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          தமிழ் தினசரி தியானங்கள்
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          சார்ல்ஸ் ஸ்பர்ஜனின் காலை மற்றும் மாலை தியான களஞ்சியம்.
        </p>
      </header>

      <DevotionsArchive records={records} />
    </div>
  );
}
