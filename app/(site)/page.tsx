import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, VolumeIcon } from "@/components/Icons";
import DailyDevotionOverlay from "@/components/DailyDevotionOverlay";
import RecentArticlesCarousel from "@/components/RecentArticlesCarousel";
import RecentTheologyCarousel from "@/components/RecentTheologyCarousel";
import { getAllArticles } from "@/lib/articles";
import { CHURCH_HISTORY_SECTION } from "@/lib/church-history";
import { formatTamilDate } from "@/lib/date";
import { toAbsoluteUrl } from "@/lib/seo";
import { getTheologySectionsWithTopics } from "@/lib/theology";

const shareImage = toAbsoluteUrl("/web-app-manifest-512x512.png");

export const metadata: Metadata = {
  title:
    "கிறிஸ்தவ கட்டுரைகள், வேதாகமம், இறையியல் | Tamil Christian Articles, Bible & Theology",
  description:
    "தமிழில் கிறிஸ்தவ கட்டுரைகள், திருச்சபை வரலாறு, இறையியல், தினசரி தியானங்கள், மற்றும் ஆய்வு குறிப்புகளுடன் தமிழ் வேதாகமத்தை வாசிக்கவும்.",
  keywords: [
    "தமிழ் கிறிஸ்தவ கட்டுரைகள்",
    "தமிழ் வேதாகமம்",
    "தமிழ் தினசரி தியானம்",
    "திருச்சபை வரலாறு",
    "தமிழ் இறையியல்",
    "Tamil Christian articles",
    "Tamil Holy Bible",
    "Tamil Bible",
    "Daily devotion in Tamil",
    "Tamil daily devotion",
    "Charles Spurgeon daily devotion",
    "Spurgeon morning and evening",
    "Church History in Tamil",
    "Tamil church history",
    "Study Bible Tamil",
    "Illustrated Bible",
    "Tamil Old Version",
    "Bible study notes",
    "Kirubai Sathiyam",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title:
      "கிறிஸ்தவ கட்டுரைகள், வேதாகமம், இறையியல் | Tamil Christian Articles, Bible & Theology",
    description:
      "தமிழில் கிறிஸ்தவ கட்டுரைகள், திருச்சபை வரலாறு, இறையியல், தினசரி தியானங்கள், மற்றும் ஆய்வு குறிப்புகளுடன் தமிழ் வேதாகமத்தை வாசிக்கவும்.",
    siteName: "Kirubai Sathiyam",
    images: [{ url: shareImage }],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "கிறிஸ்தவ கட்டுரைகள், வேதாகமம், இறையியல் | Tamil Christian Articles, Bible & Theology",
    description:
      "தமிழில் கிறிஸ்தவ கட்டுரைகள், திருச்சபை வரலாறு, இறையியல், தினசரி தியானங்கள், மற்றும் ஆய்வு குறிப்புகளுடன் தமிழ் வேதாகமத்தை வாசிக்கவும்.",
    images: [shareImage],
  },
};

export default function Home() {
  const articles = getAllArticles();
  const theologySections = getTheologySectionsWithTopics();
  const recentArticles = articles.slice(0, 6);

  return (
    <div className="space-y-16">
      <DailyDevotionOverlay />

      {/* <section className="mx-auto w-full max-w-5xl px-4">
        <Link
          href="/devotions"
          className="group grid overflow-hidden border sm:grid-cols-[0.7fr_1.1fr] md:grid-cols-[0.4fr_1.1fr]"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--muted-background)",
          }}
        >
          <div
            className="relative aspect-square border-b md:border-b-0 md:border-r"
            style={{ borderColor: "var(--border-color)" }}
          >
            <Image
              src="/images/spergon.jpg"
              alt="Daily devotion archive"
              fill
              sizes="(min-width: 768px) 32rem, 100vw"
              className="object-cover transition duration-300"
            />
          </div>

          <div className="flex flex-col justify-center gap-5 p-6 sm:p-8">
            <p
              className="text-sm leading-7 sm:text-base"
              style={{ color: "var(--muted-foreground)" }}
            >
              சார்ல்ஸ் ஸ்பர்ஜனின் காலை மற்றும் மாலை தியான களஞ்சியத்தை
              தினந்தோறும் தனிப்பட்ட பக்கங்களுடன் வாசிக்கலாம்.
            </p>

            <div className="flex items-center gap-2 text-md font-semibold sm:text-lg">
              <span className="group-hover:underline">
                தியான களஞ்சியத்தை திறக்கவும்
              </span>
              <ArrowRightIcon style={{ width: 15, height: 15 }} />
            </div>
          </div>
        </Link>
      </section> */}

      <section className="mx-auto w-full max-w-5xl px-4">
        <Link
          href="/bible"
          className="group grid overflow-hidden border sm:grid-cols-[0.7fr_1.1fr] md:grid-cols-[0.4fr_1.1fr]"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--muted-background)",
          }}
        >
          <div
            className="relative aspect-square border-b md:border-b-0 md:border-r"
            style={{ borderColor: "var(--border-color)" }}
          >
            <Image
              src="/images/bible.jpg"
              alt="Open Bible"
              fill
              sizes="(min-width: 768px) 32rem, 100vw"
              className="object-cover transition duration-300"
            />
          </div>

          <div className="flex flex-col justify-center gap-5 p-6 sm:p-8">
            <p
              className="text-sm leading-7 sm:text-base"
              style={{ color: "var(--muted-foreground)" }}
            >
              தினமும் வேதாகமம் வாசிப்பதை ஒரு பழக்கமாக்கிக்கொள்ளுங்கள்.
              கர்த்தருடைய வார்த்தை உங்களை வழிநடத்தட்டும்.
            </p>

            <div className="flex items-center gap-2 text-md font-semibold sm:text-lg">
              <span className="group-hover:underline">
                வேதாகமத்தைத் திறக்கவும்
              </span>
              <ArrowRightIcon style={{ width: 15, height: 15 }} />
            </div>
          </div>
        </Link>
      </section>

      <section className="mx-auto w-full max-w-5xl space-y-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">கட்டுரைகள்</h2>
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: "var(--muted-foreground)" }}
          >
            மேலும்
            <ArrowRightIcon style={{ width: 15, height: 15 }} />
          </Link>
        </div>
        <div className="sm:hidden">
          <RecentArticlesCarousel articles={recentArticles} />
        </div>
        <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {recentArticles.map((article) => (
            <Link
              href={`/articles/${article.slug}`}
              key={article.slug}
              className="flex h-full flex-col border"
              style={{ borderColor: "var(--border-color)" }}
            >
              {article.image && (
                <div
                  className="overflow-hidden border"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      sizes="(min-width: 1024px) 18rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-1">
                  {article.audio && (
                    <span
                      className="text-[0.8rem] opacity-70"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <VolumeIcon style={{ width: 15, height: 15 }} />
                    </span>
                  )}
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {article.type || "கட்டுரை"}
                  </p>
                </div>
                <div className="text-lg font-semibold leading-snug hover:underline">
                  {article.title}
                </div>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {formatTamilDate(article.date)} · {article.author}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl space-y-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">இறையியல்</h2>
          <Link
            href="/theology"
            className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
            style={{ color: "var(--muted-foreground)" }}
          >
            மேலும்
            <ArrowRightIcon style={{ width: 15, height: 15 }} />
          </Link>
        </div>
        <RecentTheologyCarousel sections={theologySections} />
      </section>

      <section className="mx-auto w-full max-w-5xl space-y-6 px-4">
        <h2 className="text-xl font-semibold">திருச்சபை வரலாறு</h2>
        <Link
          href="/church-history"
          className="group grid overflow-hidden border sm:grid-cols-[0.7fr_1.1fr] md:grid-cols-[0.4fr_1.1fr]"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--muted-background)",
          }}
        >
          <div
            className="relative aspect-square border-b md:border-b-0 md:border-r"
            style={{ borderColor: "var(--border-color)" }}
          >
            <Image
              src={CHURCH_HISTORY_SECTION.image}
              alt={CHURCH_HISTORY_SECTION.label}
              fill
              sizes="(min-width: 768px) 32rem, 100vw"
              className="object-cover transition duration-300"
            />
          </div>

          <div className="flex flex-col justify-center gap-5 p-6 sm:p-8">
            <p
              className="text-sm leading-7 sm:text-base"
              style={{ color: "var(--muted-foreground)" }}
            >
              {CHURCH_HISTORY_SECTION.description}
            </p>

            <div className="flex items-center gap-2 text-md font-semibold sm:text-lg">
              <span className="group-hover:underline">
                திருச்சபை வரலாற்றைப் பார்க்கவும்
              </span>
              <ArrowRightIcon style={{ width: 15, height: 15 }} />
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}
